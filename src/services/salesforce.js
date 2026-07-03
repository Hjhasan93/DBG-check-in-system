// src/services/salesforce.js
//
// Salesforce REST client for the DBG check-in kiosk. Replaces the Express
// backend + the hardcoded config files (hosts/students/watchlist).
//
// Auth: the kiosk never holds the client secret. It asks the server-side token
// proxy (`VITE_SF_TOKEN_URL` -> /api/token) for a short-lived access token, then
// calls the Salesforce REST API directly with it. See DEVELOPER_API_REFERENCE.md.

const TOKEN_URL = import.meta.env.VITE_SF_TOKEN_URL || "/api/token";
const API_VERSION = "v64.0";

// The REST base URL. We prefer the instance_url returned by the token proxy,
// and fall back to the configured env var.
let instanceUrl = import.meta.env.VITE_SF_INSTANCE_URL || "";
let token = null;

// ---- Reason -> restricted picklist mapping (must match the org exactly) ----
// Keyed by reasons.js `key`. Visit_Reason__c can't just reuse the UI label
// (e.g. the "student" reason shows "DBG Student" but the picklist value is "Student").
const VISIT_REASON_BY_KEY = {
  tour: "Tour",
  parent: "Parent/Guardian",
  appointment: "Appointment",
  contractor: "Contractor/Vendor",
  volunteer: "Volunteer",
  student: "Student",
  work: "Employee",
  other: "Other",
};
const BADGE_TYPE_BY_KEY = {
  tour: "TOUR",
  parent: "GUARDIAN",
  appointment: "VISITOR",
  contractor: "CONTRACTOR",
  volunteer: "VOLUNTEER",
  student: "STUDENT",
  work: "STAFF",
  other: "VISITOR",
};

// ---------------------------------------------------------------------------
// Auth + low-level fetch
// ---------------------------------------------------------------------------

async function authenticate() {
  const res = await fetch(TOKEN_URL, { method: "POST" });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  token = data.access_token;
  if (data.instance_url) instanceUrl = data.instance_url;
  return token;
}

function apiBase() {
  return `${instanceUrl}/services/data/${API_VERSION}`;
}

// Core REST helper with one automatic re-auth on 401.
async function sfFetch(path, options = {}, _retried = false) {
  if (!token) await authenticate();

  const res = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401 && !_retried) {
    token = null;
    await authenticate();
    return sfFetch(path, options, true);
  }
  return res;
}

async function query(soql) {
  const res = await sfFetch(`/query?q=${encodeURIComponent(soql)}`);
  if (!res.ok) throw new Error(`Query failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.records || [];
}

async function create(sobject, fields) {
  const res = await sfFetch(`/sobjects/${sobject}`, {
    method: "POST",
    body: JSON.stringify(fields),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(`Create ${sobject} failed: ${JSON.stringify(data)}`);
  }
  return data; // { id, success, errors }
}

// Escape a value for safe inclusion in a single-quoted SOQL literal.
function soqlStr(v) {
  return String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

// ---------------------------------------------------------------------------
// 1. Hosts  (replaces src/config/hosts.js)
// ---------------------------------------------------------------------------
export async function getHosts() {
  const records = await query(
    `SELECT Id, Name FROM User
     WHERE IsActive = true AND Profile.Name = 'DBG Standard User'
     ORDER BY Name`
  );
  return records.map((u) => ({ id: u.Id, name: u.Name }));
}

// ---------------------------------------------------------------------------
// 2. Students for the Tour flow  (replaces src/config/students.js)
// ---------------------------------------------------------------------------
export async function getStudents() {
  const records = await query(
    `SELECT Id, FirstName, LastName FROM Contact
     WHERE Current_Student__c = true
     ORDER BY LastName, FirstName`
  );
  return records.map((c) => ({
    id: c.Id,
    name: `${c.FirstName || ""} ${c.LastName || ""}`.trim(),
  }));
}

// ---------------------------------------------------------------------------
// 3. Watchlist  (replaces src/config/watchlist.js)
// Load once on startup / refresh periodically. The note is for STAFF ONLY —
// never display it to the visitor.
// ---------------------------------------------------------------------------
export async function getWatchlist() {
  const records = await query(
    `SELECT Id, FirstName, LastName, Phone, Email, Visitor_Watchlist_Note__c
     FROM Contact WHERE Visitor_Watchlist__c = true`
  );
  return records.map((c) => ({
    id: c.Id,
    firstName: c.FirstName || "",
    lastName: c.LastName || "",
    phone: c.Phone || "",
    email: c.Email || "",
    note: c.Visitor_Watchlist_Note__c || "",
  }));
}

// ---------------------------------------------------------------------------
// 4. Find an existing visitor Contact (precedence, no picker)
//    email -> phone -> first+last name -> most recently updated.
//    Returns the Contact Id, or null if none match.
// ---------------------------------------------------------------------------
export async function findContact({ email, phone, firstName, lastName }) {
  const attempts = [];
  if (email) {
    attempts.push(`Email = '${soqlStr(email)}'`);
  }
  if (phone) {
    const p = soqlStr(phone);
    attempts.push(`Phone = '${p}' OR MobilePhone = '${p}'`);
  }
  if (firstName && lastName) {
    attempts.push(`FirstName = '${soqlStr(firstName)}' AND LastName = '${soqlStr(lastName)}'`);
  }

  for (const where of attempts) {
    const records = await query(
      `SELECT Id FROM Contact WHERE ${where}
       ORDER BY LastModifiedDate DESC LIMIT 1`
    );
    if (records.length) return records[0].Id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 5. Create a new visitor Contact. Returns the new Contact Id.
// ---------------------------------------------------------------------------
export async function createContact({ firstName, lastName, phone, email }) {
  const body = { FirstName: firstName, LastName: lastName };
  if (phone) body.Phone = phone;
  if (email) body.Email = email;
  const res = await create("Contact", body);
  return res.id;
}

// Convenience: reuse an existing Contact if found, otherwise create one.
export async function findOrCreateContact({ firstName, lastName, phone, email }) {
  const existing = await findContact({ email, phone, firstName, lastName });
  if (existing) return existing;
  return createContact({ firstName, lastName, phone, email });
}

// ---------------------------------------------------------------------------
// 6. Create the check-in Event. Returns the new Event Id.
//    `visit` is the VisitContext shape; `contactId` is the visitor's Contact.
//    `visit.host` should be the selected host's User Id (or "" if none).
// ---------------------------------------------------------------------------
let recordTypeIdCache = null;

export async function getCheckInRecordTypeId() {
  if (recordTypeIdCache) return recordTypeIdCache;
  const records = await query(
    `SELECT Id FROM RecordType
     WHERE SObjectType = 'Event' AND DeveloperName = 'Visitor_Check_In' LIMIT 1`
  );
  if (!records.length) throw new Error("Visitor_Check_In record type not found");
  recordTypeIdCache = records[0].Id;
  return recordTypeIdCache;
}

export async function createCheckIn(visit, contactId) {
  const recordTypeId = await getCheckInRecordTypeId();
  const start = new Date();
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const fullName = `${visit.firstName || ""} ${visit.lastName || ""}`.trim();

  const body = {
    RecordTypeId: recordTypeId,
    Subject: `Visitor Check-In: ${fullName}`,
    StartDateTime: start.toISOString(),
    EndDateTime: end.toISOString(),
    WhoId: contactId,
    Visit_Reason__c: VISIT_REASON_BY_KEY[visit.reasonKey] || "Other",
    Badge_Type__c: BADGE_TYPE_BY_KEY[visit.reasonKey] || "VISITOR",
  };

  // Conditional fields — only include what applies.
  if (visit.host) body.Host__c = visit.host; // User Id from the host picker
  if (visit.tourStudentId) body.Tour_Student__c = visit.tourStudentId;
  if (visit.waiverAccepted) {
    body.Waiver_Accepted__c = true;
    body.Waiver_Signed_Name__c = visit.waiverSignedName || "";
    body.Waiver_Signed_At__c = visit.waiverSignedAt || start.toISOString();
  }

  const res = await create("Event", body);
  return res.id;
}

// ---------------------------------------------------------------------------
// 7. Upload the visitor photo as a Salesforce File linked to the Contact.
//    Returns the ContentDocumentId (stored on Contact.Visitor_Photo_ID__c).
// ---------------------------------------------------------------------------
export async function uploadPhoto(contactId, photoDataUrl, visitorName = "Visitor") {
  if (!photoDataUrl || !photoDataUrl.startsWith("data:image/")) return null;

  // data URL -> Blob
  const base64 = photoDataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "image/jpeg" });

  // Step 1: ContentVersion (multipart). Do NOT set Content-Type — the browser
  // adds the multipart boundary. We call fetch directly (not sfFetch) for this.
  if (!token) await authenticate();
  const form = new FormData();
  form.append(
    "entity_content",
    new Blob(
      [JSON.stringify({ Title: `Visitor Photo - ${visitorName}`, PathOnClient: "visitor-photo.jpg" })],
      { type: "application/json" }
    )
  );
  form.append("VersionData", blob, "visitor-photo.jpg");

  const cvRes = await fetch(`${apiBase()}/sobjects/ContentVersion`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const cv = await cvRes.json().catch(() => ({}));
  if (!cvRes.ok || !cv.id) throw new Error(`Photo upload failed: ${JSON.stringify(cv)}`);

  // Step 2: get the ContentDocumentId
  const docs = await query(`SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${soqlStr(cv.id)}'`);
  const contentDocumentId = docs[0]?.ContentDocumentId;
  if (!contentDocumentId) throw new Error("Could not resolve ContentDocumentId");

  // Step 3: link the file to the Contact
  await create("ContentDocumentLink", {
    ContentDocumentId: contentDocumentId,
    LinkedEntityId: contactId,
    ShareType: "V",
    Visibility: "AllUsers",
  });

  // Step 4: store the reference on the Contact
  const patch = await sfFetch(`/sobjects/Contact/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify({ Visitor_Photo_ID__c: contentDocumentId }),
  });
  if (!patch.ok && patch.status !== 204) {
    throw new Error(`Storing photo reference failed: ${patch.status}`);
  }
  return contentDocumentId;
}

// ---------------------------------------------------------------------------
// 10. Log a watchlist hit as a completed Task on the visitor's Contact.
//     Silent background record for staff — the visitor never sees this.
// ---------------------------------------------------------------------------
export async function logWatchlistHit({ contactId, firstName, lastName, matchedBy, note }) {
  const body = {
    Subject: `Watchlist Hit: ${`${firstName || ""} ${lastName || ""}`.trim()}`,
    Description: `Visitor matched watchlist during kiosk check-in.\nMatched by: ${matchedBy || ""}\nNote: ${note || ""}`,
    Status: "Completed",
    Priority: "High",
    ActivityDate: new Date().toISOString().slice(0, 10),
  };
  if (contactId) body.WhoId = contactId;
  const res = await create("Task", body);
  return res.id;
}

// ---------------------------------------------------------------------------
// 8/9. Admin: list check-in Events + a single detail.
// ---------------------------------------------------------------------------
export async function listVisits(limit = 200) {
  return query(
    `SELECT Id, Subject, StartDateTime, CreatedDate,
            Who.FirstName, Who.LastName,
            Host__c, Host__r.Name,
            Visit_Reason__c, Badge_Type__c,
            Waiver_Accepted__c, Waiver_Signed_Name__c, Waiver_Signed_At__c,
            Tour_Student__c, Tour_Student__r.FirstName, Tour_Student__r.LastName
     FROM Event
     WHERE RecordType.DeveloperName = 'Visitor_Check_In'
     ORDER BY CreatedDate DESC
     LIMIT ${Number(limit) || 200}`
  );
}

export async function getVisit(eventId) {
  const records = await query(
    `SELECT Id, Subject, StartDateTime, EndDateTime, CreatedDate,
            Who.Id, Who.FirstName, Who.LastName, Who.Phone, Who.Email,
            Host__c, Host__r.Name,
            Visit_Reason__c, Badge_Type__c,
            Waiver_Accepted__c, Waiver_Signed_Name__c, Waiver_Signed_At__c,
            Tour_Student__c, Tour_Student__r.FirstName, Tour_Student__r.LastName
     FROM Event
     WHERE Id = '${soqlStr(eventId)}' AND RecordType.DeveloperName = 'Visitor_Check_In'
     LIMIT 1`
  );
  return records[0] || null;
}

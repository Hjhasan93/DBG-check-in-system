# Salesforce API Reference for DBG Check-In Kiosk

Developer reference for connecting the React kiosk app to Salesforce. All data operations currently handled by the Express backend will be replaced with Salesforce REST API calls.

## Connection Details

### Staging Sandbox

```
Instance URL: https://dbgdetroit--staging.sandbox.my.salesforce.com
Login URL:    https://test.salesforce.com
API Version:  v64.0
```

### Production (when ready)

```
Instance URL: https://dbgdetroit.my.salesforce.com
Login URL:    https://login.salesforce.com
API Version:  v64.0
```

### Environment Variables

Replace the current `VITE_BACKEND_URL` with:

```env
VITE_SF_LOGIN_URL=https://test.salesforce.com
VITE_SF_INSTANCE_URL=https://dbgdetroit--staging.sandbox.my.salesforce.com
VITE_SF_CLIENT_ID=<from External Client App — ask Matt>
VITE_SF_CLIENT_SECRET=<from External Client App — ask Matt>
```

---

## Authentication: OAuth 2.0 Client Credentials

The kiosk authenticates as the `DBG Kiosk` integration user using the client credentials flow. No interactive login is required.

### Token Request

```
POST {LOGIN_URL}/services/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
```

### Token Response

```json
{
  "access_token": "00D...",
  "instance_url": "https://dbgdetroit--staging.sandbox.my.salesforce.com",
  "token_type": "Bearer"
}
```

### Using the Token

Every REST API call includes the token as a header:

```
Authorization: Bearer {access_token}
```

### Token Lifecycle

- Tokens are valid for ~2 hours (session timeout setting in the org).
- Cache the token and reuse it. When a call returns `401`, request a new token and retry.
- **Security note:** The client secret should not be exposed in browser-side JavaScript in production. For the kiosk on a controlled network this is acceptable during development. For a hosted deployment, use a thin serverless proxy (Vercel/Netlify function) that exchanges credentials server-side and returns just the access token.

### Example: `src/services/salesforce.js` skeleton

```js
const LOGIN_URL = import.meta.env.VITE_SF_LOGIN_URL;
const INSTANCE_URL = import.meta.env.VITE_SF_INSTANCE_URL;
const CLIENT_ID = import.meta.env.VITE_SF_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SF_CLIENT_SECRET;

const API = `${INSTANCE_URL}/services/data/v64.0`;

let token = null;

async function authenticate() {
  const res = await fetch(`${LOGIN_URL}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  token = data.access_token;
  return token;
}

async function sfFetch(path, options = {}) {
  if (!token) await authenticate();

  let res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Auto-refresh on 401
  if (res.status === 401) {
    await authenticate();
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  return res;
}

async function query(soql) {
  const res = await sfFetch(`/query?q=${encodeURIComponent(soql)}`);
  if (!res.ok) throw new Error(`Query failed: ${res.status}`);
  const data = await res.json();
  return data.records;
}

async function create(sobject, fields) {
  const res = await sfFetch(`/sobjects/${sobject}`, {
    method: "POST",
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Create ${sobject} failed: ${JSON.stringify(err)}`);
  }
  return res.json(); // { id, success, errors }
}
```

---

## API Operations

### 1. Get Hosts

Replaces the hardcoded `src/config/hosts.js` array.

**SOQL:**

```sql
SELECT Id, Name
FROM User
WHERE IsActive = true
  AND Profile.Name = 'DBG Standard User'
ORDER BY Name
```

**Response shape:**

```json
[
  { "Id": "005...", "Name": "Em Barnes" },
  { "Id": "005...", "Name": "Laura Amtower" },
  { "Id": "005...", "Name": "Skylar Burkhardt" }
]
```

**Usage:** Display `Name` in the host picker. Store the selected `Id` to write into the Event's `Host__c` field.

---

### 2. Get Students (for Tour flow)

Replaces the hardcoded `src/config/students.js` array.

**SOQL:**

```sql
SELECT Id, FirstName, LastName
FROM Contact
WHERE Current_Student__c = true
ORDER BY LastName, FirstName
```

**Response shape:**

```json
[
  { "Id": "003...", "FirstName": "Aaliyah", "LastName": "Johnson" },
  { "Id": "003...", "FirstName": "Marcus", "LastName": "Williams" }
]
```

**Usage:** Display `FirstName LastName` in the student picker (TouringWith screen). Store the selected `Id` for the Event's `Tour_Student__c` field.

---

### 3. Get Watchlist

Replaces the hardcoded `src/config/watchlist.js` array. Load this once on app startup and refresh periodically.

**SOQL:**

```sql
SELECT Id, FirstName, LastName, Phone, Email, Visitor_Watchlist_Note__c
FROM Contact
WHERE Visitor_Watchlist__c = true
```

**Response shape:**

```json
[
  {
    "Id": "003...",
    "FirstName": "John",
    "LastName": "Doe",
    "Phone": "3135551234",
    "Email": "john.doe@gmail.com",
    "Visitor_Watchlist_Note__c": "Do not admit, call supervisor"
  }
]
```

**Usage:** After the visitor enters their info on the AboutYou screen, compare `firstName`, `lastName`, `phone`, `email` against this list. If matched, route to the Watchlist screen and display `Visitor_Watchlist_Note__c`.

---

### 4. Search for Existing Visitor (Contact)

Before creating a new Contact, search for an existing one by phone or email.

**SOQL (search by phone):**

```sql
SELECT Id, FirstName, LastName, Phone, MobilePhone, Email
FROM Contact
WHERE Phone = '3135551234'
   OR MobilePhone = '3135551234'
LIMIT 5
```

**SOQL (search by email):**

```sql
SELECT Id, FirstName, LastName, Phone, MobilePhone, Email
FROM Contact
WHERE Email = 'visitor@example.com'
LIMIT 5
```

**Usage:** If an existing Contact is found, reuse their `Id` as the Event's `WhoId`. If not found, create a new Contact (see next operation).

---

### 5. Create New Visitor (Contact)

If no existing Contact matches, create one.

**REST:**

```
POST /sobjects/Contact
```

**Request body:**

```json
{
  "FirstName": "Jane",
  "LastName": "Doe",
  "Phone": "3135559999",
  "Email": "jane@example.com"
}
```

**Response:**

```json
{
  "id": "003...",
  "success": true,
  "errors": []
}
```

**Usage:** Use the returned `id` as the Event's `WhoId`.

---

### 6. Create Check-In (Event)

This is the core operation — creates the visit record in Salesforce.

**REST:**

```
POST /sobjects/Event
```

**Request body:**

```json
{
  "RecordTypeId": "<Visitor_Check_In Record Type ID>",
  "Subject": "Visitor Check-In: Jane Doe",
  "StartDateTime": "2026-04-10T14:30:00.000Z",
  "EndDateTime": "2026-04-10T15:00:00.000Z",
  "WhoId": "003...",
  "Host__c": "005...",
  "Visit_Reason__c": "Tour",
  "Badge_Type__c": "TOUR",
  "Waiver_Accepted__c": true,
  "Waiver_Signed_Name__c": "Jane Doe",
  "Waiver_Signed_At__c": "2026-04-10T14:28:00.000Z",
  "Tour_Student__c": "003..."
}
```

#### Getting the Record Type ID

Query it once on app startup and cache it:

```sql
SELECT Id
FROM RecordType
WHERE SObjectType = 'Event'
  AND DeveloperName = 'Visitor_Check_In'
```

#### Field Mapping from VisitContext

| VisitContext field | Event API field | Notes |
|---|---|---|
| — | `RecordTypeId` | Queried from RecordType (see above) |
| — | `Subject` | Build as `"Visitor Check-In: {firstName} {lastName}"` |
| — | `StartDateTime` | `new Date().toISOString()` at check-in time |
| — | `EndDateTime` | Set to StartDateTime + 30 minutes |
| — | `WhoId` | Contact Id (from search or create) |
| `host` | `Host__c` | User Id from host picker |
| `reasonLabel` | `Visit_Reason__c` | Must match picklist value exactly (see table below) |
| `badgeType` | `Badge_Type__c` | Must match picklist value exactly (see table below) |
| `waiverAccepted` | `Waiver_Accepted__c` | Boolean |
| `waiverSignedName` | `Waiver_Signed_Name__c` | String, max 120 chars |
| `waiverSignedAt` | `Waiver_Signed_At__c` | ISO 8601 datetime string |
| `tourStudentId` | `Tour_Student__c` | Contact Id of the student |

#### Visit Reason + Badge Type Picklist Values

These must be sent exactly as shown — they're restricted picklists.

| reasons.js `key` | `Visit_Reason__c` value | `Badge_Type__c` value |
|---|---|---|
| `tour` | `Tour` | `TOUR` |
| `parent` | `Parent/Guardian` | `GUARDIAN` |
| `appointment` | `Appointment` | `VISITOR` |
| `contractor` | `Contractor/Vendor` | `CONTRACTOR` |
| `volunteer` | `Volunteer` | `VOLUNTEER` |
| `student` | `Student` | `STUDENT` |
| `work` | `Employee` | `STAFF` |
| `other` | `Other` | `VISITOR` |

#### Conditional Fields

Not every check-in has every field. Only include what applies:

- **`Host__c`**: Only when `hostRequired: true` for the selected reason (Tour, Appointment)
- **`Waiver_*` fields**: Only when `waiverRequired: true` (Volunteer)
- **`Tour_Student__c`**: Only for Tour reason
- **`WhoId`**: Always include (the visitor's Contact Id)

---

### 7. Upload Visitor Photo

Photos are stored as Salesforce Files (ContentVersion) linked to the visitor's Contact record.

#### Step 1: Create ContentVersion

```
POST /sobjects/ContentVersion
```

**Request body (multipart/form-data):**

```
Content-Type: multipart/form-data; boundary=----FormBoundary

------FormBoundary
Content-Disposition: form-data; name="entity_content"
Content-Type: application/json

{
  "Title": "Visitor Photo - Jane Doe",
  "PathOnClient": "visitor-photo.jpg",
  "Description": "Kiosk check-in photo"
}
------FormBoundary
Content-Disposition: form-data; name="VersionData"; filename="visitor-photo.jpg"
Content-Type: image/jpeg

<binary image data>
------FormBoundary--
```

**Converting photoDataUrl to binary:**

```js
// photoDataUrl is a base64 data URL from the camera capture
const base64 = photoDataUrl.split(",")[1];
const binary = atob(base64);
const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) {
  bytes[i] = binary.charCodeAt(i);
}
const blob = new Blob([bytes], { type: "image/jpeg" });
```

**Response:**

```json
{
  "id": "068...",
  "success": true,
  "errors": []
}
```

#### Step 2: Get the ContentDocumentId

```sql
SELECT ContentDocumentId
FROM ContentVersion
WHERE Id = '068...'
```

#### Step 3: Link to the Contact

```
POST /sobjects/ContentDocumentLink
```

```json
{
  "ContentDocumentId": "069...",
  "LinkedEntityId": "003...",
  "ShareType": "V",
  "Visibility": "AllUsers"
}
```

#### Step 4: Store the reference on Contact

```
PATCH /sobjects/Contact/003...
```

```json
{
  "Visitor_Photo_ID__c": "069..."
}
```

**Usage:** `Visitor_Photo_ID__c` stores the ContentDocument ID so the admin panel can display the photo later.

---

### 8. List Visits (Admin Panel)

Replaces `GET /visits` from the Express backend.

**SOQL:**

```sql
SELECT Id, Subject, StartDateTime, CreatedDate,
       Who.FirstName, Who.LastName,
       Host__c, Host__r.Name,
       Visit_Reason__c, Badge_Type__c,
       Waiver_Accepted__c, Waiver_Signed_Name__c, Waiver_Signed_At__c,
       Tour_Student__c, Tour_Student__r.FirstName, Tour_Student__r.LastName
FROM Event
WHERE RecordType.DeveloperName = 'Visitor_Check_In'
ORDER BY CreatedDate DESC
LIMIT 200
```

**Response mapping to current AdminVisits table columns:**

| Table column | SOQL field |
|---|---|
| Time | `CreatedDate` |
| Visitor | `Who.FirstName` + `Who.LastName` |
| Reason | `Visit_Reason__c` |
| Host | `Host__r.Name` |
| Touring With | `Tour_Student__r.FirstName` + `Tour_Student__r.LastName` |
| Waiver | `Waiver_Accepted__c` (boolean — display "Signed" if true) |

---

### 9. Get Visit Detail (Admin Panel)

Replaces the detail view in `AdminVisitDetail.jsx`.

**SOQL:**

```sql
SELECT Id, Subject, StartDateTime, EndDateTime, CreatedDate,
       Who.Id, Who.FirstName, Who.LastName, Who.Phone, Who.Email,
       Host__c, Host__r.Name,
       Visit_Reason__c, Badge_Type__c,
       Waiver_Accepted__c, Waiver_Signed_Name__c, Waiver_Signed_At__c,
       Tour_Student__c, Tour_Student__r.FirstName, Tour_Student__r.LastName
FROM Event
WHERE Id = '{eventId}'
  AND RecordType.DeveloperName = 'Visitor_Check_In'
```

---

### 10. Log Watchlist Hit

When a visitor matches the watchlist, log the hit. Create a Task record linked to the visitor's Contact.

**REST:**

```
POST /sobjects/Task
```

```json
{
  "Subject": "Watchlist Hit: John Doe",
  "WhoId": "003...",
  "Description": "Visitor matched watchlist during kiosk check-in.\nMatched by: phone\nNote: Do not admit, call supervisor",
  "Status": "Completed",
  "Priority": "High",
  "ActivityDate": "2026-04-10"
}
```

**Note:** The kiosk integration user needs Task Create permission for this operation. This is not yet configured — let Matt know when you're ready to implement this and we'll add it.

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning | Action |
|---|---|---|
| `200` | Success | Process response |
| `201` | Created | Record created successfully |
| `204` | No Content | Update/delete successful |
| `400` | Bad Request | Check field values (e.g., invalid picklist value) |
| `401` | Unauthorized | Token expired — re-authenticate and retry |
| `403` | Forbidden | Permission issue — contact Matt |
| `404` | Not Found | Record or endpoint doesn't exist |

### Salesforce Error Response Format

```json
[
  {
    "message": "Visit Reason: bad value for restricted picklist field: Invalid",
    "errorCode": "INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST",
    "fields": ["Visit_Reason__c"]
  }
]
```

---

## What Stays the Same

These parts of the app don't change:

- **`src/config/reasons.js`** — Visit reason definitions stay as-is. The `label` values already match the Salesforce picklist values and the `badgeType` values match `Badge_Type__c`.
- **Screen flow / routing** — Same screens in the same order.
- **Badge printing** — No changes.
- **VisitContext shape** — Same fields, just add Salesforce IDs (`contactId`, `eventId`) to track the records created during the flow.

## What Gets Removed

- **`backend/`** — Entire Express server directory
- **`src/config/hosts.js`** — Replaced by User query
- **`src/config/students.js`** — Replaced by Contact query
- **`src/config/watchlist.js`** — Replaced by Contact query
- **`src/utils/adminFetch.js`** — Replaced by `src/services/salesforce.js`

## What Gets Created

- **`src/services/salesforce.js`** — OAuth + REST API client (see skeleton above)

---

## Quick Start

1. Get the Client ID and Client Secret from Matt
2. Copy `.env` and add the Salesforce variables
3. Build `src/services/salesforce.js` using the skeleton above
4. Test authentication first: call `authenticate()` and confirm you get a token
5. Test a read query: call `query("SELECT Id, Name FROM User WHERE IsActive = true LIMIT 5")` and confirm you get results
6. Start replacing the hardcoded data files one at a time (hosts, students, watchlist)
7. Build the check-in Event creation last (it depends on the Contact search/create flow)

If you hit permission errors (403), let Matt know which operation failed and we'll update the permission set.

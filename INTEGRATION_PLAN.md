# DBG Check-In Kiosk: Salesforce Integration Plan

## Overview

Replace the Express/JSON backend with Salesforce as the backend, connected via an External Client App (OAuth 2.0 client-credentials). The React kiosk app calls the Salesforce REST API directly for data operations, getting its access token from a small server-side **token proxy** so the client secret never ships in the browser bundle (see Phase 3).

## Architecture

```
+------------------+     OAuth 2.0       +------------------------+
|  React Kiosk     | <----------------> |  Salesforce Org         |
|  (Vite SPA)      |   Client Creds     |  (External Client       |
|                  |   + REST API       |   App connection)       |
|  Hosted on       |                    |                         |
|  Render/Vercel   |                    |  Objects:               |
|  or self-hosted  |                    |  - Contact (visitors)   |
+------------------+                    |  - Event (check-ins)    |
                                        |  - User (hosts)         |
                                        |  - ContentVersion       |
                                        |    (photos)             |
                                        +------------------------+
```

## Data Model Mapping

### Contact (Visitor / Student)

Most Contact fields already exist. New custom fields are needed for the watchlist, photo, and visitor waiver (see notes below).

| Kiosk Field | Salesforce Field | Status |
|---|---|---|
| firstName / lastName | `FirstName`, `LastName` | Exists |
| phone | `Phone` / `MobilePhone` | Exists |
| email | `Email` | Exists |
| watchlist flag | `Visitor_Watchlist__c` (Checkbox) | **New field** |
| watchlist note | `Visitor_Watchlist_Note__c` (Text 255) | **New field** |
| photo | `Visitor_Photo_ID__c` (Text 18) | **New field** — stores ContentDocument ID |
| visitor waiver | See open question below — may live on Contact or Event | **TBD** |
| student flag | `Current_Student__c` (Formula) | Exists |
| tour fields | `Tour_Attendee__c`, `Tour_Contact__c`, `Tour_Interest__c`, `Tour_Type__c` | Exists |

**Why new watchlist fields?** The existing `caseman__WatchList__c` and `caseman__WatchListDate__c` are managed package fields (Case Manager). Using them would require a paid caseman license for the integration user. Custom fields avoid that dependency.

**Why new photo field?** The existing `caseman__PhotoFileID__c` is also a Case Manager managed field — same license concern.

**Why not `Handbook_and_Waiver_Completed__c`?** That field tracks student handbook acknowledgment, a different process. It should not be repurposed for kiosk visitor waivers.

### Event (Check-In Record)

Events will use a new Record Type to separate kiosk check-ins from regular calendar events.

| Kiosk Field | Salesforce Field | Status |
|---|---|---|
| visitor | `WhoId` (Lookup to Contact) | Exists |
| host | `Host__c` (Lookup to User) | **New field** — a dedicated field, NOT `OwnerId` (see note) |
| date/time | `StartDateTime` / `EndDateTime` | Exists |
| visit reason | `Visit_Reason__c` (Picklist) | **New field** |
| badge type | `Badge_Type__c` (Picklist) | **New field** |
| waiver accepted | `Waiver_Accepted__c` (Checkbox) | **New field** |
| waiver signed name | `Waiver_Signed_Name__c` (Text 120) | **New field** |
| waiver signed at | `Waiver_Signed_At__c` (DateTime) | **New field** |
| tour student | `Tour_Student__c` (Lookup to Contact) | **New field** |
| photo | Attached as `ContentVersion` linked via `ContentDocumentLink` | Standard mechanism |

**Why `Host__c` instead of `OwnerId`?** `OwnerId` controls record sharing and puts the check-in on that person's calendar — if the kiosk creates 50 events/day owned by a staff member, their calendar fills up. So the **integration user stays the record owner**, and the selected host goes in a dedicated **`Host__c` (Lookup to User)** field instead.

### User (Hosts)

Hosts are active Salesforce Users. The kiosk will query Users dynamically instead of using a hardcoded list.

Current hardcoded hosts map to these Salesforce Users:

| Kiosk Host | Salesforce User | Username | Notes |
|---|---|---|---|
| ~~Hasan~~ | — | — | App developer, no SF user. Remove from host list. |
| E | Em Barnes | `ebarnes@dbgdetroit.org` | |
| Skylar | Skylar Burkhardt | `sburkhardt@dbgdetroit.org` | |
| Laura | Laura Amtower | `lamtower@dbgdetroit.org` | |

---

## Phase 1: Salesforce Configuration

### 1A. External Client App Setup

- Create an External Client App in Setup > External Client Apps
- Configure OAuth 2.0 with **Client Credentials** flow (machine-to-machine, no user login)
- Create a **new dedicated integration user** for the kiosk (do not reuse `DBG Systems`)
- Scopes: `api`

### 1A-ii. New Integration User: `DBG Kiosk`

> **As built:** the integration user is named **"Kiosk Integration"** (`kiosk@dbgdetroit.org.staging`) and the External Client App is **`DBG_Kiosk`** (client-credentials, scope `api`, run-as this user) — both already exist in staging.

Follow the same pattern used by the existing `DBG Systems` user:

- **Profile**: `Minimum Access - API Only Integrations`
- **Permission Sets**: Create kiosk-specific equivalents of the `Systems_Standard_Permissions` and `Systems_Custom_Permissions` pattern:
  - `Kiosk_Standard_Permissions` — standard object access (Contact read, Event create/read, User read, ContentVersion create)
  - `Kiosk_Custom_Permissions` — custom field access for kiosk-specific fields (Visit_Reason__c, Badge_Type__c, Waiver fields, Tour_Student__c, Visitor_Watchlist__c, Visitor_Watchlist_Note__c, Visitor_Photo_ID__c, etc.)
- **Permission Set Group**: `Kiosk_Check_In` — bundles both permission sets for clean assignment
- Assign the External Client App's client credentials flow to run as this user

### 1B. New Event Record Type

- **Developer Name**: `Visitor_Check_In`
- **Label**: Visitor Check-In
- Separates kiosk events from regular calendar Events

### 1C. New Custom Fields on Event

| Field Label | API Name | Type | Picklist Values |
|---|---|---|---|
| Visit Reason | `Visit_Reason__c` | Picklist | Tour, Parent/Guardian, Appointment, Contractor/Vendor, Volunteer, Student, Employee, Other |
| Badge Type | `Badge_Type__c` | Picklist | TOUR, GUARDIAN, VISITOR, CONTRACTOR, VOLUNTEER, STUDENT, STAFF |
| Waiver Accepted | `Waiver_Accepted__c` | Checkbox | — |
| Waiver Signed Name | `Waiver_Signed_Name__c` | Text(120) | — |
| Waiver Signed At | `Waiver_Signed_At__c` | DateTime | — |
| Tour Student | `Tour_Student__c` | Lookup(Contact) | — |
| Host | `Host__c` | Lookup(User) | — |

> `Visit_Reason__c` and `Badge_Type__c` are **restricted** picklists — send the exact values from the mapping table in `DEVELOPER_API_REFERENCE.md`, and their values must be assigned to the `Visitor_Check_In` record type (confirmed at the pilot).

### 1D. Permission Sets — **built & deployed to staging**

Bundled into the `Kiosk_Check_In` permission set group, assigned to the integration user. The integration user runs on the **Salesforce Integration license**, which has two consequences the permission sets account for:

- **`Kiosk_Standard_Permissions`**: Contact (Read/Create/Edit), ContentVersion (Create), `Visitor_Check_In` record-type visibility, plus the **`ActivitiesAccess` / `EditEvent` / `EditTask` user permissions** for Task/Event access (Activity CRUD can't be granted through object permissions on this license), `ApiEnabled`, and `ViewAllUsers` (for the host query).
- **`Kiosk_Custom_Permissions`**: field-level security for the kiosk custom fields on Event/Contact **plus** the standard fields the kiosk writes that need FLS — `Contact.Phone/MobilePhone/Email`, `Event.WhoId`, and `Task.WhoId/ActivityDate/Description`.

---

## Phase 2: React App Refactoring

### 2A. New Salesforce API Client

Create `src/services/salesforce.js`:

1. Authenticate via OAuth 2.0 client credentials flow to get an access token
2. Cache and auto-refresh the token
3. Expose methods for each API operation

### 2B. API Operations

| Operation | Salesforce REST API | Replaces |
|---|---|---|
| Search/match visitor | `GET /query?q=SELECT ... FROM Contact WHERE ...` | Local lookup |
| Create new visitor | `POST /sobjects/Contact` | N/A (new capability) |
| Get hosts | `GET /query?q=SELECT Id,Name FROM User WHERE IsActive=true AND Profile.Name='DBG Standard User'` | Hardcoded `hosts.js` |
| Get students | `GET /query?q=SELECT Id,Name FROM Contact WHERE Current_Student__c=true` | Hardcoded `students.js` |
| Check watchlist | `GET /query?q=SELECT Id,FirstName,LastName,Phone,Email,Visitor_Watchlist_Note__c FROM Contact WHERE Visitor_Watchlist__c=true` | Hardcoded `watchlist.js` |
| Create check-in | `POST /sobjects/Event` (RecordTypeId = Visitor_Check_In) | `POST /visits` to Express |
| Upload photo | `POST /sobjects/ContentVersion` + `POST /sobjects/ContentDocumentLink` | `photoDataUrl` in JSON body |
| Admin: list visits | `GET /query?q=SELECT ... FROM Event WHERE RecordType.DeveloperName='Visitor_Check_In' ORDER BY CreatedDate DESC` | `GET /visits` from Express |
| Log watchlist hit | Create Event with a note, or update Contact fields | `POST /watchlist-hit` to Express |

### 2C. Files to Remove

- `backend/` — entire Express server (replaced by Salesforce API)
- `src/config/hosts.js` — replaced by live User query
- `src/config/students.js` — replaced by live Contact query
- `src/config/watchlist.js` — replaced by live Contact query
- `src/utils/adminFetch.js` — replaced by Salesforce API client

### 2D. Files to Keep (modified)

- `src/config/reasons.js` — keep as UI config (maps to `Visit_Reason__c` picklist values)
- `src/context/VisitContext.jsx` — update shape to include Salesforce IDs
- All screen components — update to use new Salesforce service instead of Express fetch calls

### 2E. Environment Variables

Replace:
```
VITE_BACKEND_URL=http://localhost:5050
```

With just the token-proxy endpoint + REST base. The Client ID/Secret live in the **proxy's server-side environment**, never in the app bundle:
```
VITE_SF_TOKEN_URL=/api/token
VITE_SF_INSTANCE_URL=https://dbgdetroit--staging.sandbox.my.salesforce.com
```

---

## Phase 3: Security Considerations

### Token Handling — the proxy comes BEFORE the React refactor

**Decision (agreed in PR #1):** the OAuth client-credentials exchange happens in a **thin server-side proxy** — a single `POST /api/token` endpoint (Vercel/Netlify function or similar) that exchanges credentials server-side and returns just the access token to the kiosk. The client secret never enters the JS bundle. This proxy must be stood up **before** the Phase 2 React refactor, not after — `VITE_` variables are baked into the build, so a browser-direct exchange would leak the secret in DevTools.

The proxy also **rehomes the admin PIN login** (`POST /api/admin/login`): the current Express backend that validates the PIN is removed in Phase 2, so that check moves onto the proxy.

### Integration User Scoping

The dedicated `DBG Kiosk` integration user + `Kiosk_Check_In` permission set group should be scoped to only the objects/fields the kiosk needs. No access to Opportunities, Cases, or other sensitive data.

---

## Phase 4: Deployment

1. Host the React SPA on Vercel, Render, or similar static host
2. Store OAuth credentials as environment variables (not in code)
3. Configure CORS on the Salesforce org to allow the hosted domain
4. (If using serverless proxy) Deploy the token exchange function alongside the SPA

---

## Open Questions

1. ~~**Who is "Hasan"?**~~ — Resolved: app developer, no SF user. Remove from host list.
2. ~~**Visitor waiver location**~~ — **Resolved:** on the **Event, per visit** (`Waiver_Accepted__c` / `Waiver_Signed_Name__c` / `Waiver_Signed_At__c`).
3. ~~**Watchlist hit logging**~~ — **Resolved:** log a **Task** (completed activity) linked to the Contact, and keep the Contact-level watchlist fields. See `DEVELOPER_API_REFERENCE.md` Operation 10.
4. ~~**Admin panel auth**~~ — **Resolved:** keep the **PIN**; the check moves from the Express backend onto the token proxy (`/api/admin/login`).
5. ~~**Visitor matching**~~ — **Resolved:** search for an existing Contact first (email → phone → first+last name → most recently updated), **no picker**. See `DEVELOPER_API_REFERENCE.md` Operation 4.
6. ~~**Badge printing**~~ — **Resolved:** stays **browser-based**, no change.

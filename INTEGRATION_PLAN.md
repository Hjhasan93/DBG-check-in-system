# DBG Check-In Kiosk: Salesforce Integration Plan

## Overview

Replace the Express/JSON backend with Salesforce as the backend, connected via an External Client App (OAuth 2.0). The React kiosk app will call the Salesforce REST API directly for all data operations.

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
| host | `OwnerId` (Lookup to User) | Exists |
| date/time | `StartDateTime` / `EndDateTime` | Exists |
| visit reason | `Visit_Reason__c` (Picklist) | **New field** |
| badge type | `Badge_Type__c` (Picklist) | **New field** |
| waiver accepted | `Waiver_Accepted__c` (Checkbox) | **New field** |
| waiver signed name | `Waiver_Signed_Name__c` (Text 120) | **New field** |
| waiver signed at | `Waiver_Signed_At__c` (DateTime) | **New field** |
| tour student | `Tour_Student__c` (Lookup to Contact) | **New field** |
| photo | Attached as `ContentVersion` linked via `ContentDocumentLink` | Standard mechanism |

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

### 1D. Permission Sets (see 1A-ii above)

Bundled into the `Kiosk_Check_In` permission set group:

- **`Kiosk_Standard_Permissions`**: Contact (Read), Event (Create, Read — Visitor_Check_In RT only), ContentVersion (Create), User (Read)
- **`Kiosk_Custom_Permissions`**: Field-level access for kiosk-specific custom fields on Event and Contact

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

With:
```
VITE_SF_LOGIN_URL=https://login.salesforce.com
VITE_SF_INSTANCE_URL=https://dbgdetroit--staging.sandbox.my.salesforce.com
VITE_SF_CLIENT_ID=<from External Client App>
VITE_SF_CLIENT_SECRET=<from External Client App>
```

---

## Phase 3: Security Considerations

### Token Handling

The OAuth client credentials exchange should happen through a **thin proxy** (e.g., a Vercel/Netlify edge function or small serverless function) rather than directly in the browser. This prevents exposing the client secret in front-end code.

Options:
1. **Serverless proxy** (recommended) — a single `/api/token` endpoint that exchanges credentials server-side and returns the access token to the kiosk
2. **Browser-direct** (acceptable for locked-down kiosk on controlled network) — simpler but exposes client secret in JS bundle

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
2. **Visitor waiver location** — should waiver acceptance (signed name, timestamp) live on Contact (one-time) or on Event (per visit)? Needs client input.
3. **Watchlist hit logging** — should this create a separate Event/Task, update a field on Contact, or both?
4. **Admin panel auth** — should the admin panel continue using a PIN, or switch to Salesforce login (OAuth web flow)?
5. **Visitor matching** — when a visitor checks in, should the kiosk search for an existing Contact by name/phone/email, or always create a new one?
6. **Badge printing** — does the badge printing mechanism need any changes, or does it stay browser-based?

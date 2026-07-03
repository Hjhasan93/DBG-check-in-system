# DBG Visitor Check-In Kiosk

A touchscreen kiosk for visitor check-in at Downtown Boxing Gym. React 19 + Vite,
with **Salesforce as the backend** (the old Express/JSON backend has been retired).

## How it works

```
Kiosk (React SPA)  ──POST /api/token──►  Token proxy  ──client-credentials──►  Salesforce
      │                                  (holds secret)                         (DBG org)
      └──────────── REST (Bearer token) ──────────────────────────────────────►
```

- The kiosk **never holds the Salesforce client secret**. It asks the server-side
  proxy (`/api/token`) for a short-lived access token, then calls the Salesforce
  REST API directly. All Salesforce logic lives in `src/services/salesforce.js`.
- The admin PIN is checked by the proxy at `/api/admin/login`.
- Data model: visitors → Contact, check-ins → Event (`Visitor_Check_In` record
  type), hosts → User, students → Contact, photos → Salesforce Files, watchlist
  hits → Task. Full API contract: **`DEVELOPER_API_REFERENCE.md`**. Plan +
  decisions: **`INTEGRATION_PLAN.md`**.

## Project layout

- `src/` — the React kiosk app (screens, `services/salesforce.js`, context)
- `api/token.js` — serverless: OAuth client-credentials exchange (secret stays here)
- `api/admin/login.js` — serverless: admin PIN check (bcrypt)
- `vercel.json` — SPA routing for the static host

## Environment variables

Frontend (safe, in `.env` — baked into the bundle):

```env
VITE_SF_TOKEN_URL=/api/token
VITE_SF_INSTANCE_URL=https://dbgdetroit--staging.sandbox.my.salesforce.com
```

Proxy / server-side (set in the Vercel project settings — **never** commit these):

```
SF_LOGIN_URL=https://dbgdetroit--staging.sandbox.my.salesforce.com
SF_CLIENT_ID=<DBG_Kiosk consumer key>
SF_CLIENT_SECRET=<DBG_Kiosk consumer secret — from Matt>
ADMIN_PIN_HASH=<bcrypt hash of the admin PIN>
ADMIN_TOKEN=<random opaque token>
KIOSK_ORIGIN=https://<your-kiosk-app>.vercel.app
```

Generate an `ADMIN_PIN_HASH`: `node -e "console.log(require('bcryptjs').hashSync('1234', 10))"`.

## Local development

The app + the `/api` functions run together with the Vercel CLI:

```bash
npm install
npm i -g vercel        # once
vercel dev             # serves the SPA and /api/* locally
```

(`npm run dev` runs only the Vite front-end — the `/api/token` and
`/api/admin/login` calls will 404 without `vercel dev` or a deployed proxy.)

## Deploy

Host on Vercel (static Vite build + the `api/` functions deploy together). Set the
proxy env vars above in the Vercel project settings, then deploy.

## Security notes

- **Set `KIOSK_ORIGIN`** to the kiosk's exact origin in production. The proxy fails
  closed (no `*`); when unset, only `localhost` is allowed (dev convenience).
- **`/api/token` mints a Salesforce token without a user login** (the kiosk needs
  Salesforce access before any admin PIN). CORS only stops cross-origin *browser*
  callers, so reduce blast radius by: scoping the `DBG_Kiosk` External Client App to
  the minimum objects/fields the kiosk needs, and restricting the deployment to the
  kiosk's network (IP allowlist). The most robust option is to have the proxy make the
  Salesforce calls itself so no token reaches the browser — a worthwhile follow-up if
  this is ever exposed beyond a controlled kiosk network.
- Add **per-IP rate limiting** on `/api/admin/login` (e.g. Vercel KV / Upstash) before
  any non-controlled deployment — serverless functions don't carry the old
  express-rate-limit.

## Status / what's left

- ✅ Token proxy, admin-login proxy, and the full Salesforce client are built; every
  screen reads/writes Salesforce; the app builds clean.
- ⏳ Needs the `DBG_Kiosk` **client secret** in the proxy env, then an end-to-end
  test as the integration user (create Contact + Event + photo + watchlist Task).
- ⏳ Physical kiosk testing (camera, badge printer) and production deploy.

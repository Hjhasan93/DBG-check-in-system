// POST /api/token  — Salesforce token proxy (serverless)
//
// Performs the OAuth 2.0 client-credentials exchange SERVER-SIDE so the
// Salesforce client secret never ships in the browser bundle. The kiosk calls
// this endpoint (no credentials in the request) and gets back only a short-lived
// access token + instance URL.
//
// Server-side environment variables (set in Vercel project settings — NOT in the
// app bundle, NOT committed):
//   SF_LOGIN_URL     Salesforce token host (org My Domain for client-credentials),
//                    e.g. https://dbgdetroit--staging.sandbox.my.salesforce.com
//   SF_CLIENT_ID     DBG_Kiosk External Client App consumer key
//   SF_CLIENT_SECRET DBG_Kiosk consumer secret
//   KIOSK_ORIGIN     allowed browser origin(s) for CORS, comma-separated
//                    (e.g. https://<app>.vercel.app). REQUIRED in production — when
//                    unset, only localhost is allowed (dev only). Never "*".
//
// SECURITY: this endpoint mints a Salesforce access token for the kiosk with no user
// login (the kiosk needs Salesforce access before any admin PIN, so it can't sit
// behind the admin flow). CORS/Origin checks only stop cross-origin *browser*
// callers, not a non-browser client that can reach this URL. Reduce the blast radius
// by (1) scoping the DBG_Kiosk External Client App to the minimum objects/fields the
// kiosk needs, and (2) restricting the deployment to the kiosk's network (IP
// allowlist). The fully robust option is to have the proxy make the Salesforce calls
// itself so no token ever reaches the browser (see INTEGRATION_PLAN.md).

import { applyCors } from "./_cors.js";

const LOGIN_URL = process.env.SF_LOGIN_URL;
const CLIENT_ID = process.env.SF_CLIENT_ID;
const CLIENT_SECRET = process.env.SF_CLIENT_SECRET;

export default async function handler(req, res) {
  const allowed = applyCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Reject cross-origin browser callers whose Origin isn't allow-listed.
  if ((req.headers.origin || "") && !allowed) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  if (!LOGIN_URL || !CLIENT_ID || !CLIENT_SECRET) {
    return res
      .status(500)
      .json({ error: "Proxy misconfigured: SF_LOGIN_URL / SF_CLIENT_ID / SF_CLIENT_SECRET" });
  }

  try {
    const sfRes = await fetch(`${LOGIN_URL}/services/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const data = await sfRes.json();

    if (!sfRes.ok) {
      // Surface only Salesforce's error code — never echo the credentials.
      return res.status(502).json({
        error: "Salesforce token request failed",
        detail: data.error || `HTTP ${sfRes.status}`,
      });
    }

    // Return only what the kiosk needs. The client secret stays here.
    return res.status(200).json({
      access_token: data.access_token,
      instance_url: data.instance_url,
      token_type: data.token_type || "Bearer",
    });
  } catch {
    return res.status(502).json({ error: "Token proxy could not reach Salesforce" });
  }
}

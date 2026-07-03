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
//   KIOSK_ORIGIN     allowed browser origin for CORS (e.g. https://<app>.vercel.app);
//                    defaults to "*" for local dev

const LOGIN_URL = process.env.SF_LOGIN_URL;
const CLIENT_ID = process.env.SF_CLIENT_ID;
const CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const ALLOWED_ORIGIN = process.env.KIOSK_ORIGIN || "*";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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

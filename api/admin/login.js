// POST /api/admin/login  — kiosk admin PIN check (serverless)
//
// Rehomes the admin PIN check off the retired Express backend. On a correct PIN
// it returns an opaque admin token that the admin UI stores to unlock /admin.
// (The admin panel reads visit/watchlist data from Salesforce, not from here.)
//
// Server-side environment variables (Vercel project settings):
//   ADMIN_PIN_HASH  bcrypt hash of the admin PIN
//   ADMIN_TOKEN     opaque token returned to the client on a correct PIN
//   KIOSK_ORIGIN    allowed browser origin for CORS (defaults to "*" for local dev)
//
// NOTE: serverless functions are stateless, so the old express-rate-limit on PIN
// attempts isn't carried over. For a kiosk on a controlled network this is
// acceptable; if this is ever exposed publicly, add rate limiting via a shared
// store (e.g. Vercel KV / Upstash) before launch.

import bcrypt from "bcryptjs";

const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const ALLOWED_ORIGIN = process.env.KIOSK_ORIGIN || "*";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const pin = body.pin;
  if (!pin) return res.status(400).json({ error: "PIN required" });

  if (!ADMIN_PIN_HASH || !ADMIN_TOKEN) {
    return res.status(500).json({ error: "Proxy misconfigured: ADMIN_PIN_HASH / ADMIN_TOKEN" });
  }

  const ok = await bcrypt.compare(String(pin), ADMIN_PIN_HASH);
  if (!ok) return res.status(401).json({ error: "Invalid PIN" });

  return res.status(200).json({ token: ADMIN_TOKEN });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

// POST /api/admin/login  — kiosk admin PIN check (serverless)
//
// Rehomes the admin PIN check off the retired Express backend. On a correct PIN
// it returns an opaque admin token that the admin UI stores to unlock /admin.
// (The admin panel reads visit/watchlist data from Salesforce, not from here.)
//
// Server-side environment variables (Vercel project settings):
//   ADMIN_PIN_HASH  bcrypt hash of the admin PIN
//   ADMIN_TOKEN     opaque token returned to the client on a correct PIN
//   KIOSK_ORIGIN    allowed browser origin(s) for CORS, comma-separated. REQUIRED in
//                   production; when unset, only localhost is allowed (dev only). Never "*".
//
// NOTE: serverless functions are stateless, so the old express-rate-limit on PIN
// attempts isn't carried over. For a kiosk on a controlled network this is
// acceptable; if this is ever exposed publicly, add rate limiting via a shared
// store (e.g. Vercel KV / Upstash) before launch.

import bcrypt from "bcryptjs";
import { applyCors } from "../_cors.js";

const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export default async function handler(req, res) {
  const allowed = applyCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Reject cross-origin browser callers whose Origin isn't allow-listed.
  if ((req.headers.origin || "") && !allowed) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

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

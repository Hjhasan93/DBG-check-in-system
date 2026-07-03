// Shared CORS handling for the kiosk proxy endpoints.
//
// Fail closed — never reflect a wildcard "*". In production, KIOSK_ORIGIN must be
// set to the kiosk's exact origin (a comma-separated allowlist is supported).
// When KIOSK_ORIGIN is unset, only localhost origins are allowed, purely as a
// local-dev convenience.
//
// Returns the allowed origin string (or "" if the request's Origin is not
// allowed). NOTE: CORS is a browser-enforced control — it does not stop a
// non-browser client that can reach the proxy directly. See the security notes
// in api/token.js.
export function applyCors(req, res) {
  const configured = (process.env.KIOSK_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.origin || "";

  let allow = "";
  if (configured.length) {
    if (configured.includes(origin)) allow = origin;
  } else if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    allow = origin; // dev only — KIOSK_ORIGIN not configured
  }

  if (allow) {
    res.setHeader("Access-Control-Allow-Origin", allow);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return allow;
}

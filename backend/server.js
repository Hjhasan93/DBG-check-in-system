// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Admin auth
// 1) set ADMIN_PIN_HASH in backend .env (bcrypt hash of your PIN)
// 2) set ADMIN_TOKEN in backend .env (any random string)
const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "dev-admin-token";

const VISITS_FILE = path.join(__dirname, "visits.json");




// ====== MIDDLEWARE ======
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));

function readVisits() {
  if (!fs.existsSync(VISITS_FILE)) return [];
  return JSON.parse(fs.readFileSync(VISITS_FILE, "utf-8"));
}

function writeVisits(arr) {
  fs.writeFileSync(VISITS_FILE, JSON.stringify(arr, null, 2), "utf-8");
}

function getToken(req) {
  const auth = req.headers.authorization || "";
  const headerToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const queryToken = (req.query.token || "").toString();
  return headerToken || queryToken;
}

function requireAdmin(req, res, next) {
  const token = getToken(req);
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Rate limit PIN attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// ====== VALIDATION / SANITIZE ======
function cleanStr(v, max = 120) {
  if (v === null || v === undefined) return "";
  return String(v).trim().slice(0, max);
}

function cleanBool(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

function isValidEmail(email) {
  const s = String(email || "").trim();
  if (!s) return false;
  if (s.length > 254) return false;
  // simple, safe email check (good enough for kiosk validation)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function looksLikeIsoDate(s) {
  if (!s) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}


// ====== ROUTES ======
app.get("/", (req, res) => res.send("DBG backend is running"));
app.get("/health", (req, res) => res.json({ ok: true }));

// Admin login
app.post("/admin/login", loginLimiter, async (req, res) => {
  try {
    const { pin } = req.body || {};
    if (!pin) return res.status(400).json({ error: "PIN required" });

    if (!ADMIN_PIN_HASH) {
      return res.status(500).json({
        error: "ADMIN_PIN_HASH missing. Add it to backend .env and restart server.",
      });
    }

    const ok = await bcrypt.compare(String(pin), ADMIN_PIN_HASH);
    if (!ok) return res.status(401).json({ error: "Invalid PIN" });

    return res.json({ token: ADMIN_TOKEN });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Login failed" });
  }
});

// KIOSK: Save a visit (OPEN)
app.post("/visits", (req, res) => {
  const b = req.body || {};

  // Required
  const firstName = cleanStr(b.firstName, 60);
  const lastName = cleanStr(b.lastName, 60);

  if (!firstName || !lastName) {
    return res.status(400).json({ error: "First and last name are required" });
  }

  // Optional, but validated when present
  const phone = cleanStr(b.phone, 40);
  const email = cleanStr(b.email, 120);
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  // Reason fields
  const reasonKey = cleanStr(b.reasonKey, 60);
  const reasonLabel = cleanStr(b.reasonLabel, 120);

  if (!reasonKey || !reasonLabel) {
    return res.status(400).json({ error: "Reason is required" });
  }

  // Other fields
  const badgeType = cleanStr(b.badgeType, 40);
  const host = cleanStr(b.host, 120);
  const tourStudentId = cleanStr(b.tourStudentId, 80);
  const tourStudentName = cleanStr(b.tourStudentName, 120);

  const waiverAccepted = cleanBool(b.waiverAccepted);
  const waiverSignedName = cleanStr(b.waiverSignedName, 120);
  const waiverSignedAt = cleanStr(b.waiverSignedAt, 60);

  // If waiver is accepted, require signed fields
  if (waiverAccepted) {
    if (!waiverSignedName) {
      return res.status(400).json({ error: "Waiver signature name required" });
    }
    if (!waiverSignedAt || !looksLikeIsoDate(waiverSignedAt)) {
      return res.status(400).json({ error: "Waiver signed timestamp required" });
    }
  }

  // Photo can be huge, cap it hard for JSON storage safety
  const photoDataUrl = cleanStr(b.photoDataUrl, 2_000_000); // ~2MB of text
  if (photoDataUrl && !photoDataUrl.startsWith("data:image/")) {
    return res.status(400).json({ error: "Invalid photo format" });
  }

  const record = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),

    firstName,
    lastName,
    phone,
    email,

    reasonKey,
    reasonLabel,
    badgeType,
    host,
    tourStudentId,
    tourStudentName,

    waiverAccepted,
    waiverSignedName: waiverAccepted ? waiverSignedName : "",
    waiverSignedAt: waiverAccepted ? waiverSignedAt : "",

    photoDataUrl,
  };

  const arr = readVisits();
  arr.unshift(record);
  writeVisits(arr);

  res.json({ ok: true, id: record.id });
});



// ADMIN: List visits (PROTECTED)
// ADMIN: CSV export (PROTECTED via token query)
app.get("/visits", requireAdmin, (req, res) => {
  const arr = readVisits();
  res.json(arr);
});

// ADMIN: CSV export (PROTECTED, must be above /visits/:id)
app.get("/visits.csv", (req, res) => {

  // 🔐 ADMIN AUTH CHECK (ADD THIS)
  const token = (req.query.token || "").toString();
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const file = path.join(__dirname, "visits.json");
  const range = (req.query.range || "all").toString();
  const q = (req.query.q || "").toString().trim().toLowerCase();
   // ✅ THIS WAS MISSING
  let arr = [];
  if (fs.existsSync(file)) {
    arr = JSON.parse(fs.readFileSync(file, "utf-8"));
  }


  // Apply date range
  const now = Date.now();
  let cutoff = 0;

  if (range === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    cutoff = d.getTime();
  } else if (range === "7") {
    cutoff = now - 7 * 24 * 60 * 60 * 1000;
  } else if (range === "30") {
    cutoff = now - 30 * 24 * 60 * 60 * 1000;
  } else {
    cutoff = 0;
  }

  if (cutoff) {
    arr = arr.filter((r) => {
      const t = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      return t >= cutoff;
    });
  }

  // Apply search filter
  if (q) {
    arr = arr.filter((r) => {
      const name = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const reason = (r.reasonLabel || "").toLowerCase();
      const host = (r.host || "").toLowerCase();
      const student = (r.tourStudentName || "").toLowerCase();
      return (
        name.includes(q) ||
        reason.includes(q) ||
        host.includes(q) ||
        student.includes(q)
      );
    });
  }

  const header = [
    "id",
    "createdAt",
    "firstName",
    "lastName",
    "phone",
    "reasonLabel",
    "badgeType",
    "host",
    "tourStudentName",
    "waiverAccepted",
  ];

  const escape = (v) => {
    const s = (v ?? "").toString();
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [header.join(",")];
  for (const r of arr) {
    lines.push(header.map((k) => escape(r[k])).join(","));
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="dbg-visits.csv"');
  res.send(lines.join("\n"));
});

// ADMIN: Get one visit by id (PROTECTED)
app.get("/visits/:id", requireAdmin, (req, res) => {
  const arr = readVisits();
  const found = arr.find((x) => x.id === req.params.id);

  if (!found) return res.status(404).json({ error: "Not found" });
  res.json(found);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`CORS_ORIGIN=${CORS_ORIGIN}`);
});
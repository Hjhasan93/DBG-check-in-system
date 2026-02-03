const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => res.send("DBG backend is running"));
app.get("/health", (req, res) => res.json({ ok: true }));

// Save a visit
app.post("/visits", (req, res) => {
  const visit = req.body;

  const file = path.join(__dirname, "visits.json");
  const record = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...visit,
  };

  let arr = [];
  if (fs.existsSync(file)) {
    arr = JSON.parse(fs.readFileSync(file, "utf-8"));
  }
  arr.unshift(record);
  fs.writeFileSync(file, JSON.stringify(arr, null, 2), "utf-8");

  res.json({ ok: true, id: record.id });
});

// List visits
app.get("/visits", (req, res) => {
  const file = path.join(__dirname, "visits.json");
  if (!fs.existsSync(file)) return res.json([]);
  const arr = JSON.parse(fs.readFileSync(file, "utf-8"));
  res.json(arr);
});

// CSV export (must be above /visits/:id)
app.get("/visits.csv", (req, res) => {
  const file = path.join(__dirname, "visits.json");
  const arr = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : [];

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
    if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
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

// Get one visit by id
app.get("/visits/:id", (req, res) => {
  const file = path.join(__dirname, "visits.json");
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });

  const arr = JSON.parse(fs.readFileSync(file, "utf-8"));
  const found = arr.find((x) => x.id === req.params.id);

  if (!found) return res.status(404).json({ error: "Not found" });
  res.json(found);
});

app.listen(5050, "0.0.0.0", () => {
  console.log("Backend running on http://localhost:5050");
});

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../utils/adminFetch";
import DbgShell from "../DbgShell";

export default function AdminVisits() {
  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  // "today" | "7" | "30" | "all" | "custom"
  const [range, setRange] = useState("30");

  // YYYY-MM-DD
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function logout() {
    sessionStorage.removeItem("dbg_admin_unlocked");
    window.location.assign("/admin");
  }

  useEffect(() => {
    async function load() {
      try {
        setErr("");

        if (!BACKEND) {
          setErr("Backend URL missing. Set VITE_BACKEND_URL in .env and restart.");
          setRows([]);
          return;
        }

        const res = await adminFetch(`${BACKEND}/visits`);
        if (!res.ok) {
          setErr(`Backend error: ${res.status}`);
          setRows([]);
          return;
        }

        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.log(e);
        setErr("Could not load visits. Check backend is running.");
        setRows([]);
      }
    }

    load();
  }, [BACKEND]);

  function getCustomRangeMs(start, end) {
    const startMs = start ? new Date(`${start}T00:00:00`).getTime() : 0;
    const endMs = end ? new Date(`${end}T23:59:59`).getTime() : 0;
    return { startMs, endMs };
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    // Preset range filtering
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
      cutoff = 0; // all or custom
    }

    let ranged = cutoff
      ? rows.filter((r) => {
          const t = r.createdAt ? new Date(r.createdAt).getTime() : 0;
          return t >= cutoff;
        })
      : rows;

    // Custom range overrides presets when range === "custom"
    if (range === "custom") {
      const { startMs, endMs } = getCustomRangeMs(startDate, endDate);
      ranged = ranged.filter((r) => {
        const t = r.createdAt ? new Date(r.createdAt).getTime() : 0;
        if (startMs && t < startMs) return false;
        if (endMs && t > endMs) return false;
        return true;
      });
    }

    if (!s) return ranged;

    return ranged.filter((r) => {
      const name = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const reason = (r.reasonLabel || "").toLowerCase();
      const host = (r.host || "").toLowerCase();
      const student = (r.tourStudentName || "").toLowerCase();
      return (
        name.includes(s) ||
        reason.includes(s) ||
        host.includes(s) ||
        student.includes(s)
      );
    });
  }, [q, rows, range, startDate, endDate]);

  const csvDisabled = !BACKEND;

  return (
    <DbgShell
      title="Admin Visits"
      subtitle={BACKEND ? `Backend: ${BACKEND}` : "Backend: (missing)"}
      footer={
        <div className="dbgAdminFooter">
          <div className="dbgAdminTotal">Total: {filtered.length}</div>

          <div className="dbgAdminFooterRight">
            <button className="dbgBtn dbgBtnSecondary" onClick={logout}>
              Logout
            </button>

            <button
              className={`dbgBtn dbgBtnPrimary ${csvDisabled ? "dbgBtnDisabled" : ""}`}
              onClick={() => {
                const token = sessionStorage.getItem("dbg_admin_token") || "";

                const params = new URLSearchParams();
                params.set("token", token);
                params.set("range", range);
                params.set("q", q.trim());

                if (range === "custom") {
                  params.set("start", startDate);
                  params.set("end", endDate);
                }

                window.open(`${BACKEND}/visits.csv?${params.toString()}`, "_blank");
              }}
              disabled={csvDisabled}
            >
              Download CSV
            </button>
          </div>
        </div>
      }
    >
      <div className="dbgAdminToolbar">
        <div className="dbgAdminRange">
          <button
            className={`dbgBtn dbgBtnSecondary dbgChip ${range === "today" ? "dbgChipActive" : ""}`}
            onClick={() => setRange("today")}
            type="button"
          >
            Today
          </button>

          <button
            className={`dbgBtn dbgBtnSecondary dbgChip ${range === "7" ? "dbgChipActive" : ""}`}
            onClick={() => setRange("7")}
            type="button"
          >
            7 days
          </button>

          <button
            className={`dbgBtn dbgBtnSecondary dbgChip ${range === "30" ? "dbgChipActive" : ""}`}
            onClick={() => setRange("30")}
            type="button"
          >
            30 days
          </button>

          <button
            className={`dbgBtn dbgBtnSecondary dbgChip ${range === "all" ? "dbgChipActive" : ""}`}
            onClick={() => setRange("all")}
            type="button"
          >
            All
          </button>

          <button
            className={`dbgBtn dbgBtnSecondary dbgChip ${range === "custom" ? "dbgChipActive" : ""}`}
            onClick={() => setRange("custom")}
            type="button"
          >
            Custom
          </button>
        </div>

        {range === "custom" ? (
          <div className="dbgAdminDates">
            <input
              className="dbgInput"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              className="dbgInput"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button
              className="dbgBtn dbgBtnSecondary"
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear
            </button>
          </div>
        ) : null}

        <input
          className="dbgInput"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, reason, host, student"
        />
      </div>

      {err ? <div className="dbgErr">{err}</div> : null}

      <div className="dbgTableWrap">
        <table className="dbgTable">
          <thead>
            <tr>
              <th className="dbgTh">Time</th>
              <th className="dbgTh">Visitor</th>
              <th className="dbgTh">Reason</th>
              <th className="dbgTh">Host</th>
              <th className="dbgTh">Touring With</th>
              <th className="dbgTh">Waiver</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => window.location.assign(`/admin/${r.id}`)}
                className="dbgTr"
              >
                <td className="dbgTd">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                </td>
                <td className="dbgTd">
                  {(r.firstName || "") + " " + (r.lastName || "")}
                </td>
                <td className="dbgTd">{r.reasonLabel || ""}</td>
                <td className="dbgTd">{r.host || ""}</td>
                <td className="dbgTd">{r.tourStudentName || ""}</td>
                <td className="dbgTd">{r.waiverAccepted ? "Signed" : ""}</td>
              </tr>
            ))}

            {filtered.length === 0 ? (
              <tr>
                <td className="dbgTd" colSpan={6}>
                  No results
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </DbgShell>
  );
}
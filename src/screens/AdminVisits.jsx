import { useEffect, useMemo, useState } from "react";
import { listVisits, listWatchlistHits } from "../services/salesforce";
import DbgShell from "../DbgShell";

// The watchlist-hit Task stores its details in a single Description string,
// formatted "…\nMatched by: X\nNote: Y" by logWatchlistHit(). Pull the two
// staff-facing fields back out so the existing columns/search still work.
function parseWatchlistDescription(desc) {
  const d = desc || "";
  const matchedBy = (d.match(/Matched by:\s*(.*)/i)?.[1] || "").trim();
  const note = (d.match(/Note:\s*(.*)/i)?.[1] || "").trim();
  return { matchedBy, note };
}

// Raw Salesforce Event -> the flat visit shape the table/filter/CSV expect.
function mapVisit(r) {
  return {
    id: r.Id,
    createdAt: r.CreatedDate,
    firstName: r.Who?.FirstName || "",
    lastName: r.Who?.LastName || "",
    reasonLabel: r.Visit_Reason__c || "",
    badgeType: r.Badge_Type__c || "",
    host: r.Host__r?.Name || "",
    tourStudentName: `${r.Tour_Student__r?.FirstName || ""} ${
      r.Tour_Student__r?.LastName || ""
    }`.trim(),
    waiverAccepted: !!r.Waiver_Accepted__c,
  };
}

// Raw Salesforce Task -> the flat watchlist-hit shape. Phone/Email aren't part
// of the hit Task query, so they stay blank (columns preserved as-is).
function mapHit(r) {
  const { matchedBy, note } = parseWatchlistDescription(r.Description);
  return {
    id: r.Id,
    createdAt: r.CreatedDate,
    firstName: r.Who?.FirstName || "",
    lastName: r.Who?.LastName || "",
    phone: "",
    email: "",
    matchedBy,
    note,
  };
}

// Quote a CSV field only when it contains a comma, quote, or newline.
function csvEscape(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function AdminVisits() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("visits"); // "visits" | "watchlist"

  const [range, setRange] = useState("30"); // "today" | "7" | "30" | "all" | "custom"
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD

  function logout() {
    sessionStorage.removeItem("dbg_admin_unlocked");
    sessionStorage.removeItem("dbg_admin_token");
    window.location.assign("/admin");
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setErr("");
        setLoading(true);

        const data =
          viewMode === "watchlist"
            ? await listWatchlistHits()
            : await listVisits();

        if (cancelled) return;

        const mapped = (Array.isArray(data) ? data : []).map(
          viewMode === "watchlist" ? mapHit : mapVisit
        );
        setRows(mapped);
      } catch (e) {
        if (cancelled) return;
        console.log(e);
        setErr(
          e?.message
            ? `Could not load data from Salesforce: ${e.message}`
            : "Could not load data from Salesforce."
        );
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [viewMode]);

  function getRangeCutoffMs(rangeKey) {
    const now = Date.now();

    if (rangeKey === "today") {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return { startMs: d.getTime(), endMs: 0 };
    }

    if (rangeKey === "7") return { startMs: now - 7 * 24 * 60 * 60 * 1000, endMs: 0 };
    if (rangeKey === "30") return { startMs: now - 30 * 24 * 60 * 60 * 1000, endMs: 0 };
    if (rangeKey === "all") return { startMs: 0, endMs: 0 };

    // custom
    const startMs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
    const endMs = endDate ? new Date(`${endDate}T23:59:59`).getTime() : 0;
    return { startMs, endMs };
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const { startMs, endMs } = getRangeCutoffMs(range);

    // date filter
    let ranged = rows.filter((r) => {
      const t = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      if (startMs && t < startMs) return false;
      if (endMs && t > endMs) return false;
      return true;
    });

    // search filter
    if (!s) return ranged;

    if (viewMode === "visits") {
      return ranged.filter((r) => {
        const name = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
        const reason = (r.reasonLabel || "").toLowerCase();
        const host = (r.host || "").toLowerCase();
        const student = (r.tourStudentName || "").toLowerCase();
        return name.includes(s) || reason.includes(s) || host.includes(s) || student.includes(s);
      });
    }

    // watchlist hits
    return ranged.filter((r) => {
      const name = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const phone = (r.phone || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const matchedBy = (r.matchedBy || "").toLowerCase();
      const note = (r.note || "").toLowerCase();
      return (
        name.includes(s) ||
        phone.includes(s) ||
        email.includes(s) ||
        matchedBy.includes(s) ||
        note.includes(s)
      );
    });
  }, [q, rows, range, startDate, endDate, viewMode]);

  const csvDisabled = filtered.length === 0;

  function downloadCsv() {
    if (filtered.length === 0) return;

    const isVisits = viewMode === "visits";
    const headers = isVisits
      ? ["Time", "Visitor", "Reason", "Host", "Touring With", "Waiver"]
      : ["Time", "Name", "Phone", "Email", "Matched By", "Note"];

    const dataRows = filtered.map((r) => {
      const time = r.createdAt ? new Date(r.createdAt).toLocaleString() : "";
      const name = `${r.firstName || ""} ${r.lastName || ""}`.trim();
      return isVisits
        ? [
            time,
            name,
            r.reasonLabel || "",
            r.host || "",
            r.tourStudentName || "",
            r.waiverAccepted ? "Signed" : "",
          ]
        : [time, name, r.phone || "", r.email || "", r.matchedBy || "", r.note || ""];
    });

    const csv = [headers, ...dataRows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isVisits ? "visits" : "watchlist-hits"}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <DbgShell
      title="Admin Visits"
      subtitle="Salesforce"
      footer={
        <div className="dbgAdminFooter">
          <div className="dbgAdminTotal">Total: {filtered.length}</div>

          <div className="dbgAdminFooterRight">
            <button className="dbgBtn dbgBtnSecondary" onClick={logout}>
              Logout
            </button>

            <button
              className={`dbgBtn dbgBtnPrimary ${csvDisabled ? "dbgBtnDisabled" : ""}`}
              onClick={downloadCsv}
              disabled={csvDisabled}
              title={csvDisabled ? "No records to export" : ""}
            >
              Download CSV
            </button>
          </div>
        </div>
      }
    >
      <div className="dbgAdminToolbar">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className={`dbgBtn dbgBtnSecondary dbgChip ${
              viewMode === "visits" ? "dbgChipActive" : ""
            }`}
            onClick={() => setViewMode("visits")}
            type="button"
          >
            Visits
          </button>

          <button
            className={`dbgBtn dbgBtnSecondary dbgChip ${
              viewMode === "watchlist" ? "dbgChipActive" : ""
            }`}
            onClick={() => setViewMode("watchlist")}
            type="button"
          >
            Watchlist Hits
          </button>
        </div>

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
            className={`dbgBtn dbgBtnSecondary dbgChip ${
              range === "custom" ? "dbgChipActive" : ""
            }`}
            onClick={() => setRange("custom")}
            type="button"
          >
            Custom
          </button>
        </div>

        {range === "custom" ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label className="dbgLabel" style={{ minWidth: 220 }}>
              Start date
              <input
                className="dbgInput"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>

            <label className="dbgLabel" style={{ minWidth: 220 }}>
              End date
              <input
                className="dbgInput"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
        ) : null}

        <input
          className="dbgInput"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            viewMode === "visits"
              ? "Search name, reason, host, student"
              : "Search name, phone, email, matchedBy, note"
          }
        />
      </div>

      {err ? <div className="dbgErr">{err}</div> : null}

      <div className="dbgTableWrap">
        <table className="dbgTable">
          <thead>
            {viewMode === "visits" ? (
              <tr>
                <th className="dbgTh">Time</th>
                <th className="dbgTh">Visitor</th>
                <th className="dbgTh">Reason</th>
                <th className="dbgTh">Host</th>
                <th className="dbgTh">Touring With</th>
                <th className="dbgTh">Waiver</th>
              </tr>
            ) : (
              <tr>
                <th className="dbgTh">Time</th>
                <th className="dbgTh">Name</th>
                <th className="dbgTh">Phone</th>
                <th className="dbgTh">Email</th>
                <th className="dbgTh">Matched By</th>
                <th className="dbgTh">Note</th>
              </tr>
            )}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="dbgTd" colSpan={6}>
                  <div className="dbgAdminLoading">Loading…</div>
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((r) =>
                  viewMode === "visits" ? (
                    <tr
                      key={r.id}
                      onClick={() => window.location.assign(`/admin/${r.id}`)}
                      className="dbgTr"
                    >
                      <td className="dbgTd">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                      </td>
                      <td className="dbgTd">{`${r.firstName || ""} ${r.lastName || ""}`}</td>
                      <td className="dbgTd">{r.reasonLabel || ""}</td>
                      <td className="dbgTd">{r.host || ""}</td>
                      <td className="dbgTd">{r.tourStudentName || ""}</td>
                      <td className="dbgTd">{r.waiverAccepted ? "Signed" : ""}</td>
                    </tr>
                  ) : (
                    <tr key={r.id} className="dbgTr">
                      <td className="dbgTd">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                      </td>
                      <td className="dbgTd">{`${r.firstName || ""} ${r.lastName || ""}`}</td>
                      <td className="dbgTd">{r.phone || ""}</td>
                      <td className="dbgTd">{r.email || ""}</td>
                      <td className="dbgTd">{r.matchedBy || ""}</td>
                      <td className="dbgTd">{r.note || ""}</td>
                    </tr>
                  )
                )}

                {filtered.length === 0 ? (
                  <tr>
                    <td className="dbgTd" colSpan={6}>
                      No results
                    </td>
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </DbgShell>
  );
}

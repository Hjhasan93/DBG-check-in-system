import { useEffect, useMemo, useState } from "react";

export default function AdminVisits() {
  const BACKEND = import.meta.env.VITE_BACKEND_URL;
  console.log("ADMIN BACKEND =", BACKEND);


  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

 useEffect(() => {
  async function load() {
    try {
      setErr("");
      if (!BACKEND) {
        setErr("Backend URL missing. Set VITE_BACKEND_URL in .env and restart.");
        return;
      }

      const res = await fetch(`${BACKEND}/visits`);
      const data = await res.json();

      // Ensure rows is always an array
      if (Array.isArray(data)) {
        setRows(data);
      } else if (data && Array.isArray(data.items)) {
        setRows(data.items);
      } else {
        console.log("Unexpected /visits response:", data);
        setRows([]);
        setErr("Backend returned unexpected format for /visits");
      }
    } catch (e) {
      console.log(e);
      setErr("Could not load visits. Check backend is running.");
    }
  }

  load();
}, [BACKEND]);



  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
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
  }, [q, rows]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Visits</h1>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
  <button
    style={styles.btn}
    onClick={() => window.open(`${BACKEND}/visits.csv`, "_blank")}
  >
    Download CSV
  </button>
</div>


        <div style={{ opacity: 0.8, marginBottom: 10 }}>
  Backend: {BACKEND || "(missing)"}
</div>


        <input
          style={styles.input}
          value={q}
        
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, reason, host, student"
        />

        {err ? <div style={styles.err}>{err}</div> : null}

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Visitor</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Host</th>
                <th style={styles.th}>Touring With</th>
                <th style={styles.th}>Waiver</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
               <tr
  key={r.id}
  onClick={() => window.location.assign(`/admin/${r.id}`)}
  style={{ cursor: "pointer" }}
>



                  <td style={styles.td}>
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleString()
                      : ""}
                  </td>
                  <td style={styles.td}>
                    {r.firstName} {r.lastName}
                  </td>
                  <td style={styles.td}>{r.reasonLabel}</td>
                  <td style={styles.td}>{r.host || ""}</td>
                  <td style={styles.td}>{r.tourStudentName || ""}</td>
                  <td style={styles.td}>
                    {r.waiverAccepted ? "Signed" : ""}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={6}>
                    No results
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div style={styles.footer}>Total: {filtered.length}</div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0b",
    color: "white",
    padding: 24,
  },
  card: {
    width: "min(1200px, 100%)",
    margin: "0 auto",
    background: "#151515",
    padding: 22,
    borderRadius: 18,
  },
  title: {
    margin: 0,
    fontSize: 34,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    fontSize: 18,
    padding: "12px",
    borderRadius: 12,
    border: "1px solid #2b2b2b",
    outline: "none",
    marginBottom: 12,
  },
  err: {
    background: "#3a1515",
    border: "1px solid #5a1e1e",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  tableWrap: {
    overflow: "auto",
    border: "1px solid #2b2b2b",
    borderRadius: 14,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: 10,
    borderBottom: "1px solid #2b2b2b",
    background: "#101010",
  },
  td: {
    padding: 10,
    borderBottom: "1px solid #222",
  },
  footer: {
    marginTop: 12,
    opacity: 0.8,
  },

  btn: {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #2b2b2b",
  background: "#101010",
  color: "white",
  cursor: "pointer",
},

};

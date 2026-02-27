import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminGuard({ children }) {
  const nav = useNavigate();
  const loc = useLocation();

  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const unlocked = sessionStorage.getItem("dbg_admin_unlocked") === "1";

  // If user leaves /admin routes, lock admin
  useEffect(() => {
    if (!loc.pathname.startsWith("/admin")) {
      sessionStorage.removeItem("dbg_admin_unlocked");
      sessionStorage.removeItem("dbg_admin_token");
    }
  }, [loc.pathname]);

  async function submit(e) {
    e.preventDefault();
    try {
      setErr("");

      if (!BACKEND) {
        setErr("Backend URL missing. Set VITE_BACKEND_URL in .env and restart.");
        return;
      }

      if (!pin.trim()) {
        setErr("Enter PIN");
        return;
      }

      setBusy(true);

      const res = await fetch(`${BACKEND}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data.error || `Login failed (${res.status})`);
        setPin("");
        return;
      }

      // Save unlock + token for protected admin calls
      sessionStorage.setItem("dbg_admin_unlocked", "1");
      sessionStorage.setItem("dbg_admin_token", data.token);

      setPin("");
      nav("/admin");
    } catch (e2) {
      console.log(e2);
      setErr("Could not reach backend. Is it running on 5050?");
    } finally {
      setBusy(false);
    }
  }

  if (unlocked) return children;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Staff Access</h1>
        <p style={styles.sub}>Enter PIN to open Admin.</p>

        <div style={styles.backendLine}>
          Backend: {BACKEND || "(missing)"}
        </div>

        <form onSubmit={submit} style={styles.form}>
          <input
            style={styles.input}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            inputMode="numeric"
            type="password"
            autoFocus
            disabled={busy}
          />
          <button style={styles.btn} type="submit" disabled={busy}>
            {busy ? "Checking..." : "Unlock"}
          </button>
        </form>

        {err ? <div style={styles.err}>{err}</div> : null}

        <button style={styles.link} onClick={() => nav("/")}>
          Back to kiosk
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0b0b",
    color: "white",
    padding: 24,
  },
  card: {
    width: "min(520px, 100%)",
    background: "#151515",
    padding: 24,
    borderRadius: 18,
  },
  title: { margin: 0, fontSize: 34 },
  sub: { opacity: 0.85, marginTop: 10, marginBottom: 10 },
  backendLine: { opacity: 0.75, marginBottom: 14, fontSize: 13 },
  form: { display: "flex", gap: 10 },
  input: {
    flex: 1,
    fontSize: 20,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #2b2b2b",
    outline: "none",
  },
  btn: {
    fontSize: 18,
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
  },
  err: {
    marginTop: 12,
    background: "#3a1515",
    border: "1px solid #5a1e1e",
    padding: 10,
    borderRadius: 12,
  },
  link: {
    marginTop: 14,
    background: "transparent",
    border: "1px solid #2b2b2b",
    color: "white",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
  },
};

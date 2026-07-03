import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";

// Neutral "please wait" screen shown when a visitor matches the watchlist.
// It must NOT reveal the watchlist or its reason — the hit is logged silently
// for staff elsewhere. Auto-returns to the start after a short delay.
export default function WatchlistResult() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();

  useEffect(() => {
    const t = setTimeout(() => {
      setVisit((v) => ({ ...v, firstName: "", lastName: "", phone: "", email: "" }));
      navigate("/", { replace: true });
    }, 20000);
    return () => clearTimeout(t);
  }, [navigate, setVisit]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Please wait</h1>
        <p style={styles.subtitle}>
          A team member will assist you at the front desk.
        </p>

        {visit.firstName || visit.lastName ? (
          <div style={styles.box}>
            <div>
              <b>Visitor:</b> {visit.firstName} {visit.lastName}
            </div>
          </div>
        ) : null}

        <button style={styles.secondary} onClick={() => navigate("/")}>
          Back to start
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0b0b", color: "white", padding: 24 },
  card: { width: "min(860px, 100%)", background: "#151515", padding: 28, borderRadius: 18, textAlign: "center" },
  title: { fontSize: 44, margin: 0 },
  subtitle: { opacity: 0.9, marginTop: 10, marginBottom: 18, fontSize: 18 },
  box: { textAlign: "left", border: "1px solid #2b2b2b", borderRadius: 14, padding: 14, marginBottom: 18, background: "#101010" },
  secondary: { fontSize: 18, padding: "12px 14px", borderRadius: 12, border: "1px solid #2b2b2b", background: "transparent", color: "white", cursor: "pointer" },
};

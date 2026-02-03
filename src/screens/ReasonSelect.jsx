import { useNavigate } from "react-router-dom";
import { REASONS } from "../config/reasons";
import { useVisit } from "../context/VisitContext";

export default function ReasonSelect() {
  const navigate = useNavigate();
  const { setVisit } = useVisit();

  function nextRouteFor(reason) {
    if (reason.hostRequired) return "/host";
    if (reason.photoRequired) return "/photo";
    if (reason.waiverRequired) return "/waiver";
    return "/thankyou";
  }

  function selectReason(r) {
    setVisit((v) => ({
      ...v,
      reasonKey: r.key,
      reasonLabel: r.label,
      badgeType: r.badgeType,
      host: "",
      photoDataUrl: "",
      waiverAccepted: false,
    }));

    navigate(nextRouteFor(r));
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>What brings you here today?</h1>
        <p style={styles.subtitle}>Choose one option.</p>

        <div style={styles.grid}>
          {REASONS.map((r) => (
            <button key={r.key} style={styles.reasonBtn} onClick={() => selectReason(r)}>
              {r.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          <button style={styles.secondaryBtn} onClick={() => navigate("/about")}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "#0b0b0b",
    color: "white",
  },
  card: {
    width: "min(980px, 100%)",
    borderRadius: 18,
    padding: 28,
    background: "#151515",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  },
  title: { fontSize: 36, margin: 0 },
  subtitle: { fontSize: 16, opacity: 0.9, marginTop: 10, marginBottom: 18 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
  },
  reasonBtn: {
    fontSize: 24,
    padding: "22px 18px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    textAlign: "center",
  },
  secondaryBtn: {
    fontSize: 20,
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid #2b2b2b",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
};

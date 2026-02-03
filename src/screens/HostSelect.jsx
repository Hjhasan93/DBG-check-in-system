import { useNavigate } from "react-router-dom";
import { HOSTS } from "../config/hosts";
import { useVisit } from "../context/VisitContext";
import { REASONS } from "../config/reasons";

export default function HostSelect() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();
  const reason = REASONS.find((r) => r.key === visit.reasonKey);

  function onSelect(host) {
    setVisit((v) => ({ ...v, host }));

if (visit.reasonKey === "tour") {
  navigate("/touring-with");
  return;
}

if (reason?.photoRequired) navigate("/photo");
else if (reason?.waiverRequired) navigate("/waiver");
else navigate("/thankyou");

  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Who are you visiting?</h1>
        <p style={styles.subtitle}>Select a host.</p>

        <div style={styles.grid}>
          {HOSTS.map((h) => (
            <button key={h} style={styles.hostBtn} onClick={() => onSelect(h)}>
              {h}
            </button>
          ))}
        </div>

        <button style={styles.secondaryBtn} onClick={() => navigate("/reason")}>
          Back
        </button>
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
    marginBottom: 18,
  },
  hostBtn: {
    fontSize: 22,
    padding: "20px 18px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
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

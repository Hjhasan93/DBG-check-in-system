import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to DBG</h1>
        <p style={styles.subtitle}>Tap start to check in and print your badge.</p>

        <button style={styles.primaryBtn} onClick={() => navigate("/about")}>
          Start
        </button>

        <p style={styles.smallNote}>
          Need help? Please see the front desk.
        </p>
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
    width: "min(720px, 100%)",
    borderRadius: 18,
    padding: 28,
    background: "#151515",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    textAlign: "center",
  },
  title: { fontSize: 44, margin: 0 },
  subtitle: { fontSize: 18, opacity: 0.9, marginTop: 12, marginBottom: 24 },
  primaryBtn: {
    fontSize: 26,
    padding: "18px 34px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
  },
  smallNote: { marginTop: 22, opacity: 0.75 },
};

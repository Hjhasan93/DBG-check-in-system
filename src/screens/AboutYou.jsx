import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";
import { WATCHLIST } from "../config/watchlist";


export default function AboutYou() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();

  const [first, setFirst] = useState(visit.firstName);
  const [last, setLast] = useState(visit.lastName);
  const [phone, setPhone] = useState(visit.phone);

  const canContinue = first.trim() && last.trim() && phone.trim();

  useEffect(() => {
    const t = setTimeout(() => navigate("/"), 120000);
    return () => clearTimeout(t);
  }, [navigate]);

  function onNext() {
  const firstName = first.trim();
  const lastName = last.trim();
  const phoneNum = phone.trim();

  setVisit((v) => ({
    ...v,
    firstName,
    lastName,
    phone: phoneNum,
  }));

  const hit = WATCHLIST.find(
    (w) =>
      w.firstName.toLowerCase() === firstName.toLowerCase() &&
      w.lastName.toLowerCase() === lastName.toLowerCase()
  );

  if (hit) {
    navigate("/watchlist");
    return;
  }

  navigate("/reason");
}


  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>About you</h1>
        <p style={styles.subtitle}>Please enter your info.</p>

        <div style={styles.grid}>
          <label style={styles.label}>
            First name
            <input style={styles.input} value={first} onChange={(e) => setFirst(e.target.value)} />
          </label>

          <label style={styles.label}>
            Last name
            <input style={styles.input} value={last} onChange={(e) => setLast(e.target.value)} />
          </label>

          <label style={styles.label}>
            Phone
            <input
              style={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(###) ###-####"
            />
          </label>
        </div>

        <div style={styles.row}>
          <button style={styles.secondaryBtn} onClick={() => navigate("/")}>
            Back
          </button>

          <button
            style={{ ...styles.primaryBtn, opacity: canContinue ? 1 : 0.4 }}
            disabled={!canContinue}
            onClick={onNext}
          >
            Next
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
    width: "min(860px, 100%)",
    borderRadius: 18,
    padding: 28,
    background: "#151515",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  },
  title: { fontSize: 40, margin: 0 },
  subtitle: { fontSize: 16, opacity: 0.9, marginTop: 10, marginBottom: 18 },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  label: { display: "flex", flexDirection: "column", gap: 8, fontSize: 14, opacity: 0.95 },
  input: {
    fontSize: 20,
    padding: "14px 14px",
    borderRadius: 12,
    border: "1px solid #2b2b2b",
    outline: "none",
  },
  row: { display: "flex", justifyContent: "space-between", marginTop: 22, gap: 12 },
  primaryBtn: { fontSize: 22, padding: "14px 24px", borderRadius: 12, border: "none", cursor: "pointer" },
  secondaryBtn: {
    fontSize: 22,
    padding: "14px 24px",
    borderRadius: 12,
    border: "1px solid #2b2b2b",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
};

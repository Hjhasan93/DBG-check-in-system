import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";

const WAIVER_TEXT = `
I understand that participation in DBG activities may involve physical activity and risk.
I agree to follow all facility rules and staff instructions.
I release DBG, its staff, and volunteers from liability to the fullest extent permitted by law.
`;

export default function Waiver() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();

  const [agree, setAgree] = useState(visit.waiverAccepted || false);
  const [signedName, setSignedName] = useState(visit.waiverSignedName || "");
  const [error, setError] = useState("");

  const expectedName = useMemo(() => {
    return `${visit.firstName || ""} ${visit.lastName || ""}`.trim();
  }, [visit.firstName, visit.lastName]);

  function onAccept() {
    setError("");

    if (!agree) {
      setError("You must agree to continue.");
      return;
    }
    if (!signedName.trim()) {
      setError("Please type your full name as signature.");
      return;
    }

    const now = new Date().toISOString();

    setVisit((v) => ({
      ...v,
      waiverAccepted: true,
      waiverSignedName: signedName.trim(),
      waiverSignedAt: now,
    }));

    navigate("/print");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Waiver</h1>
        <p style={styles.subtitle}>Please read and sign to continue.</p>

        <div style={styles.waiverBox}>
          <pre style={styles.waiverText}>{WAIVER_TEXT}</pre>
        </div>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={styles.checkbox}
          />
          <span>I agree to the waiver</span>
        </label>

        <div style={styles.sigLabel}>Type your full name (signature)</div>
        <input
          style={styles.input}
          value={signedName}
          onChange={(e) => setSignedName(e.target.value)}
          placeholder={expectedName ? `Example: ${expectedName}` : "Full name"}
        />

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.row}>
          <button style={styles.secondary} onClick={() => navigate("/reason")}>
            Back
          </button>
          <button style={styles.primary} onClick={onAccept}>
            Accept and Continue
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0b0b", color: "white", padding: 24 },
  card: { width: "min(980px, 100%)", background: "#151515", padding: 28, borderRadius: 18 },
  title: { fontSize: 36, margin: 0 },
  subtitle: { opacity: 0.9, marginTop: 10, marginBottom: 14 },
  waiverBox: { border: "1px solid #2b2b2b", borderRadius: 14, padding: 14, background: "#101010", marginBottom: 14 },
  waiverText: { margin: 0, whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.4 },
  checkboxRow: { display: "flex", gap: 10, alignItems: "center", fontSize: 18, marginBottom: 14 },
  checkbox: { width: 20, height: 20 },
  sigLabel: { marginBottom: 8, opacity: 0.9 },
  input: { width: "100%", fontSize: 20, padding: "14px 14px", borderRadius: 12, border: "1px solid #2b2b2b", outline: "none", marginBottom: 12 },
  error: { background: "#3a1515", border: "1px solid #5a1e1e", padding: 12, borderRadius: 12, marginBottom: 12 },
  row: { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6 },
  primary: { fontSize: 18, padding: "12px 18px", borderRadius: 12, border: "none", cursor: "pointer" },
  secondary: { fontSize: 18, padding: "12px 18px", borderRadius: 12, border: "1px solid #2b2b2b", background: "transparent", color: "white", cursor: "pointer" },
};

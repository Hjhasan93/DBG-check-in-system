import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useVisit } from "../context/VisitContext";



export default function ThankYou() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();


  useEffect(() => {
  async function saveVisit() {
    try {
      const BACKEND = import.meta.env.VITE_BACKEND_URL;
      if (!BACKEND) return;

      const payload = {
        firstName: visit.firstName,
        lastName: visit.lastName,
        phone: visit.phone,
        reasonKey: visit.reasonKey,
        reasonLabel: visit.reasonLabel,
        badgeType: visit.badgeType,
        host: visit.host,
        tourStudentId: visit.tourStudentId,
        tourStudentName: visit.tourStudentName,
        waiverAccepted: visit.waiverAccepted,
        waiverSignedName: visit.waiverSignedName,
        waiverSignedAt: visit.waiverSignedAt,
        photoDataUrl: visit.photoDataUrl,
      };

      await fetch(`${BACKEND}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // keep silent for kiosk mode
    }
  }

  // Only save when we actually have a name
  if (visit.firstName && visit.lastName) saveVisit();
}, [visit]);


  useEffect(() => {
    const t = setTimeout(() => {
      setVisit({
        firstName: "",
        lastName: "",
        phone: "",
        reasonKey: "",
        reasonLabel: "",
        badgeType: "",
        host: "",
        photoDataUrl: "",
        waiverAccepted: false,
        waiverSignedName: "",
        waiverSignedAt: "",
        tourStudentId: "",
        tourStudentName: "",
      });
      navigate("/");
    }, 5000);

    return () => clearTimeout(t);
  }, [navigate, setVisit]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Thank you.</h1>
        <p style={styles.subtitle}>Printing your badge now.</p>

        <div style={styles.summary}>
          <div><b>Name:</b> {visit.firstName} {visit.lastName}</div>
          <div><b>Reason:</b> {visit.reasonLabel}</div>
          <div><b>Badge:</b> {visit.badgeType}</div>
          {visit.host ? <div><b>Host:</b> {visit.host}</div> : null}
        </div>

        <p style={styles.small}>Returning to start in a few seconds.</p>

        <button style={styles.secondaryBtn} onClick={() => navigate("/")}>
          Back to start
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
    textAlign: "center",
  },
  title: { fontSize: 46, margin: 0 },
  subtitle: { fontSize: 18, opacity: 0.9, marginTop: 10 },
  summary: {
    textAlign: "left",
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    border: "1px solid #2b2b2b",
    lineHeight: 1.8,
    fontSize: 18,
  },
  small: { marginTop: 18, opacity: 0.8 },
  secondaryBtn: {
    marginTop: 14,
    fontSize: 18,
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid #2b2b2b",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
};

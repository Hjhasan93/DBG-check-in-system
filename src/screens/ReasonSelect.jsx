import { useNavigate } from "react-router-dom";
import { REASONS } from "../config/reasons";
import { useVisit } from "../context/VisitContext";
import dbgLogo from "../assets/dbgLogo.png";


export default function ReasonSelect() {
  const navigate = useNavigate();
  const { setVisit } = useVisit();

 function nextRouteFor(reason) {
  // Force Tour + Appointment to go straight to staff list
  if (reason.key === "tour" || reason.key === "appointment") return "/host";

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
  <div className="dbgPage">
    <div className="dbgCard">
      <div className="dbgHeader">
        <img className="dbgLogo" src={dbgLogo} alt="DBG" />
        <h1 className="dbgTitle">DBG Visitor Check-In</h1>
      </div>

      <p className="dbgSubtitle">What brings you here today?</p>

      <div className="dbgGrid2">
        {REASONS.map((r) => (
          <button
            key={r.key}
            className="dbgBtn dbgBtnPrimary"
            onClick={() => selectReason(r)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/about")}>
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
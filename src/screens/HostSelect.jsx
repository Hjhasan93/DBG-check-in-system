import { useNavigate } from "react-router-dom";
import { HOSTS } from "../config/hosts";
import { useVisit } from "../context/VisitContext";
import { REASONS } from "../config/reasons";
import dbgLogo from "../assets/dbgLogo.png";

export default function HostSelect() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();

  const reason = REASONS.find((r) => r.key === visit.reasonKey);

  function onSelect(host) {
    setVisit((v) => ({ ...v, host }));

    // If TOUR, ask "touring with" next
    navigate("/photo");

    // Otherwise continue normal flow
    if (reason?.photoRequired) navigate("/photo");
    else if (reason?.waiverRequired) navigate("/waiver");
    else navigate("/thankyou");
  }

  return (
    <div className="dbgPage">
      <div className="dbgCard">
        <div className="dbgHeader">
          <img className="dbgLogo" src={dbgLogo} alt="DBG" />
          <h1 className="dbgTitle">Who are you visiting?</h1>
        </div>

        <p className="dbgSubtitle">Select a staff member.</p>

        <div className="dbgGrid2">
          {HOSTS.map((h) => (
            <button
              key={h}
              className="dbgBtn dbgBtnPrimary"
              onClick={() => onSelect(h)}
            >
              {h}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/reason")}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

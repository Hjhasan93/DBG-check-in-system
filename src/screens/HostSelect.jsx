import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";
import { REASONS } from "../config/reasons";
import { getHosts } from "../services/salesforce";
import dbgLogo from "../assets/dbgLogo.png";

export default function HostSelect() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();

  const reason = REASONS.find((r) => r.key === visit.reasonKey);

  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getHosts()
      .then((list) => setHosts(list))
      .catch((e) => {
        console.error("Load hosts failed:", e);
        setError("Could not load staff list. Please see the front desk.");
      })
      .finally(() => setLoading(false));
  }, []);

  function onSelect(host) {
    // Store the host's display name (for the badge/summary) and User Id (for Event.Host__c)
    setVisit((v) => ({ ...v, host: host.name, hostId: host.id }));

    // Route based on the reason: a Tour asks "touring with" next.
    if (reason?.key === "tour") navigate("/touring-with");
    else if (reason?.photoRequired) navigate("/photo");
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

        {loading ? (
          <p className="dbgSubtitle">Loading staff…</p>
        ) : error ? (
          <div className="dbgErr">{error}</div>
        ) : (
          <div className="dbgGrid2">
            {hosts.map((h) => (
              <button
                key={h.id}
                className="dbgBtn dbgBtnPrimary"
                onClick={() => onSelect(h)}
              >
                {h.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/reason")}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

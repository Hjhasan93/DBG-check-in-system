import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";
import DbgShell from "../DbgShell";

export default function Watchlist() {
  const navigate = useNavigate();
  const { visit } = useVisit();

  return (
    <DbgShell
      title="Attention"
      subtitle="Please see staff"
      footer={
        <div className="dbgGrid2">
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/")}>
            Back to start
          </button>
          <button className="dbgBtn dbgBtnPrimary" onClick={() => navigate("/admin")}>
            Staff Access
          </button>
        </div>
      }
    >
      <div className="dbgErr">
        <div style={{ fontSize: 20, marginBottom: 8 }}>
          This visitor is on the watchlist.
        </div>
        <div style={{ opacity: 0.9 }}>
          Name: <b>{visit.firstName} {visit.lastName}</b>
        </div>
        {visit.watchlistNote ? (
          <div style={{ marginTop: 10 }}>
            Note: <b>{visit.watchlistNote}</b>
          </div>
        ) : null}
      </div>
    </DbgShell>
  );
}
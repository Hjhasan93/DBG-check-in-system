import { useNavigate } from "react-router-dom";
import DbgShell from "../DbgShell";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <DbgShell
      title="DBG Detroit"
      subtitle="Welcome. Please check in to continue."
      footer={
        <div className="dbgGrid2">
          <button
            className="dbgBtn dbgBtnPrimary"
            onClick={() => navigate("/about")}
          >
            Start Check-In
          </button>

          <button
            className="dbgBtn dbgBtnSecondary"
            onClick={() => navigate("/admin")}
          >
            Staff Access
          </button>
        </div>
      }
    >
      {/* Intentionally empty body for Welcome */}
    </DbgShell>
  );
}

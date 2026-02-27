import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";
import DbgShell from "../DbgShell";

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
    <DbgShell
      title="Detroit Boxing Gym"
      subtitle="Waiver. Please read and sign to continue."
      footer={
        <div className="dbgGrid2">
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/reason")}>
            Back
          </button>
          <button className="dbgBtn dbgBtnPrimary" onClick={onAccept}>
            Accept and Continue
          </button>
        </div>
      }
    >
      <div className="dbgWaiverBox">
        <pre className="dbgWaiverText">{WAIVER_TEXT}</pre>
      </div>

      <label className="dbgCheckRow">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="dbgCheck"
        />
        <span>I agree to the waiver</span>
      </label>

      <div className="dbgSigLabel">Type your full name (signature)</div>

      <input
        className="dbgInput"
        value={signedName}
        onChange={(e) => setSignedName(e.target.value)}
        placeholder={expectedName ? `Example: ${expectedName}` : "Full name"}
      />

      {error ? <div className="dbgErr">{error}</div> : null}
    </DbgShell>
  );
}

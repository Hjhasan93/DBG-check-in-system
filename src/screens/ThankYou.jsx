import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useVisit } from "../context/VisitContext";
import DbgShell from "../DbgShell";

export default function ThankYou() {
  const navigate = useNavigate();
  const { visit, setVisit } = useVisit();

  const [secondsLeft, setSecondsLeft] = useState(5);

  // ✅ prevents double-save in React StrictMode (dev)
  const savedRef = useRef(false);

  useEffect(() => {
    async function saveVisit() {
      try {
        const BACKEND = import.meta.env.VITE_BACKEND_URL;
        if (!BACKEND) return;

        // ✅ stable id for this one check-in (used for backend dedupe if you add it)
        let clientVisitId = sessionStorage.getItem("dbg_client_visit_id");
        if (!clientVisitId) {
          clientVisitId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          sessionStorage.setItem("dbg_client_visit_id", clientVisitId);
        }

        const payload = {
          clientVisitId, // ✅ add this
          firstName: visit.firstName,
          lastName: visit.lastName,
          phone: visit.phone,
          email: visit.email,
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

    // ✅ only save once per visit
    if (savedRef.current) return;
    if (visit.firstName && visit.lastName) {
      savedRef.current = true;
      saveVisit();
    }
  }, [visit.firstName, visit.lastName]); // ✅ don’t depend on whole visit object

  useEffect(() => {
    setSecondsLeft(5);

    const tick = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const t = setTimeout(() => {
      // ✅ clear id so next visitor gets a fresh one
      sessionStorage.removeItem("dbg_client_visit_id");

      setVisit({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
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

    return () => {
      clearTimeout(t);
      clearInterval(tick);
    };
  }, [navigate, setVisit]);

  return (
    <DbgShell
      title="Detroit Boxing Gym"
      subtitle="Thank you. Your check-in is complete."
      footer={
        <div className="dbgGrid2">
          <button className="dbgBtn dbgBtnSecondary" onClick={() => navigate("/")}>
            Back to start
          </button>
          <button className="dbgBtn dbgBtnPrimary" onClick={() => navigate("/")}>
            Start next check-in
          </button>
        </div>
      }
    >
      <div className="dbgThankYouCenter">
        <div className="dbgBigTitle">Thank you.</div>
        <div className="dbgThankSub">Printing your badge now.</div>

        <div className="dbgSummaryBox">
          <div>
            <b>Name:</b> {visit.firstName} {visit.lastName}
          </div>
          <div>
            <b>Reason:</b> {visit.reasonLabel}
          </div>
          <div>
            <b>Badge:</b> {visit.badgeType}
          </div>
          {visit.host ? (
            <div>
              <b>Host:</b> {visit.host}
            </div>
          ) : null}
        </div>

        <div className="dbgSmallText">
          Returning to start in <b>{secondsLeft}</b> seconds.
        </div>
      </div>
    </DbgShell>
  );
}

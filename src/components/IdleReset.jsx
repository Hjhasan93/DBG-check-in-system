import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useVisit } from "../context/VisitContext";

export default function IdleReset({ minutes = 2 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setVisit } = useVisit();
  const timerRef = useRef(null);

  const resetVisit = () => {
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
  };

  const goHome = () => {
    resetVisit();
    if (location.pathname !== "/") navigate("/");
  };

  const arm = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(goHome, minutes * 60 * 1000);
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "touchstart", "keydown", "scroll"];
    const onActivity = () => arm();

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    arm();

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes, location.pathname]);

  return null;
}

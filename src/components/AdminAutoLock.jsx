import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminAutoLock({ minutes = 3 }) {
  const loc = useLocation();
  const nav = useNavigate();
  const timerRef = useRef(null);

  const inAdmin = loc.pathname.startsWith("/admin");

  const lock = () => {
    sessionStorage.removeItem("dbg_admin_unlocked");
    if (inAdmin) nav("/admin"); // will show PIN screen via AdminGuard
  };

  const arm = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(lock, minutes * 60 * 1000);
  };

  useEffect(() => {
    if (!inAdmin) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ["mousemove", "mousedown", "touchstart", "keydown", "scroll"];
    const onActivity = () => arm();

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    arm();

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inAdmin, minutes, loc.pathname]);

  return null;
}

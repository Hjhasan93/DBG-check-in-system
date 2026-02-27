import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Welcome from "./screens/Welcome";
import AboutYou from "./screens/AboutYou";
import ReasonSelect from "./screens/ReasonSelect";
import HostSelect from "./screens/HostSelect";
import TouringWith from "./screens/TouringWith";
import PhotoCapture from "./screens/PhotoCapture";
import Waiver from "./screens/Waiver";
import PrintBadge from "./screens/PrintBadge";
import ThankYou from "./screens/ThankYou";

import AdminVisits from "./screens/AdminVisits";
import AdminVisitDetail from "./screens/AdminVisitDetail";

import IdleReset from "./components/IdleReset";
import AdminAutoLock from "./components/AdminAutoLock";
import AdminGuard from "./components/AdminGuard";
import Watchlist from "./screens/Watchlist.jsx";

import { requestFullscreen, exitFullscreen, isFullscreen } from "./utils/fullscreen";

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const [fs, setFs] = useState(isFullscreen());

  useEffect(() => {
    const onChange = () => setFs(isFullscreen());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  return (
    <>
      {!isAdmin && (
        <button
          onClick={() => (fs ? exitFullscreen() : requestFullscreen())}
          style={styles.fullscreenBtn}
        >
          {fs ? "Exit Fullscreen" : "Go Fullscreen"}
        </button>
      )}

      <IdleReset minutes={2} />
      <AdminAutoLock minutes={3} />

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/about" element={<AboutYou />} />
        <Route path="/reason" element={<ReasonSelect />} />
        <Route path="/host" element={<HostSelect />} />
        <Route path="/touring-with" element={<TouringWith />} />
        <Route path="/photo" element={<PhotoCapture />} />
        <Route path="/waiver" element={<Waiver />} />
        <Route path="/print" element={<PrintBadge />} />
        <Route path="/thankyou" element={<ThankYou />} />
        <Route path="*" element={<Welcome />} />
        <Route path="/watchlist" element={<Watchlist />} />


        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminVisits />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/:id"
          element={
            <AdminGuard>
              <AdminVisitDetail />
            </AdminGuard>
          }
        />
      </Routes>
    </>
  );
}

const styles = {
  fullscreenBtn: {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 9999,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #2b2b2b",
    background: "#101010",
    color: "white",
    cursor: "pointer",
    opacity: 0.9,
  },
};

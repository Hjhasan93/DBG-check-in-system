import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./screens/Welcome";
import AboutYou from "./screens/AboutYou";
import ReasonSelect from "./screens/ReasonSelect";
import HostSelect from "./screens/HostSelect";
import PhotoCapture from "./screens/PhotoCapture";
import Waiver from "./screens/Waiver";
import ThankYou from "./screens/ThankYou";
import PrintBadge from "./screens/PrintBadge";
import TouringWith from "./screens/TouringWith";
import WatchlistResult from "./screens/WatchlistResult";
import AdminVisits from "./screens/AdminVisits";
import AdminVisitDetail from "./screens/AdminVisitDetail";




export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/about" element={<AboutYou />} />
        <Route path="/reason" element={<ReasonSelect />} />
        <Route path="/host" element={<HostSelect />} />
        <Route path="/photo" element={<PhotoCapture />} />
        <Route path="/waiver" element={<Waiver />} />
        <Route path="/thankyou" element={<ThankYou />} />
        <Route path="/print" element={<PrintBadge />} />
        <Route path="/touring-with" element={<TouringWith />} />
        <Route path="/watchlist" element={<WatchlistResult />} />
        <Route path="/admin" element={<AdminVisits />} />
        <Route path="/admin/:id" element={<AdminVisitDetail />} />





      </Routes>
    </BrowserRouter>
  );
}

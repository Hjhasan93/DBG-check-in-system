import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { VisitProvider } from "./context/VisitContext.jsx";
import KioskLock from "./components/KioskLock.jsx";
import "./styles/dbg.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <VisitProvider>
      <BrowserRouter>
        <KioskLock />
        <App />
      </BrowserRouter>
    </VisitProvider>
  </React.StrictMode>
);

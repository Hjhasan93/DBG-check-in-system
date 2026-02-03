import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { VisitProvider } from "./context/VisitContext.jsx";
import KioskLock from "./components/KioskLock";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <VisitProvider>
      <KioskLock />
      <App />
    </VisitProvider>
  </React.StrictMode>
);

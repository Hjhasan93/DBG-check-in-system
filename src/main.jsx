import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { VisitProvider } from "./context/VisitContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <VisitProvider>
      <App />
    </VisitProvider>
  </React.StrictMode>
);

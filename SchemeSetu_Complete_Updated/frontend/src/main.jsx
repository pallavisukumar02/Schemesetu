import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./i18n/i18n.js";
import { installGlobalTranslator } from "./i18n/globalTranslator.js";
import "./styles/index.css";

installGlobalTranslator();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <React.Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.Suspense>
  </React.StrictMode>
);

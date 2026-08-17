import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import App from "./App";
import "./styles/base.css";
import "./styles/boot.css";
import "./styles/auth.css";
import "./styles/picker.css";
import "./styles/shell.css";
import "./styles/overview.css";
import "./styles/code.css";
import "./styles/deploy.css";
import "./styles/services.css";
import "./styles/logs.css";
import "./styles/settings.css";
import "./styles/palette.css";
import "./styles/ai.css";
import "./styles/toast.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
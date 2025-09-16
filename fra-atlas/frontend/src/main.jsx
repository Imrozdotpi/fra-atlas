import React, { useEffect } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { getToken } from "./libs/apiClient";


function Boot() {
  useEffect(() => {
    const token = getToken();
    // redirect to login if not on landing page and no token
    if (!token && window.location.pathname !== "/") {
      const loginUrl =
        process.env.NEXT_PUBLIC_LOGIN_URL || "http://localhost:3000/login";
      window.location.href = loginUrl;
    }
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Boot />
  </StrictMode>
);

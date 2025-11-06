import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Clickjacking protection check
if (window.top !== window.self) {
  // Page is inside an iframe — block
  document.body.innerHTML = "";
  alert("⚠️ Clickjacking attempt detected! Page blocked for your protection.");
  window.top.location = window.location;
} else {
  console.log("✅ You are protected from clickjacking. This page is displayed safely.");
}

// Component to show the toast
function ClickjackingToast() {
  useEffect(() => {
    toast.success("✅ Protected from Clickjacking", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  }, []);

  return null; // This component does not render any visible HTML itself
}

// Render React
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer />
      <ClickjackingToast />
    </BrowserRouter>
  </React.StrictMode>
);

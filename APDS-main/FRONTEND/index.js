import React   from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from 'react-router-dom';

if (window.top !== window.self) {
  // Page is being loaded inside an iframe — block rendering
  document.body.innerHTML = "";
  alert("Clickjacking attempt detected! The page has been blocked for your protection.");
  window.top.location = window.location;
} else {
  console.log("✅ You are protected from clickjacking. This page is displayed safely.");

const banner = document.createElement("div");
  banner.textContent = "✅ Protected from Clickjacking";
  banner.style.position = "fixed";
  banner.style.bottom = "10px";
  banner.style.right = "10px";
  banner.style.backgroundColor = "#28a745";
  banner.style.color = "white";
  banner.style.padding = "8px 14px";
  banner.style.borderRadius = "6px";
  banner.style.fontSize = "14px";
  banner.style.zIndex = "9999";
  banner.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  banner.style.fontFamily = "Arial, sans-serif";
  banner.style.opacity = "0.9";
  
  document.body.appendChild(banner);

  // Optional: Fade out banner after 5 seconds
  setTimeout(() => {
    banner.style.transition = "opacity 1s ease";
    banner.style.opacity = "0";
    setTimeout(() => banner.remove(), 1000);
  }, 5000);
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <React.StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</React.StrictMode>
);

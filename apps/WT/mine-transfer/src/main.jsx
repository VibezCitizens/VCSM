import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import 'uno.css'
import App from "./App";
import { registerSW } from "virtual:pwa-register";

const RootMode = import.meta.env.VITE_REACT_STRICT_MODE === "1"
  ? React.StrictMode
  : React.Fragment;

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
} else if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );

  if ("caches" in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

createRoot(document.getElementById('root')).render(
  <RootMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </RootMode>
)


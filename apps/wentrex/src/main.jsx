import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import 'uno.css'
import App from "./App";
import { I18nProvider } from '@i18n'
import { wentrexDictionary } from '@/i18n/setup'
import { setupWentrexIdentityEngine } from "@/features/identity/setup";
import { setupWentrexChatEngine } from "@/features/communication/setup";

// Configure the identity engine before any component renders or auth checks run.
setupWentrexIdentityEngine();
setupWentrexChatEngine();
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
      <I18nProvider dictionary={wentrexDictionary}>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </RootMode>
)

import { useCallback } from "react";

function pushDataLayer(payload) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

function emitCustomEvent(payload) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("wanderex:track", { detail: payload }));
  } catch {
    // best effort
  }
}

export function useWanderExAnalytics(basePayload = {}) {
  return useCallback(
    (event, payload = {}) => {
      const merged = {
        event: `wanderex_${String(event || "event").trim()}`,
        ts: Date.now(),
        ...basePayload,
        ...payload,
      };

      pushDataLayer(merged);
      emitCustomEvent(merged);
      return merged;
    },
    [basePayload]
  );
}

export default useWanderExAnalytics;

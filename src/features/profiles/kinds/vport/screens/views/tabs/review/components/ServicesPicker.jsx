// src/features/profiles/kinds/vport/screens/views/tabs/review/components/ServicesPicker.jsx
import React from "react";
import { pill } from "../styles/reviewStyles";

export default function ServicesPicker({
  isServiceTab,
  loadingServices,
  services,
  serviceId,
  setServiceId,
}) {
  if (!isServiceTab) return null;

  return (
    <div style={{ marginTop: 12 }}>
      {loadingServices ? (
        <div className="text-sm text-neutral-300">Loading services…</div>
      ) : services?.length ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              style={pill(s.id === serviceId)}
              onClick={() => setServiceId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-300">No services yet.</div>
      )}
    </div>
  );
}

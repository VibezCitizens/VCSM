// src/features/profiles/kinds/vport/screens/views/tabs/review/components/ServicesPicker.jsx
import React from "react";
import { segWrap, segBtn } from "../styles/reviewStyles";

export default function ServicesPicker({
  isServiceTab,
  loadingServices,
  services,
  serviceId,
  setServiceId,
}) {
  if (!isServiceTab) return null;

  return (
    <div style={{ marginTop: 16 }}>
      {loadingServices ? (
        <div className="text-sm text-neutral-400">
          Loading services…
        </div>
      ) : services?.length ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.65)",
              letterSpacing: 0.3,
            }}
          >
            Select a service
          </div>

          <div style={segWrap()}>
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                style={segBtn(s.id === serviceId)}
                onClick={() => setServiceId(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-neutral-400">
          No services available.
        </div>
      )}
    </div>
  );
}

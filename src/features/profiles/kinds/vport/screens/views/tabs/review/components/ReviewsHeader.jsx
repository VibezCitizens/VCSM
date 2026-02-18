// src/features/profiles/kinds/vport/screens/views/tabs/review/components/ReviewsHeader.jsx
import React from "react";
import { pill } from "../styles/reviewStyles";

export default function ReviewsHeader({
  tab,
  setTab,
  tabLabel,
  displayCnt,
  displayAvg,
  isServiceTab,
  selectedServiceName,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h3 className="text-lg font-semibold">Reviews</h3>

        <div className="text-sm text-neutral-300" style={{ lineHeight: "18px" }}>
          {tabLabel} • {displayCnt} review{displayCnt === 1 ? "" : "s"}
          {displayAvg != null ? ` • ${displayAvg}★ avg` : ""}
          {isServiceTab && selectedServiceName ? ` • ${selectedServiceName}` : ""}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 2,
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "nowrap" }}>
          <button type="button" style={pill(tab === "overall")} onClick={() => setTab("overall")}>
            Overall
          </button>
          <button type="button" style={pill(tab === "food")} onClick={() => setTab("food")}>
            Food
          </button>
          <button type="button" style={pill(tab === "services")} onClick={() => setTab("services")}>
            Services
          </button>
        </div>
      </div>
    </div>
  );
}

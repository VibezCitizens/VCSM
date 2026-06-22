import React from "react";

const RULER_BG = "linear-gradient(180deg, rgba(17,21,35,0.96), rgba(8,11,21,0.92))";
const RULER_BORDER = "1px solid rgba(255,255,255,0.12)";

function RulerTick({ value, major, horizontal }) {
  if (horizontal) {
    return (
      <div
        style={{
          position: "absolute",
          left: value,
          top: major ? 0 : 11,
          width: 1,
          height: major ? 24 : 10,
          background: major ? "rgba(255,255,255,0.44)" : "rgba(255,255,255,0.22)",
        }}
      />
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        left: major ? 0 : 11,
        top: value,
        width: major ? 24 : 10,
        height: 1,
        background: major ? "rgba(255,255,255,0.44)" : "rgba(255,255,255,0.22)",
      }}
    />
  );
}

export function CanvasRulers({ horizontalTicks, verticalTicks, scaledWidth, scaledHeight, activeScale, RULER_SIZE }) {
  return (
    <>
      {/* Corner cap */}
      <div
        className="no-print-ruler"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: RULER_SIZE,
          height: RULER_SIZE,
          border: RULER_BORDER,
          borderRadius: 8,
          background: RULER_BG,
        }}
      />

      {/* Horizontal ruler */}
      <div
        className="no-print-ruler"
        style={{
          position: "absolute",
          left: RULER_SIZE,
          top: 0,
          width: scaledWidth,
          height: RULER_SIZE,
          border: RULER_BORDER,
          borderRadius: 8,
          background: RULER_BG,
          overflow: "hidden",
        }}
      >
        {horizontalTicks.map((tick) => (
          <RulerTick key={`hr-${tick.value}`} value={tick.value * activeScale} major={tick.major} horizontal />
        ))}
        {horizontalTicks.filter((t) => t.major).map((tick) => (
          <div
            key={`hl-${tick.value}`}
            style={{
              position: "absolute",
              left: tick.value * activeScale + 3,
              top: 3,
              fontSize: 10,
              fontWeight: 800,
              color: "rgba(255,255,255,0.68)",
              pointerEvents: "none",
            }}
          >
            {tick.value}
          </div>
        ))}
      </div>

      {/* Vertical ruler */}
      <div
        className="no-print-ruler"
        style={{
          position: "absolute",
          left: 0,
          top: RULER_SIZE,
          width: RULER_SIZE,
          height: scaledHeight,
          border: RULER_BORDER,
          borderRadius: 8,
          background: RULER_BG,
          overflow: "hidden",
        }}
      >
        {verticalTicks.map((tick) => (
          <RulerTick key={`vr-${tick.value}`} value={tick.value * activeScale} major={tick.major} horizontal={false} />
        ))}
        {verticalTicks.filter((t) => t.major).map((tick) => (
          <div
            key={`vl-${tick.value}`}
            style={{
              position: "absolute",
              left: 2,
              top: tick.value * activeScale + 2,
              transform: "rotate(-90deg)",
              transformOrigin: "top left",
              fontSize: 10,
              fontWeight: 800,
              color: "rgba(255,255,255,0.68)",
              pointerEvents: "none",
            }}
          >
            {tick.value}
          </div>
        ))}
      </div>
    </>
  );
}

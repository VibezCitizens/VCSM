import React from "react";

export function FuelGradeColumn({ grade }) {
  return (
    <article className={`fuel-module-grade fuel-module-${grade.key}`}>
      <div className="fuel-module-grade-head">
        <div className="fuel-module-grade-name">{grade.label}</div>
        <div className="fuel-module-grade-sub">with VCSM</div>
      </div>

      <div className="fuel-module-price-window">
        <div className="fuel-module-price">{grade.price}</div>
      </div>

      <div className="fuel-module-octane">
        <span>{grade.badge}</span>
        <strong>{grade.octane}</strong>
      </div>
    </article>
  );
}

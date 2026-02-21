// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\review\components\OverallDashboard.jsx
import React from "react";

export default function OverallDashboard({ loading, stats }) {
  if (loading) {
    return (
      <div className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 p-4 text-neutral-300">
        Loading stats...
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
        <div className="text-neutral-400 text-xs">Official Average</div>
        <div className="text-white text-xl font-semibold">{stats?.officialOverallAvg ?? "—"}</div>
      </div>
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
        <div className="text-neutral-400 text-xs">P50</div>
        <div className="text-white text-xl font-semibold">{stats?.officialOverallP50 ?? "—"}</div>
      </div>
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
        <div className="text-neutral-400 text-xs">P90</div>
        <div className="text-white text-xl font-semibold">{stats?.officialOverallP90 ?? "—"}</div>
      </div>
    </div>
  );
}
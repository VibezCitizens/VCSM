// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\review\components\ReviewsHeader.jsx
import React from "react";

export default function ReviewsHeader({
  loading,
  error,
  verifiedCount,
  onRefresh,
  onWriteReview,
  canReview,
}) {
  return (
    <div className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 p-4 flex items-center justify-between">
      <div className="space-y-1">
        <div className="text-white text-lg font-semibold">Reviews</div>
        <div className="text-neutral-400 text-sm">
          Verified reviews: <span className="text-white font-semibold">{verifiedCount}</span>
        </div>
        {error && (
          <div className="text-red-400 text-sm">
            {String(error?.message ?? error)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 rounded-2xl bg-neutral-900 text-white border border-neutral-700"
        >
          Refresh
        </button>

        <button
          type="button"
          onClick={onWriteReview}
          disabled={!canReview}
          className="px-4 py-2 rounded-2xl bg-purple-700 text-white border border-purple-500 disabled:opacity-50"
        >
          Write Review
        </button>
      </div>
    </div>
  );
}
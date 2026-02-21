// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\components\OwnerSuggestionReviewCard.jsx

import { useMemo, useState } from "react";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export function OwnerSuggestionReviewCard({
  submission,
  officialPrice, // { price, currencyCode, unit } or null
  onApprove,
  onReject,
  reviewing = false,
}) {
  const [reason, setReason] = useState("");

  const submittedAt = useMemo(
    () => formatTime(submission?.submittedAt),
    [submission?.submittedAt]
  );

  const delta = useMemo(() => {
    const p = Number(submission?.proposedPrice);
    const o = Number(officialPrice?.price);

    if (!Number.isFinite(p) || !Number.isFinite(o)) return null;

    const abs = p - o;
    const pct = o !== 0 ? abs / o : null;

    return { abs, pct };
  }, [submission?.proposedPrice, officialPrice?.price]);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">
            Fuel: <span className="text-neutral-200">{submission?.fuelKey}</span>
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            Submitted: <span className="text-neutral-200">{submittedAt}</span>
          </div>
          <div className="mt-2 text-sm text-neutral-200">
            Proposed:{" "}
            <span className="font-semibold text-white">
              {submission?.proposedPrice} {submission?.currencyCode}/{submission?.unit}
            </span>
          </div>

          {officialPrice?.price != null ? (
            <div className="mt-1 text-sm text-neutral-300">
              Official:{" "}
              <span className="text-neutral-100">
                {officialPrice.price} {officialPrice.currencyCode}/{officialPrice.unit}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-sm text-neutral-400">Official: —</div>
          )}

          {delta ? (
            <div className="mt-1 text-xs text-neutral-400">
              Δ {delta.abs >= 0 ? "+" : ""}
              {delta.abs.toFixed(3)}
              {delta.pct != null ? (
                <>
                  {" "}
                  ({delta.pct >= 0 ? "+" : ""}
                  {(delta.pct * 100).toFixed(1)}%)
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="rounded-2xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
            disabled={reviewing}
            onClick={() => onApprove?.({ submissionId: submission?.id, reason })}
          >
            Approve
          </button>
          <button
            type="button"
            className="rounded-2xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
            disabled={reviewing}
            onClick={() => onReject?.({ submissionId: submission?.id, reason })}
          >
            Reject
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs text-neutral-400">Reason (optional)</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="
            mt-2 w-full px-4 py-2 pr-10
            rounded-2xl bg-neutral-900 text-white
            border border-purple-700
            focus:ring-2 focus:ring-purple-500
          "
          placeholder="Why approved/rejected?"
          disabled={reviewing}
        />
      </div>
    </div>
  );
}
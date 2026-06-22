import { useMemo, useState } from "react";

import {
  formatRelativeTime,
  formatExactTimestamp,
  toISOStringSafe,
} from "@/shared/lib/formatRelativeTime";
import { prettyFuelLabel } from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasPrices.model";

/**
 * One card per citizen submission batch.
 *
 * A batch carries one or more fuel rows submitted together by a single citizen.
 * Approve All / Reject All act on the whole batch through the secure RPC, so the
 * owner reviews a citizen's submission as a unit instead of fuel-by-fuel.
 *
 * Identity-safe: renders only the submitter's display name + avatar (resolved
 * upstream from actorId). No raw actor/profile UUID is shown.
 */
export function OwnerPendingBatchCard({
  batch,
  officialByFuelKey = {},
  onApproveAll,
  onRejectAll,
  reviewing = false,
}) {
  const [reason, setReason] = useState("");

  const submitter = batch?.submitter ?? null;
  const submissions = batch?.submissions ?? [];

  const submittedRelative = useMemo(
    () => formatRelativeTime(batch?.submittedAtMax),
    [batch?.submittedAtMax]
  );
  const submittedExact = useMemo(
    () => formatExactTimestamp(batch?.submittedAtMax),
    [batch?.submittedAtMax]
  );
  const submittedIso = useMemo(
    () => toISOStringSafe(batch?.submittedAtMax),
    [batch?.submittedAtMax]
  );

  if (!batch || submissions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={submitter?.avatar || "/avatar.jpg"}
            alt=""
            className="h-10 w-10 rounded-lg border border-white/12 object-cover"
            onError={(e) => {
              e.currentTarget.src = "/avatar.jpg";
            }}
          />
          <div>
            <div className="text-sm font-semibold text-white">
              {submitter?.displayName || "Citizen"}
            </div>
            <div className="mt-0.5 text-xs text-white/50">
              Submitted{" "}
              <time
                dateTime={submittedIso}
                title={submittedExact || undefined}
                className="text-white/85"
              >
                {submittedRelative}
              </time>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="rounded-2xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
            disabled={reviewing}
            onClick={() =>
              onApproveAll?.({ submissionBatchId: batch.submissionBatchId, reason })
            }
          >
            Approve All
          </button>
          <button
            type="button"
            className="rounded-2xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
            disabled={reviewing}
            onClick={() =>
              onRejectAll?.({ submissionBatchId: batch.submissionBatchId, reason })
            }
          >
            Reject All
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {submissions.map((s) => {
          const official = officialByFuelKey?.[s.fuelKey] ?? null;
          const p = Number(s?.proposedPrice);
          const o = Number(official?.price);
          const delta =
            Number.isFinite(p) && Number.isFinite(o)
              ? { abs: p - o, pct: o !== 0 ? (p - o) / o : null }
              : null;

          return (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2"
            >
              <div className="text-sm text-white/85">
                {prettyFuelLabel(s.fuelKey)}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  {s.proposedPrice} {s.currencyCode}/{s.unit}
                </div>
                <div className="text-[11px] text-white/45">
                  Official: {official?.price != null ? `${official.price} ${official.currencyCode}/${official.unit}` : "—"}
                  {delta ? (
                    <>
                      {"  ·  Δ "}
                      {delta.abs >= 0 ? "+" : ""}
                      {delta.abs.toFixed(3)}
                      {delta.pct != null ? (
                        <>
                          {" ("}
                          {delta.pct >= 0 ? "+" : ""}
                          {(delta.pct * 100).toFixed(1)}%{")"}
                        </>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <label className="block text-xs text-white/50">Reason (optional)</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="
            mt-2 w-full px-4 py-2 pr-10
            rounded-2xl bg-white/4 text-white
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

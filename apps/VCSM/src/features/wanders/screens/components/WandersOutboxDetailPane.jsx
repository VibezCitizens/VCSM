import React from "react";
import WandersCardDetail from "@/features/wanders/components/WandersCardDetail";
import WandersRepliesList from "@/features/wanders/components/WandersRepliesList";
import WandersReplyComposer from "@/features/wanders/components/WandersReplyComposer";
import WandersEmptyState from "@/features/wanders/components/WandersEmptyState";

export function WandersOutboxDetailPane({
  selectedItem,
  selectedCardForDetail,
  selectedCardId,
  repliesLoading,
  normalizedReplyItems,
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 text-white backdrop-blur-xl",
        "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(124,58,237,0.10)]",
      ].join(" ")}
      style={{ borderRadius: 14, minHeight: 280, overflow: "hidden" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/08 blur-3xl"
      />

      <div
        style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box" }}
        className="relative"
      >
        {!selectedItem ? (
          <WandersEmptyState title="Select a message" subtitle="Choose an item to view it." />
        ) : (
          <>
            <div
              className="rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur"
              style={{ borderRadius: 12, padding: 10 }}
            >
              <WandersCardDetail card={selectedCardForDetail} />

              <div style={{ marginTop: 12 }}>
                <div
                  className="text-sm font-semibold text-white/90"
                  style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}
                >
                  Replies
                </div>

                {repliesLoading ? (
                  <div className="py-6 text-center text-sm text-white/60">Loading replies…</div>
                ) : (
                  <WandersRepliesList
                    replies={normalizedReplyItems}
                    currentAnonId={null}
                    labelMode="fully-neutral"
                  />
                )}
              </div>
            </div>

            <div
              className="rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur"
              style={{ borderRadius: 12, padding: 10 }}
            >
              <WandersReplyComposer
                disabled={!selectedCardId}
                cardId={selectedCardId}
                mailboxItem={selectedItem}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

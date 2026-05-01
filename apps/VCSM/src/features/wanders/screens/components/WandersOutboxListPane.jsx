import React from "react";
import WandersMailboxList from "@/features/wanders/components/WandersMailboxList";
import WandersMailboxItemRow from "@/features/wanders/components/WandersMailboxItemRow";
import WandersEmptyState from "@/features/wanders/components/WandersEmptyState";

export function WandersOutboxListPane({ filteredItems, selectedId, onSelectItem, search }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 text-white backdrop-blur-xl",
        "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(124,58,237,0.10)]",
      ].join(" ")}
      style={{ borderRadius: 14, overflow: "hidden", minHeight: 280 }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/08 blur-3xl"
      />

      <div className="relative">
        {filteredItems.length ? (
          <WandersMailboxList
            items={filteredItems}
            selectedItemId={selectedId}
            onItemClick={onSelectItem}
            renderRow={(item) => (
              <WandersMailboxItemRow
                key={String(item.id)}
                item={item}
                selected={String(item.id) === String(selectedId)}
                onClick={() => onSelectItem(item)}
              />
            )}
            empty={
              <WandersEmptyState
                title="No sent cards"
                subtitle={search ? "No items match your search." : "You haven't sent anything yet."}
              />
            }
          />
        ) : (
          <WandersEmptyState
            title="No sent cards"
            subtitle={search ? "No items match your search." : "You haven't sent anything yet."}
          />
        )}
      </div>
    </div>
  );
}

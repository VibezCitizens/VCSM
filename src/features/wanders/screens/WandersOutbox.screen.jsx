// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersOutbox.screen.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import useWandersMailbox from "@/features/wanders/core/hooks/useWandersMailbox.hook";
import { useWandersReplies } from "@/features/wanders/core/hooks/useWandersReplies"; // core "smart" hook w/ create/remove too

import WandersMailboxToolbar from "../components/WandersMailboxToolbar";
import WandersMailboxList from "../components/WandersMailboxList";
import WandersMailboxItemRow from "../components/WandersMailboxItemRow";
import WandersCardDetail from "../components/WandersCardDetail";
import WandersRepliesList from "../components/WandersRepliesList";
import WandersReplyComposer from "../components/WandersReplyComposer";

import WandersEmptyState from "../components/WandersEmptyState";
import WandersLoading from "../components/WandersLoading";

export default function WandersOutboxScreen() {
  // ✅ ensure auth user exists (guest user) so auth.uid() works in RLS
  const { ensureUser } = useWandersGuest({ auto: true });

  // Fixed filter:
  const [folder] = useState("outbox");
  const [ownerRole] = useState("sender");

  // Keep search + selection UX
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // ✅ CORE mailbox
  const mailbox = useWandersMailbox({ auto: false, folder, ownerRole, limit: 50 });
  const { items, loading, error, refresh, markRead } = mailbox || {};

  useEffect(() => {
    (async () => {
      try {
        await Promise.resolve(ensureUser?.());
      } catch {
        // ignore
      }
    })();
  }, [ensureUser]);

  // ✅ fetch outbox when inputs change
  useEffect(() => {
    (async () => {
      try {
        await Promise.resolve(refresh?.({ folder, ownerRole }));
      } catch {
        // hook exposes error
      }
    })();
  }, [folder, ownerRole, refresh]);

  const normalizedItems = useMemo(() => {
    if (Array.isArray(items)) return items;
    if (Array.isArray(items?.data)) return items.data;
    if (Array.isArray(items?.items)) return items.items;
    return [];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return normalizedItems;

    return normalizedItems.filter((item) => {
      const card = item?.card ?? {};
      const msg = String(card?.messageText ?? card?.message_text ?? "").toLowerCase();
      const customization = card?.customization ?? {};
      const fromName = String(customization?.fromName ?? customization?.from_name ?? "").toLowerCase();
      const toName = String(customization?.toName ?? customization?.to_name ?? "").toLowerCase();
      const templateKey = String(card?.templateKey ?? card?.template_key ?? "").toLowerCase();

      return msg.includes(q) || fromName.includes(q) || toName.includes(q) || templateKey.includes(q);
    });
  }, [normalizedItems, search]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return filteredItems.find((it) => String(it.id) === String(selectedId)) || null;
  }, [filteredItems, selectedId]);

  const selectedCardId = useMemo(() => {
    if (!selectedItem) return null;
    return selectedItem.card_id || selectedItem.cardId || selectedItem.card?.id || null;
  }, [selectedItem]);

  // ✅ CORE replies (smart hook)
  const replies = useWandersReplies({ cardId: selectedCardId, auto: true, limit: 200 });
  const replyItems = replies?.replies;
  const repliesLoading = replies?.loading;

  const normalizedReplyItems = useMemo(() => {
    if (Array.isArray(replyItems)) return replyItems;
    if (Array.isArray(replyItems?.items)) return replyItems.items;
    if (Array.isArray(replyItems?.data)) return replyItems.data;
    return [];
  }, [replyItems]);

  // auto-select first item
  useEffect(() => {
    if (selectedId) return;
    if (!filteredItems.length) return;
    setSelectedId(String(filteredItems[0].id));
  }, [filteredItems, selectedId]);

  // keep selection valid when filtered list changes
  useEffect(() => {
    if (!selectedId) return;
    const stillExists = filteredItems.some((it) => String(it.id) === String(selectedId));
    if (stillExists) return;

    if (!filteredItems.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId(String(filteredItems[0].id));
  }, [filteredItems, selectedId]);

  // mark read (outbox usually already read, but safe)
  useEffect(() => {
    if (!selectedItem) return;

    const isUnread =
      typeof selectedItem.is_read === "boolean"
        ? !selectedItem.is_read
        : typeof selectedItem.isRead === "boolean"
        ? !selectedItem.isRead
        : false;

    if (!isUnread) return;

    (async () => {
      try {
        await Promise.resolve(markRead?.(selectedItem.id, true));
      } catch {
        // ignore
      }
    })();
  }, [selectedItem, markRead]);

  const onSelectItem = useCallback((item) => {
    setSelectedId(String(item?.id));
  }, []);

  const toolbarModel = useMemo(
    () => ({
      currentFolder: folder,
      searchQuery: search,
      onFolderChange: undefined, // locked
      onSearchChange: setSearch,
      disabled: !!loading,
      isFolderLocked: true,
    }),
    [folder, search, loading]
  );

  if (loading) return <WandersLoading />;

  if (error) {
    return <WandersEmptyState title="Outbox unavailable" subtitle={String(error?.message || error)} />;
  }

  return (
    <div className="wanders-outbox" style={styles.page}>
      <div style={styles.toolbar}>
        <WandersMailboxToolbar {...toolbarModel} />
      </div>

      <div style={styles.split}>
        <div style={styles.left}>
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
                  subtitle={search ? "No items match your search." : "You haven’t sent anything yet."}
                />
              }
            />
          ) : (
            <WandersEmptyState
              title="No sent cards"
              subtitle={search ? "No items match your search." : "You haven’t sent anything yet."}
            />
          )}
        </div>

        <div style={styles.right}>
          {!selectedItem ? (
            <WandersEmptyState title="Select a message" subtitle="Choose an item to view it." />
          ) : (
            <div style={styles.detailWrap}>
              <div style={styles.cardDetail}>
                <WandersCardDetail card={selectedItem?.card ?? selectedItem} />
                <div style={{ marginTop: 12 }}>
                  <div style={styles.sectionTitle}>Replies</div>
                  {repliesLoading ? (
                    <div className="py-6 text-center text-sm text-gray-500">Loading replies…</div>
                  ) : (
                    <WandersRepliesList replies={normalizedReplyItems} />
                  )}
                </div>
              </div>

              <div style={styles.composer}>
                <WandersReplyComposer
                  disabled={!selectedCardId}
                  cardId={selectedCardId}
                  mailboxItem={selectedItem}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100%",
    boxSizing: "border-box",
    padding: 12,
  },
  toolbar: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    paddingBottom: 10,
    background: "transparent",
  },
  split: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },
  left: {
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    overflow: "hidden",
    minHeight: 280,
  },
  right: {
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    minHeight: 280,
    overflow: "hidden",
  },
  detailWrap: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxSizing: "border-box",
  },
  cardDetail: {
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    padding: 10,
    background: "rgba(0,0,0,0.02)",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
  },
  composer: {
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    padding: 10,
  },
};

if (typeof window !== "undefined") {
  const applyResponsive = () => {
    const isWide = window.innerWidth >= 980;
    styles.split.gridTemplateColumns = isWide ? "0.95fr 1.35fr" : "1fr";
  };
  applyResponsive();
  window.addEventListener("resize", applyResponsive);
}

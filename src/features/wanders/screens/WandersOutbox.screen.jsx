// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersOutbox.screen.jsx

import React, { useEffect, useMemo, useState } from "react";

import { useWandersAnon } from "../hooks/useWandersAnon";
import { useWandersMailbox } from "../hooks/useWandersMailbox";
import { useWandersReplies } from "../hooks/useWandersReplies";

import WandersMailboxToolbar from "../components/WandersMailboxToolbar";
import WandersMailboxList from "../components/WandersMailboxList";
import WandersMailboxItemRow from "../components/WandersMailboxItemRow";
import WandersCardDetail from "../components/WandersCardDetail";
import WandersRepliesList from "../components/WandersRepliesList";
import WandersReplyComposer from "../components/WandersReplyComposer";

import WandersEmptyState from "../components/WandersEmptyState";
import WandersLoading from "../components/WandersLoading";

export default function WandersOutboxScreen() {
  const { ensureAnon } = useWandersAnon();

  const mailbox = useWandersMailbox();
  const { list, items, loading, error, markRead } = mailbox || {};

  // Fixed filter:
  const [folder] = useState("outbox");
  const [role] = useState("sender");

  // Keep search + selection UX
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await Promise.resolve(ensureAnon?.());
      } catch {
        // ignore
      }
    })();
  }, [ensureAnon]);

  useEffect(() => {
    (async () => {
      try {
        await Promise.resolve(
          list?.({
            folder,
            role,
            search,
          })
        );
      } catch {
        // hook exposes error
      }
    })();
  }, [folder, role, search, list]);

  const normalizedItems = useMemo(() => {
    if (Array.isArray(items)) return items;
    if (Array.isArray(items?.data)) return items.data;
    if (Array.isArray(items?.items)) return items.items;
    return [];
  }, [items]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return normalizedItems.find((it) => String(it.id || it.item_id) === String(selectedId)) || null;
  }, [normalizedItems, selectedId]);

  const selectedCardId = useMemo(() => {
    if (!selectedItem) return null;
    return selectedItem.card_id || selectedItem.cardId || selectedItem.card?.id || null;
  }, [selectedItem]);

  const replies = useWandersReplies(selectedCardId);
  const { items: replyItems, loading: repliesLoading } = replies || {};

  useEffect(() => {
    // auto-select first item
    if (selectedId) return;
    if (!normalizedItems.length) return;
    const first = normalizedItems[0];
    setSelectedId(String(first.id || first.item_id));
  }, [normalizedItems, selectedId]);

  useEffect(() => {
    if (!selectedItem) return;

    const isUnread =
      typeof selectedItem.is_read === "boolean"
        ? !selectedItem.is_read
        : typeof selectedItem.read === "boolean"
        ? !selectedItem.read
        : typeof selectedItem.read_at === "string"
        ? false
        : false;

    if (!isUnread) return;

    (async () => {
      try {
        await Promise.resolve(markRead?.(selectedItem.id || selectedItem.item_id || selectedId));
      } catch {
        // ignore
      }
    })();
  }, [selectedItem, selectedId, markRead]);

  const onSelectItem = (item) => setSelectedId(String(item?.id || item?.item_id));

  const toolbarModel = useMemo(
    () => ({
      folder, // fixed
      role, // fixed
      search,
      setFolder: undefined, // toolbar can optionally hide/disable
      setRole: undefined,
      setSearch,
      // If your toolbar expects flags:
      isFolderLocked: true,
      isRoleLocked: true,
    }),
    [folder, role, search]
  );

  if (loading) return <WandersLoading />;

  if (error) {
    return (
      <WandersEmptyState
        title="Outbox unavailable"
        subtitle={String(error?.message || error)}
      />
    );
  }

  return (
    <div className="wanders-outbox" style={styles.page}>
      <div style={styles.toolbar}>
        <WandersMailboxToolbar {...toolbarModel} />
      </div>

      <div style={styles.split}>
        <div style={styles.left}>
          {normalizedItems.length ? (
            <WandersMailboxList
              items={normalizedItems}
              selectedId={selectedId}
              onSelect={onSelectItem}
              renderRow={(item) => (
                <WandersMailboxItemRow
                  key={String(item.id || item.item_id)}
                  item={item}
                  selected={String(item.id || item.item_id) === String(selectedId)}
                  onClick={() => onSelectItem(item)}
                />
              )}
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
                <WandersCardDetail item={selectedItem} cardId={selectedCardId} />
              </div>

              <div style={styles.replies}>
                <div style={styles.sectionTitle}>Replies</div>
                <WandersRepliesList
                  loading={!!repliesLoading}
                  items={Array.isArray(replyItems) ? replyItems : replyItems?.items || []}
                  cardId={selectedCardId}
                />
              </div>

              <div style={styles.composer}>
                <WandersReplyComposer cardId={selectedCardId} mailboxItem={selectedItem} />
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
  replies: {
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    padding: 10,
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

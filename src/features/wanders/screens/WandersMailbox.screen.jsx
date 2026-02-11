// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersMailbox.screen.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

import { useWandersAnon } from "../hooks/useWandersAnon";
import { useWandersMailbox } from "../hooks/useWandersMailbox";
import { useWandersReplies } from "../hooks/useWandersReplies";

import WandersMailboxToolbar from "../components/WandersMailboxToolbar";
import WandersMailboxList from "../components/WandersMailboxList";
import WandersCardDetail from "../components/WandersCardDetail";
import WandersRepliesList from "../components/WandersRepliesList";
import WandersReplyComposer from "../components/WandersReplyComposer";

import WandersEmptyState from "../components/WandersEmptyState";
import WandersLoading from "../components/WandersLoading";

// ✅ ADD: controller used by screen (composer stays UI-only)
import { createReplyAsAnon } from "@/features/wanders/controllers/wandersRepliescontroller";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function resolveInitialFolder(mode) {
  const m = String(mode || "").trim().toLowerCase();
  if (m === "sent" || m === "outbox") return "outbox";
  return "inbox";
}

export default function WandersMailboxScreen() {
  const query = useQuery();
  const mode = query.get("mode");

  const { ensureAnon } = useWandersAnon();

  const [folder, setFolder] = useState(() => resolveInitialFolder(mode)); // 'inbox' | 'outbox'
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [isWide, setIsWide] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 980;
  });

  // ✅ ADD: reply submit UI state (prevents silent fails)
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => setIsWide(window.innerWidth >= 980);
    onResize();

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.resolve(ensureAnon?.());
      } catch {
        // ignore
      }
    })();
  }, [ensureAnon]);

  // ✅ If URL mode changes while mounted, sync folder (navigation)
  useEffect(() => {
    const next = resolveInitialFolder(mode);
    setFolder(next);
    setSelectedId(null);
    setReplyError(null);
  }, [mode]);

  const mailbox = useWandersMailbox({ auto: false, folder, ownerRole: null, limit: 50 });
  const { items, loading, error, refresh, markRead } = mailbox || {};

  // ✅ Refresh ONLY when folder changes (navigation)
  useEffect(() => {
    (async () => {
      try {
        await Promise.resolve(refresh?.({ folder }));
      } catch {
        // hook exposes error
      }
    })();
  }, [folder, refresh]);

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

  // ✅ Replies: only load when selectedCardId changes.
  const replies = useWandersReplies({ cardId: selectedCardId, auto: false, limit: 200 });
  const replyItems = replies?.replies; // hook returns "replies"
  const repliesLoading = replies?.loading;

  const normalizedReplyItems = useMemo(() => {
    if (Array.isArray(replyItems)) return replyItems;
    if (Array.isArray(replyItems?.items)) return replyItems.items;
    if (Array.isArray(replyItems?.data)) return replyItems.data;
    return [];
  }, [replyItems]);

  // ✅ Refresh replies ONLY on navigation (selectedCardId change)
  useEffect(() => {
    if (!selectedCardId) return;
    (async () => {
      try {
        await Promise.resolve(replies?.refresh?.());
      } catch {
        // ignore
      }
    })();
  }, [selectedCardId, replies]);

  useEffect(() => {
    if (!selectedItem) return;
    if (folder !== "inbox") return;

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
  }, [selectedItem, folder, markRead]);

  useEffect(() => {
    if (selectedId) return;
    if (!filteredItems.length) return;
    setSelectedId(String(filteredItems[0].id));
  }, [filteredItems, selectedId]);

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

  const onItemClick = useCallback((item) => {
    setSelectedId(String(item?.id));
    setReplyError(null);
  }, []);

  const splitStyle = useMemo(
    () => ({
      ...styles.split,
      gridTemplateColumns: isWide ? "0.95fr 1.35fr" : "1fr",
    }),
    [isWide]
  );

  const toolbarProps = useMemo(
    () => ({
      currentFolder: folder,
      searchQuery: search,
      onFolderChange: (next) => {
        setFolder(next);     // navigation triggers mailbox refresh
        setSelectedId(null); // navigation reset
        setReplyError(null);
      },
      onSearchChange: (q) => setSearch(q),
      disabled: !!loading,
    }),
    [folder, search, loading]
  );

  // ✅ After sending a reply: refresh replies only (no mailbox spam)
  const handleReplySent = useCallback(async () => {
    try {
      await Promise.resolve(replies?.refresh?.());
    } catch {
      // ignore
    }
  }, [replies]);

  // ✅ ADD: actual submit handler for UI-only composer
  const handleReplySubmit = useCallback(
    async ({ body }) => {
      if (!selectedCardId) return;

      setReplyError(null);
      setReplySending(true);
      try {
        await Promise.resolve(
          createReplyAsAnon({
            cardId: selectedCardId,
            body,
          })
        );

        // refresh replies after successful send
        await Promise.resolve(handleReplySent?.());
      } catch (e) {
        console.error("[Mailbox] reply submit failed", e);
        setReplyError(String(e?.message || e));
        throw e; // lets composer catch if it wants
      } finally {
        setReplySending(false);
      }
    },
    [selectedCardId, handleReplySent]
  );

  if (loading) return <WandersLoading />;

  if (error) {
    return <WandersEmptyState title="Mailbox unavailable" subtitle={String(error?.message || error)} />;
  }

  return (
    <div className="wanders-mailbox" style={styles.page}>
      <div style={styles.toolbar}>
        <WandersMailboxToolbar {...toolbarProps} />
      </div>

      <div style={splitStyle}>
        <div style={styles.left}>
          {filteredItems.length ? (
            <WandersMailboxList
              items={filteredItems}
              loading={false}
              onItemClick={onItemClick}
              selectedItemId={selectedId}
              empty={
                <WandersEmptyState
                  title="No messages"
                  subtitle={search ? "No items match your search." : "Your mailbox is empty in this folder."}
                />
              }
            />
          ) : (
            <WandersEmptyState
              title="No messages"
              subtitle={search ? "No items match your search." : "Your mailbox is empty in this folder."}
            />
          )}
        </div>

        <div style={styles.right}>
          {!selectedItem ? (
            <WandersEmptyState title="Select a message" subtitle="Choose an item to view it." />
          ) : (
            <div style={styles.detailWrap}>
              <div style={styles.cardDetail}>
                <WandersCardDetail
                  card={selectedItem?.card ?? selectedItem}
                  replies={
                    <div>
                      <div style={styles.sectionTitle}>Replies</div>

                      {repliesLoading ? (
                        <div className="py-6 text-center text-sm text-gray-500">
                          Loading replies…
                        </div>
                      ) : (
                        <WandersRepliesList replies={normalizedReplyItems} />
                      )}
                    </div>
                  }
                />
              </div>

              <div style={styles.composer}>
                {replyError ? (
                  <div className="mb-2 text-sm font-semibold text-red-600">
                    {replyError}
                  </div>
                ) : null}

                <WandersReplyComposer
                  onSubmit={handleReplySubmit}
                  onSent={handleReplySent}
                  loading={replySending}
                  disabled={!selectedCardId}
                  placeholder="Write a reply…"
                  buttonLabel="Send"
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
    height: "100dvh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
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
    alignItems: "start",
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

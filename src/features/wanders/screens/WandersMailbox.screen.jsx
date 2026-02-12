// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersMailbox.screen.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import useWandersMailbox from "@/features/wanders/core/hooks/useWandersMailbox.hook";
import useWandersReplies from "@/features/wanders/core/hooks/useWandersReplies.hook";

import WandersMailboxToolbar from "../components/WandersMailboxToolbar";
import WandersMailboxList from "../components/WandersMailboxList";
import WandersCardDetail from "../components/WandersCardDetail";
import WandersRepliesList from "../components/WandersRepliesList";
import WandersReplyComposer from "../components/WandersReplyComposer";

import WandersEmptyState from "../components/WandersEmptyState";
import WandersLoading from "../components/WandersLoading";

import { createReplyAsAnon } from "@/features/wanders/core/controllers/replies.controller";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function resolveInitialFolder(mode) {
  const m = String(mode || "").trim().toLowerCase();
  if (m === "sent" || m === "outbox") return "outbox";
  return "inbox";
}

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  let s = value.trim();
  if (!s) return null;

  for (let i = 0; i < 2; i++) {
    try {
      const parsed = JSON.parse(s);

      if (parsed && typeof parsed === "object") return parsed;

      if (typeof parsed === "string") {
        s = parsed.trim();
        if (!s) return null;
        continue;
      }

      return null;
    } catch {
      return null;
    }
  }

  return null;
}

export default function WandersMailboxScreen() {
  const query = useQuery();
  const mode = query.get("mode");

  const { ensureUser } = useWandersGuest({ auto: true });

  const [folder, setFolder] = useState(() => resolveInitialFolder(mode));
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [isWide, setIsWide] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 980;
  });

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
        await Promise.resolve(ensureUser?.());
      } catch {
        // ignore
      }
    })();
  }, [ensureUser]);

  useEffect(() => {
    const next = resolveInitialFolder(mode);
    setFolder(next);
    setSelectedId(null);
    setReplyError(null);
  }, [mode]);

  const mailbox = useWandersMailbox({ auto: false, folder, ownerRole: null, limit: 50 });
  const { items, loading, error, refresh, markRead } = mailbox || {};

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

      const customizationRaw =
        card?.customization ??
        card?.customization_json ??
        card?.customizationJson ??
        null;

      const customization = safeParseJson(customizationRaw) ?? customizationRaw ?? {};

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

  useEffect(() => {
    if (!selectedItem) return;
    console.log("[Mailbox] selectedItem.card =", selectedItem?.card);
  }, [selectedItem]);

  const selectedCardForDetail = useMemo(() => {
    if (!selectedItem) return null;

    const rawCard = selectedItem?.card ?? null;
    if (!rawCard) return null;

    const customizationRaw =
      rawCard?.customization ??
      rawCard?.customization_json ??
      rawCard?.customizationJson ??
      null;

    const customizationParsed = safeParseJson(customizationRaw) ?? customizationRaw ?? {};
    const customization =
      customizationParsed && typeof customizationParsed === "object" ? customizationParsed : {};

    const templateKey = rawCard?.templateKey ?? rawCard?.template_key ?? "";

    if (String(templateKey).startsWith("photo.")) {
      const imageUrl =
        customization?.imageUrl ??
        customization?.image_url ??
        rawCard?.imageUrl ??
        rawCard?.image_url ??
        "";

      const title = customization?.title ?? "";
      const message =
        customization?.message ??
        rawCard?.message ??
        rawCard?.messageText ??
        rawCard?.message_text ??
        "";

      const mergedCustomization = {
        ...customization,
        imageUrl: imageUrl || null,
        image_url: imageUrl || null,
      };

      return {
        ...rawCard,
        templateKey,
        template_key: templateKey,
        customization: mergedCustomization,
        title,
        message,
        messageText: rawCard?.messageText ?? rawCard?.message_text ?? message,
      };
    }

    return {
      ...rawCard,
      templateKey,
      template_key: templateKey,
      customization,
    };
  }, [selectedItem]);

  const replies = useWandersReplies({ cardId: selectedCardId, auto: false, limit: 200 });
  const replyItems = replies?.replies;
  const repliesLoading = replies?.loading;

  const normalizedReplyItems = useMemo(() => {
    if (Array.isArray(replyItems)) return replyItems;
    if (Array.isArray(replyItems?.items)) return replyItems.items;
    if (Array.isArray(replyItems?.data)) return replyItems.data;
    return [];
  }, [replyItems]);

  useEffect(() => {
    if (!selectedCardId) return;
    (async () => {
      try {
        await Promise.resolve(replies?.refresh?.());
      } catch {
        // ignore
      }
    })();
  }, [selectedCardId, replies?.refresh]);

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
        setFolder(next);
        setSelectedId(null);
        setReplyError(null);
      },
      onSearchChange: (q) => setSearch(q),
      disabled: !!loading,
    }),
    [folder, search, loading]
  );

  const handleReplySent = useCallback(async () => {
    try {
      await Promise.resolve(replies?.refresh?.());
    } catch {
      // ignore
    }
  }, [replies?.refresh]);

  const handleReplySubmit = useCallback(
    async ({ body }) => {
      if (!selectedCardId) return;

      setReplyError(null);
      setReplySending(true);
      try {
        await Promise.resolve(ensureUser?.());

        await Promise.resolve(
          createReplyAsAnon({
            cardId: selectedCardId,
            body,
          })
        );

        await Promise.resolve(handleReplySent?.());
      } catch (e) {
        console.error("[Mailbox] reply submit failed", e);
        setReplyError(String(e?.message || e));
        throw e;
      } finally {
        setReplySending(false);
      }
    },
    [selectedCardId, handleReplySent, ensureUser]
  );

  if (loading) return <WandersLoading />;

  if (error) {
    return <WandersEmptyState title="Mailbox unavailable" subtitle={String(error?.message || error)} />;
  }

  return (
    <div style={styles.pageOuter}>
      {/* Background glow */}
      <div style={styles.bgGlow} aria-hidden />

      <div style={styles.page}>
        <div style={styles.toolbar}>
          <WandersMailboxToolbar {...toolbarProps} />
        </div>

        <div style={splitStyle}>
          {/* LEFT LIST */}
          <div style={styles.panel}>
            <div style={styles.glowTL} aria-hidden />
            <div style={styles.glowBR} aria-hidden />

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

          {/* RIGHT DETAIL */}
          <div style={styles.panel}>
            <div style={styles.glowTL} aria-hidden />
            <div style={styles.glowBR} aria-hidden />

            {!selectedItem ? (
              <div style={styles.detailWrap}>
                <WandersEmptyState title="Select a message" subtitle="Choose an item to view it." />
              </div>
            ) : !selectedCardForDetail ? (
              <div style={styles.detailWrap}>
                <WandersEmptyState
                  title="Card unavailable"
                  subtitle="This item loaded, but its card preview is not accessible (embed card is missing)."
                />
              </div>
            ) : (
              <div style={styles.detailWrap}>
                <div style={styles.subPanel}>
                  <WandersCardDetail
                    card={selectedCardForDetail}
                    replies={
                      <div>
                        <div style={styles.sectionTitle}>Replies</div>

                        {repliesLoading ? (
                          <div style={styles.loadingText}>Loading replies…</div>
                        ) : (
                          <WandersRepliesList
                            replies={normalizedReplyItems}
                            currentAnonId={selectedItem?.owner_anon_id || selectedItem?.ownerAnonId || null}
                            labelMode="fully-neutral"
                          />
                        )}
                      </div>
                    }
                  />
                </div>

                <div style={styles.subPanel}>
                  {replyError ? <div style={styles.replyError}>{replyError}</div> : null}

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
    </div>
  );
}

const styles = {
  pageOuter: {
    position: "relative",
    minHeight: "100dvh",
    width: "100%",
    background: "#000",
    color: "#fff",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },

  // same “Sent” background glow, but in CSS
  bgGlow: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(600px 200px at 50% -80px, rgba(168, 85, 247, 0.15), transparent)",
  },

  page: {
    position: "relative",
    width: "100%",
    minHeight: "100dvh",
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

  // ✅ Main glass panel (matches Sent theme)
  panel: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow:
      "0 16px 40px rgba(0,0,0,0.55), 0 0 36px rgba(124,58,237,0.10)",
    minHeight: 280,
  },

  glowTL: {
    pointerEvents: "none",
    position: "absolute",
    top: -64,
    left: -64,
    width: 224,
    height: 224,
    borderRadius: 9999,
    background: "rgba(124,58,237,0.10)",
    filter: "blur(48px)",
  },

  glowBR: {
    pointerEvents: "none",
    position: "absolute",
    right: -80,
    bottom: -80,
    width: 288,
    height: 288,
    borderRadius: 9999,
    background: "rgba(217,70,239,0.08)",
    filter: "blur(56px)",
  },

  detailWrap: {
    position: "relative",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxSizing: "border-box",
  },

  // ✅ Inner “content” panel (soft black inside big glass panel)
  subPanel: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.30)",
    padding: 10,
    boxSizing: "border-box",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
    color: "rgba(255,255,255,0.80)",
  },

  loadingText: {
    padding: "24px 0",
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
  },

  replyError: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "rgba(252,165,165,0.95)", // red-300-ish
  },
};

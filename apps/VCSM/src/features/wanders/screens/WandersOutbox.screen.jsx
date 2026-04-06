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

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  const s = value.trim();
  if (!s) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export default function WandersOutboxScreen() {
  // ✅ ensure auth user exists (guest user) so auth.uid() works in RLS
  const { ensureUser } = useWandersGuest({ auto: true });

  // Fixed filter:
  const [folder] = useState("outbox");
  const [ownerRole] = useState("sender");

  // Keep search + selection UX
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [isWide, setIsWide] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 980;
  });

  // ✅ CORE mailbox
  const mailbox = useWandersMailbox({ auto: false, folder, ownerRole, limit: 50 });
  const { items, loading, error, refresh, markRead } = mailbox || {};

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

  // ✅ Build a normalized card object for detail/preview rendering (photo template support)
  const selectedCardForDetail = useMemo(() => {
    if (!selectedItem) return null;

    const rawCard = selectedItem?.card ?? selectedItem;

    const customizationRaw =
      rawCard?.customization ??
      rawCard?.customization_json ??
      rawCard?.customizationJson ??
      null;

    const customization = safeParseJson(customizationRaw) ?? customizationRaw ?? {};

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

      return {
        ...rawCard,
        templateKey,
        template_key: templateKey,
        customization,
        imageUrl,
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

  // ✅ Outbox "Sent" theme (same as WandersSent screen)
  const splitStyle = useMemo(
    () => ({
      ...styles.split,
      gridTemplateColumns: isWide ? "0.95fr 1.35fr" : "1fr",
    }),
    [isWide]
  );

  if (loading) return <WandersLoading />;

  if (error) {
    return <WandersEmptyState title="Outbox unavailable" subtitle={String(error?.message || error)} />;
  }

  return (
    <div className="relative h-screen w-full overflow-y-auto touch-pan-y bg-black text-white">
      {/* page glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]"
      />

      {/* keep your toolbar sticky behavior */}
      <div style={styles.toolbar} className="relative z-10">
        <WandersMailboxToolbar {...toolbarModel} />
      </div>

      <div style={splitStyle} className="relative z-10">
        {/* LEFT */}
        <div
          className={[
            "relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 text-white backdrop-blur-xl",
            "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(124,58,237,0.10)]",
          ].join(" ")}
          style={styles.left}
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
        </div>

        {/* RIGHT */}
        <div
          className={[
            "relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 text-white backdrop-blur-xl",
            "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(124,58,237,0.10)]",
          ].join(" ")}
          style={styles.right}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/08 blur-3xl"
          />

          <div style={styles.detailWrap} className="relative">
            {!selectedItem ? (
              <WandersEmptyState title="Select a message" subtitle="Choose an item to view it." />
            ) : (
              <>
                <div
                  className="rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur"
                  style={styles.cardDetail}
                >
                  <WandersCardDetail card={selectedCardForDetail} />

                  <div style={{ marginTop: 12 }}>
                    <div className="text-sm font-semibold text-white/90" style={styles.sectionTitle}>
                      Replies
                    </div>

                    {repliesLoading ? (
                      <div className="py-6 text-center text-sm text-white/60">Loading replies…</div>
                    ) : (
                      <WandersRepliesList
                        replies={normalizedReplyItems}
                        currentAnonId={selectedItem?.owner_anon_id || selectedItem?.ownerAnonId || null}
                        labelMode="fully-neutral"
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur" style={styles.composer}>
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
    // keep sizing + overflow behavior, but visual theme now comes from className
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 280,
  },
  right: {
    borderRadius: 14,
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
    padding: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
  },
  composer: {
    borderRadius: 12,
    padding: 10,
  },
};

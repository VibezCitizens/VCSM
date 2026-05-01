import React, { useEffect, useMemo, useState, useCallback } from "react";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import useWandersMailbox from "@/features/wanders/core/hooks/useWandersMailbox.hook";
import { useWandersReplies } from "@/features/wanders/core/hooks/useWandersReplies";

import WandersMailboxToolbar from "@/features/wanders/components/WandersMailboxToolbar";
import WandersEmptyState from "@/features/wanders/components/WandersEmptyState";
import WandersLoading from "@/features/wanders/components/WandersLoading";

import { WandersOutboxListPane } from "@/features/wanders/screens/components/WandersOutboxListPane";
import { WandersOutboxDetailPane } from "@/features/wanders/screens/components/WandersOutboxDetailPane";

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
  const { ensureUser } = useWandersGuest({ auto: true });

  const [folder] = useState("outbox");
  const [ownerRole] = useState("sender");

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [isWide, setIsWide] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 980;
  });

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
      try { await Promise.resolve(ensureUser?.()); } catch { /* ignore */ }
    })();
  }, [ensureUser]);

  useEffect(() => {
    (async () => {
      try { await Promise.resolve(refresh?.({ folder, ownerRole })); } catch { /* hook exposes error */ }
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
        card?.customization ?? card?.customization_json ?? card?.customizationJson ?? null;
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

  const selectedCardForDetail = useMemo(() => {
    if (!selectedItem) return null;
    const rawCard = selectedItem?.card ?? selectedItem;
    const customizationRaw =
      rawCard?.customization ?? rawCard?.customization_json ?? rawCard?.customizationJson ?? null;
    const customization = safeParseJson(customizationRaw) ?? customizationRaw ?? {};
    const templateKey = rawCard?.templateKey ?? rawCard?.template_key ?? "";
    if (String(templateKey).startsWith("photo.")) {
      const imageUrl =
        customization?.imageUrl ?? customization?.image_url ?? rawCard?.imageUrl ?? rawCard?.image_url ?? "";
      const title = customization?.title ?? "";
      const message =
        customization?.message ?? rawCard?.message ?? rawCard?.messageText ?? rawCard?.message_text ?? "";
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
    return { ...rawCard, templateKey, template_key: templateKey, customization };
  }, [selectedItem]);

  const replies = useWandersReplies({ cardId: selectedCardId, auto: true, limit: 200 });
  const replyItems = replies?.replies;
  const repliesLoading = replies?.loading;

  const normalizedReplyItems = useMemo(() => {
    if (Array.isArray(replyItems)) return replyItems;
    if (Array.isArray(replyItems?.items)) return replyItems.items;
    if (Array.isArray(replyItems?.data)) return replyItems.data;
    return [];
  }, [replyItems]);

  useEffect(() => {
    if (selectedId) return;
    if (!filteredItems.length) return;
    setSelectedId(String(filteredItems[0].id));
  }, [filteredItems, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const stillExists = filteredItems.some((it) => String(it.id) === String(selectedId));
    if (stillExists) return;
    if (!filteredItems.length) { setSelectedId(null); return; }
    setSelectedId(String(filteredItems[0].id));
  }, [filteredItems, selectedId]);

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
      try { await Promise.resolve(markRead?.(selectedItem.id, true)); } catch { /* ignore */ }
    })();
  }, [selectedItem, markRead]);

  const onSelectItem = useCallback((item) => {
    setSelectedId(String(item?.id));
  }, []);

  const toolbarModel = useMemo(
    () => ({
      currentFolder: folder,
      searchQuery: search,
      onFolderChange: undefined,
      onSearchChange: setSearch,
      disabled: !!loading,
      isFolderLocked: true,
    }),
    [folder, search, loading]
  );

  const splitStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: isWide ? "0.95fr 1.35fr" : "1fr",
      gap: 12,
      alignItems: "start",
    }),
    [isWide]
  );

  if (loading) return <WandersLoading />;
  if (error) {
    return <WandersEmptyState title="Outbox unavailable" subtitle={String(error?.message || error)} />;
  }

  return (
    <div className="relative h-screen w-full overflow-y-auto touch-pan-y bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]"
      />

      <div
        style={{ position: "sticky", top: 0, zIndex: 5, paddingBottom: 10, background: "transparent" }}
        className="relative z-10"
      >
        <WandersMailboxToolbar {...toolbarModel} />
      </div>

      <div style={splitStyle} className="relative z-10">
        <WandersOutboxListPane
          filteredItems={filteredItems}
          selectedId={selectedId}
          onSelectItem={onSelectItem}
          search={search}
        />

        <WandersOutboxDetailPane
          selectedItem={selectedItem}
          selectedCardForDetail={selectedCardForDetail}
          selectedCardId={selectedCardId}
          repliesLoading={repliesLoading}
          normalizedReplyItems={normalizedReplyItems}
        />
      </div>
    </div>
  );
}

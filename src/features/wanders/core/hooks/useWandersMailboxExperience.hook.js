// src/features/wanders/core/hooks/useWandersMailboxExperience.hook.js
// ============================================================================
// WANDERS HOOK — MAILBOX EXPERIENCE
// Owns timing/state: folder, selection, replies refresh, guest modal timing.
// Does NOT import supabase. Calls controllers (allowed).
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import useWandersMailbox from "@/features/wanders/core/hooks/useWandersMailbox.hook";
import useWandersReplies from "@/features/wanders/core/hooks/useWandersReplies.hook";
import useIsWide from "@/features/wanders/core/hooks/useIsWide.hook";

import { createReplyAsAnon } from "@/features/wanders/core/controllers/replies.controller";
import { getWandersAuthStatus } from "@/features/wanders/core/controllers/authSession.controller";

import { GUEST_MAILBOX_MODAL_FLAG_KEY } from "@/features/wanders/core/hooks/mailboxExperience/mailboxExperience.constants";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/features/wanders/core/hooks/mailboxExperience/mailboxExperience.storage";
import {
  resolveInitialFolder,
  normalizeList,
  filterMailboxItems,
  buildSelectedCardForDetail,
} from "@/features/wanders/core/hooks/mailboxExperience/mailboxExperience.helpers";
import { reconcileSelection } from "@/features/wanders/core/hooks/mailboxExperience/mailboxExperience.selection";

/**
 * @param {{ mode?: string|null }} params
 */
export default function useWandersMailboxExperience({ mode }) {
  const { ensureUser } = useWandersGuest({ auto: true });

  const [folder, setFolder] = useState(() => resolveInitialFolder(mode));
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const isWide = useIsWide({ breakpoint: 980 });

  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState(null);

  // guest state
  const [isGuest, setIsGuest] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestModalDontShow, setGuestModalDontShow] = useState(false);

  // ---- Ensure guest user (browser identity)
  useEffect(() => {
    (async () => {
      try {
        await Promise.resolve(ensureUser?.());
      } catch {
        // ignore
      }
    })();
  }, [ensureUser]);

  // ---- Mode changes
  useEffect(() => {
    const next = resolveInitialFolder(mode);
    setFolder(next);
    setSelectedId(null);
    setReplyError(null);
  }, [mode]);

  // ---- Mailbox hook
  const mailboxHook = useWandersMailbox({ auto: false, folder, ownerRole: null, limit: 50 });
  const { items, loading, error, refresh, markRead } = mailboxHook || {};

  useEffect(() => {
    (async () => {
      try {
        await Promise.resolve(refresh?.({ folder }));
      } catch {
        // ignore
      }
    })();
  }, [folder, refresh]);

  const normalizedItems = useMemo(() => normalizeList(items), [items]);
  const filteredItems = useMemo(
    () => filterMailboxItems(normalizedItems, search),
    [normalizedItems, search]
  );

  // ---- Selection reconciliation
  useEffect(() => {
    setSelectedId((prev) => reconcileSelection(prev, filteredItems));
  }, [filteredItems]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return filteredItems.find((it) => String(it.id) === String(selectedId)) || null;
  }, [filteredItems, selectedId]);

  const selectedCardId = useMemo(() => {
    if (!selectedItem) return null;
    return selectedItem.card_id || selectedItem.cardId || selectedItem.card?.id || null;
  }, [selectedItem]);

  const selectedCardForDetail = useMemo(
    () => buildSelectedCardForDetail(selectedItem),
    [selectedItem]
  );

  // ---- Replies hook
  const repliesHook = useWandersReplies({ cardId: selectedCardId, auto: false, limit: 200 });
  const repliesLoading = repliesHook?.loading;
  const replyItems = useMemo(() => normalizeList(repliesHook?.replies), [repliesHook?.replies]);

  useEffect(() => {
    if (!selectedCardId) return;
    (async () => {
      try {
        await Promise.resolve(repliesHook?.refresh?.());
      } catch {
        // ignore
      }
    })();
  }, [selectedCardId, repliesHook?.refresh]);

  // ---- Mark read on select (inbox only)
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

  // ---- UI actions
  const onItemClick = useCallback((item) => {
    setSelectedId(String(item?.id));
    setReplyError(null);
  }, []);

  const onFolderChange = useCallback((next) => {
    setFolder(next);
    setSelectedId(null);
    setReplyError(null);
  }, []);

  const onSearchChange = useCallback((q) => setSearch(q), []);

  const toolbarProps = useMemo(
    () => ({
      currentFolder: folder,
      searchQuery: search,
      onFolderChange,
      onSearchChange,
      disabled: !!loading,
    }),
    [folder, search, onFolderChange, onSearchChange, loading]
  );

  const handleReplySent = useCallback(async () => {
    try {
      await Promise.resolve(repliesHook?.refresh?.());
    } catch {
      // ignore
    }
  }, [repliesHook?.refresh]);

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

  // ---- Guest detection + modal once per browser
  useEffect(() => {
    (async () => {
      try {
        const auth = await getWandersAuthStatus();
        const authed = !!auth?.isAuthed;

        setIsGuest(!authed);

        const flag = safeLocalStorageGet(GUEST_MAILBOX_MODAL_FLAG_KEY);
        if (flag === "1") return;

        if (!authed) setShowGuestModal(true);
      } catch {
        // ignore
      }
    })();
  }, []);

  const dismissGuestModal = useCallback(() => {
    if (guestModalDontShow) {
      safeLocalStorageSet(GUEST_MAILBOX_MODAL_FLAG_KEY, "1");
    }
    setShowGuestModal(false);
  }, [guestModalDontShow]);

  const dontShowAgain = useCallback(() => {
    setGuestModalDontShow(true);
    safeLocalStorageSet(GUEST_MAILBOX_MODAL_FLAG_KEY, "1");
    setShowGuestModal(false);
  }, []);

  const splitStyle = useMemo(
    () => ({
      gridTemplateColumns: isWide ? "0.95fr 1.35fr" : "1fr",
      isWide,
    }),
    [isWide]
  );

  return {
    mailbox: {
      items: filteredItems,
      loading,
      error,
      selectedId,
      selectedItem,
      selectedCardId,
      selectedCardForDetail,
    },
    replies: {
      items: replyItems,
      loading: repliesLoading,
      replySending,
      replyError,
    },
    ui: {
      folder,
      search,
      isWide,
      splitStyle,
      toolbarProps,

      // ✅ REQUIRED by your View
      isGuest,

      showGuestModal,
      guestModalDontShow,
    },
    actions: {
      onItemClick,
      setSelectedId,
      setGuestModalDontShow,
      dismissGuestModal,
      dontShowAgain,
      handleReplySubmit,
      handleReplySent,
    },
  };
}

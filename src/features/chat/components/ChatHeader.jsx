// src/features/chat/components/ChatHeader.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import UserLink from '@/components/UserLink';
import { supabase } from '@/lib/supabaseClient';

/** partner is usable if it has any visible identity */
function isUsablePartner(p) {
  if (!p || typeof p !== 'object') return false;
  const hasLabel = !!(p.display_name && String(p.display_name).trim());
  const hasUsername = !!(p.username && String(p.username).trim());
  const hasSlug = !!(p.slug && String(p.slug).trim());
  const hasPhoto = !!(p.photo_url || p.avatar_url);
  return hasLabel || hasUsername || hasSlug || hasPhoto;
}

/** Build a partner object from cached inbox fields; vport match via slug. */
async function buildPartnerFromCache(conversationId, meActorId) {
  if (!conversationId || !meActorId) return null;

  const { data: rows, error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .select('partner_display_name, partner_username, partner_photo_url')
    .eq('conversation_id', conversationId)
    .eq('actor_id', meActorId)
    .limit(1);

  if (error) throw error;
  const row = rows?.[0];
  if (!row) return null;

  const display_name = row.partner_display_name || null;
  const username = row.partner_username || null; // may be vport slug or profile username
  const photo_url = row.partner_photo_url || null;

  if (!display_name && !username && !photo_url) return null;

  // Try vport by slug (fast exit if it doesn't look like a slug)
  if (username && username.includes('-')) {
    const { data: v, error: vErr } = await supabase
      .schema('vc')
      .from('vports')
      .select('id, slug, name, avatar_url')
      .eq('slug', username)
      .maybeSingle();

    if (!vErr && v?.id) {
      return {
        kind: 'vport',
        id: v.id,
        name: v.name ?? display_name ?? username,
        slug: v.slug ?? username,
        avatar_url: v.avatar_url ?? photo_url ?? undefined,
        // normalized aliases
        display_name: v.name ?? display_name ?? username,
        username: v.slug ?? username,
        photo_url: v.avatar_url ?? photo_url ?? undefined,
      };
    }
  }

  // Fallback: user
  return {
    kind: 'user',
    id: undefined,
    display_name: display_name ?? username ?? 'User',
    username: username ?? undefined,
    photo_url: photo_url ?? undefined,
  };
}

/** Normalize user/vport for UserLink */
function normalizeForUserLink(partner) {
  if (!partner) return null;
  const isVport = partner.kind === 'vport';

  const display_name =
    partner.display_name ??
    (isVport ? partner.name : partner.display_name) ??
    undefined;

  const username =
    partner.username ??
    (isVport ? partner.slug : partner.username) ??
    undefined;

  const photo_url =
    partner.photo_url ??
    (isVport ? partner.avatar_url : partner.photo_url) ??
    undefined;

  const slug = isVport ? (partner.slug ?? undefined) : undefined;
  const avatar_url = isVport ? (partner.avatar_url ?? undefined) : undefined;

  return {
    id: partner.id,
    kind: partner.kind,
    display_name,
    username,
    photo_url,
    slug,
    avatar_url,
  };
}

export default function ChatHeader({
  partner,           // optional: if provided and usable, we render it
  conversationId,    // optional: used to resolve name/avatar when partner not usable
  authorType,        // 'user' | 'vport' (optional override)
  myActorId,         // ✅ NEW: pass the active actor id to avoid globals
  onBack,
  onMenu,
  fallbackTitle = 'Conversation',
  resolvePartner,    // optional: async (conversationId) => partner; guarded if not provided
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const [derivedPartner, setDerivedPartner] = useState(
    isUsablePartner(partner) ? partner : null
  );

  // Load from cache/DB only if:
  // - partner prop is missing or empty, AND we have a conversationId.
  useEffect(() => {
    let alive = true;

    async function load() {
      // If partner prop is usable, just use it.
      if (isUsablePartner(partner)) {
        if (alive) setDerivedPartner(partner);
        return;
      }
      // Else if we have a conversationId, resolve via cache then live
      if (!conversationId) {
        if (alive) setDerivedPartner(null);
        return;
      }

      try {
        const cached = await buildPartnerFromCache(conversationId, myActorId);
        if (alive && cached) {
          setDerivedPartner(cached);
          return;
        }
      } catch {
        // ignore; we'll try live resolver below
      }

      try {
        if (typeof resolvePartner === 'function') {
          const live = await resolvePartner(conversationId);
          if (alive) setDerivedPartner(live ?? null);
        } else {
          if (alive) setDerivedPartner(null);
        }
      } catch {
        if (alive) setDerivedPartner(null);
      }
    }

    load();

    // Subscribe to keep cache fresh if we're using conversationId path
    let ch;
    (async () => {
      if (!conversationId || isUsablePartner(partner) || !myActorId) return;

      ch = supabase
        .channel(`vc-inbox-one-${conversationId}-${myActorId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'vc',
            table: 'inbox_entries',
            filter: `conversation_id=eq.${conversationId},actor_id=eq.${myActorId}`,
          },
          async () => {
            if (!alive) return;
            try {
              const cached = await buildPartnerFromCache(conversationId, myActorId);
              if (cached) {
                setDerivedPartner(cached);
              } else if (typeof resolvePartner === 'function') {
                const live = await resolvePartner(conversationId);
                setDerivedPartner(live ?? null);
              }
            } catch {
              // ignore transient errors
            }
          }
        )
        .subscribe();
    })();

    return () => {
      alive = false;
      if (ch) supabase.removeChannel(ch);
    };
  }, [partner, conversationId, myActorId, resolvePartner]);

  const normalized = useMemo(
    () => normalizeForUserLink(derivedPartner),
    [derivedPartner]
  );

  const effectiveAuthorType = useMemo(() => {
    if (authorType === 'user' || authorType === 'vport') return authorType;
    return derivedPartner?.kind === 'vport' ? 'vport' : 'user';
  }, [authorType, derivedPartner?.kind]);

  // Close menu on outside click / ESC
  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      const hitMenu = menuRef.current?.contains(e.target);
      const hitBtn = btnRef.current?.contains(e.target);
      if (!hitMenu && !hitBtn) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handleReport = () => {
    setOpen(false);
    if (typeof onMenu === 'function') onMenu('report');
    try {
      window.dispatchEvent(
        new CustomEvent('vc-chat-menu', { detail: { action: 'report', ts: Date.now() } })
      );
    } catch {}
  };

  return (
    <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-white/10">
      <div
        className="h-14 px-3 flex items-center gap-3 text-white relative"
        data-testid="vc-chat-header"
      >
        {/* Back */}
        <button
          type="button"
          onClick={() => onBack?.()}
          className="p-2 -ml-1 rounded-xl hover:bg-white/10 text-white"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Avatar + name */}
        {normalized ? (
          <UserLink
            user={normalized}
            authorType={effectiveAuthorType}
            className="min-w-0 flex-1"
            avatarSize="w-10 h-10"
            avatarShape="rounded-md"
            textSize="text-base"
            withUsername
          />
        ) : (
          <div className="min-w-0 flex-1 text-base font-semibold truncate">
            {fallbackTitle}
          </div>
        )}

        {/* Menu trigger */}
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="p-2 rounded-xl hover:bg-white/10 text-white"
          aria-label="More"
          aria-haspopup="menu"
          aria-expanded={open ? 'true' : 'false'}
        >
          <MoreVertical size={22} />
        </button>

        {/* Dropdown menu */}
        {open && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Conversation menu"
            className="absolute right-2 top-14 w-52 rounded-xl border border-white/10 bg-black/95 backdrop-blur shadow-lg overflow-hidden"
          >
            <button
              role="menuitem"
              onClick={handleReport}
              className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/10"
            >
              Report conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
ChatHeader.displayName = 'ChatHeader';

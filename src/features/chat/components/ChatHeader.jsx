// src/features/chat/components/ChatHeader.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

/**
 * ChatHeader
 *
 * Props:
 * - conversationId: string         -> conversation to render header for
 * - title?: string                 -> optional override title
 * - subtitle?: string              -> optional override subtitle
 * - showBack?: boolean             -> default true
 * - backTo?: string | null         -> navigate to a specific path
 * - onBack?: () => void            -> custom back handler
 * - className?: string
 */
export default function ChatHeader({
  conversationId,
  title,
  subtitle,
  showBack = true,
  backTo = null,
  onBack,
  className = '',
}) {
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [data, setData] = React.useState(null); // { muted, archived_at, cleared_before, partner_user_id, partner?:{...} }
  const [meId, setMeId] = React.useState(null);

  const handleBack = () => {
    if (onBack) return onBack();
    if (backTo) return nav(backTo);
    nav(-1);
  };

  const load = React.useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setErr(null);
    try {
      // current user id from auth
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const me = auth?.user?.id;
      if (!me) throw new Error('Not authenticated');
      setMeId(me);

      // 1) fetch my membership row (NO shorthand join; get partner_user_id)
      const memRes = await supabase
        .from('conversation_members')
        .select('muted, archived_at, cleared_before, partner_user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', me)
        .maybeSingle();

      if (memRes.error) throw memRes.error;
      if (!memRes.data) throw new Error('Conversation not found or no access');

      const base = memRes.data;

      // 2) fetch partner profile (if any)
      let partner = null;
      if (base.partner_user_id) {
        const pRes = await supabase
          .from('profiles')
          .select('id, display_name, username, photo_url, email')
          .eq('id', base.partner_user_id)
          .maybeSingle();
        if (pRes.error) throw pRes.error;
        partner = pRes.data ?? null;
      }

      setData({ ...base, partner });
    } catch (e) {
      console.error('[ChatHeader] load error:', e);
      setErr(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleMute = async () => {
    if (!data || !meId) return;
    const next = !data.muted;
    setData((d) => ({ ...d, muted: next }));
    const { error } = await supabase
      .from('conversation_members')
      .update({ muted: next })
      .eq('conversation_id', conversationId)
      .eq('user_id', meId);
    if (error) {
      console.error(error);
      setData((d) => ({ ...d, muted: !next })); // revert
    }
  };

  const toggleArchive = async () => {
    if (!data || !meId) return;
    const nextArchiving = !data.archived_at;
    const prev = data.archived_at;
    const patch = nextArchiving ? { archived_at: new Date().toISOString() } : { archived_at: null };

    setData((d) => ({ ...d, archived_at: patch.archived_at ?? null }));

    const { error } = await supabase
      .from('conversation_members')
      .update(patch)
      .eq('conversation_id', conversationId)
      .eq('user_id', meId);

    if (error) {
      console.error(error);
      setData((d) => ({ ...d, archived_at: prev })); // revert
    }
  };

  const clearHistory = async () => {
    if (!meId) return;
    const iso = new Date().toISOString();
    const { error } = await supabase
      .from('conversation_members')
      .update({ cleared_before: iso })
      .eq('conversation_id', conversationId)
      .eq('user_id', meId);
    if (error) {
      console.error(error);
    }
  };

  const avatarSrc = data?.partner?.photo_url || '/img/avatar-fallback.png';

  // Compute title & subtitle with de-duplication
  const p = data?.partner;
  const primary =
    title ||
    (loading ? 'Loading…' : p?.display_name || p?.username || p?.email || 'Chat');

  // prefer @username as subtitle; only show if actually different from primary
  let secondary = '';
  if (!subtitle && !loading && p) {
    const handle = p.username ? `@${p.username}` : (p.email || '');
    if (handle && handle !== primary) secondary = handle;
  } else if (subtitle) {
    secondary = subtitle;
  }

  return (
    <div
      className={[
        'sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-neutral-800',
        className,
      ].join(' ')}
    >
      <div className="h-12 flex items-center px-3 gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-neutral-900 active:scale-95 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        )}

        <img
          src={avatarSrc}
          alt={primary}
          className="w-7 h-7 rounded-full object-cover border border-neutral-800"
          draggable={false}
        />

        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold truncate flex items-center gap-1">
            <span className="truncate">{primary}</span>
            {data?.muted && (
              <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-neutral-800 text-white/70 shrink-0">
                Muted
              </span>
            )}
            {data?.archived_at && (
              <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-neutral-800 text-white/70 shrink-0">
                Archived
              </span>
            )}
          </div>

          {secondary ? (
            <div className="text-[12px] text-white/60 truncate">{secondary}</div>
          ) : null}

          {err && (
            <div className="text-[12px] text-red-400 truncate">
              {String(err?.message || err)}
            </div>
          )}
        </div>

        <HeaderMenu
          partner={p}
          muted={!!data?.muted}
          archived={!!data?.archived_at}
          onToggleMute={toggleMute}
          onToggleArchive={toggleArchive}
          onClearHistory={clearHistory}
        />
      </div>
    </div>
  );
}

function HeaderMenu({ partner, muted, archived, onToggleMute, onToggleArchive, onClearHistory }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full hover:bg-neutral-900 active:scale-95 transition"
        aria-label="More"
        title="More"
      >
        <MoreHorizontal className="w-5 h-5 text-white/80" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg overflow-hidden"
          onMouseLeave={() => setOpen(false)}
        >
          <MenuItem onClick={() => { setOpen(false); onToggleMute?.(); }}>
            {muted ? 'Unmute' : 'Mute'}
          </MenuItem>
          <MenuItem onClick={() => { setOpen(false); onToggleArchive?.(); }}>
            {archived ? 'Unarchive' : 'Archive'}
          </MenuItem>
          <MenuItem onClick={() => { onClearHistory?.(); setOpen(false); }}>
            Clear history (for me)
          </MenuItem>
          <div className="h-px bg-neutral-800" />
          <MenuLink
            to={
              partner?.username
                ? `/u/${partner.username}`
                : partner?.id
                ? `/user/${partner.id}`
                : '#'
            }
            onClick={() => setOpen(false)}
          >
            View profile
          </MenuLink>
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-neutral-900"
    >
      {children}
    </button>
  );
}

function MenuLink({ children, to, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 text-sm text-white/90 hover:bg-neutral-900"
    >
      {children}
    </Link>
  );
}

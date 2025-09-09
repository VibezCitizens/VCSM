// src/features/chat/components/ChatHeader.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { createPortal } from 'react-dom';

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
  // { muted, archived_at, cleared_before, partner_user_id, partner?:{...} }
  const [data, setData] = React.useState(null);
  const [meId, setMeId] = React.useState(null);

  // report modal state
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportText, setReportText] = React.useState('');
  const [reporting, setReporting] = React.useState(false);
  const [reportErr, setReportErr] = React.useState(null);

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

      // 1) fetch my membership row (get partner_user_id explicitly)
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

  const submitReport = async () => {
    if (!meId || reporting) return;
    setReporting(true);
    setReportErr(null);
    try {
      // Basic abuse_reports insert; adjust table/columns to your schema
      const { error } = await supabase.from('abuse_reports').insert({
        reporter_id: meId,
        conversation_id: conversationId,
        partner_user_id: data?.partner_user_id ?? null,
        reason: reportText?.trim() || null,
      });
      if (error) throw error;

      setReportOpen(false);
      setReportText('');
    } catch (e) {
      console.error('[ChatHeader] report error:', e);
      setReportErr(e?.message || 'Failed to submit report.');
    } finally {
      setReporting(false);
    }
  };

  // lock body scroll while modal is open
  React.useEffect(() => {
    if (!reportOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [reportOpen]);

  const avatarSrc = data?.partner?.photo_url || '/img/avatar-fallback.png';

  // Compute title & subtitle with de-duplication
  const p = data?.partner;
  const primary =
    title ||
    (loading ? 'Loading…' : p?.display_name || p?.username || p?.email || 'Chat');

  let secondary = '';
  if (!subtitle && !loading && p) {
    const handle = p.username ? `@${p.username}` : (p.email || '');
    if (handle && handle !== primary) secondary = handle;
  } else if (subtitle) {
    secondary = subtitle;
  }

  return (
    <>
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
            onOpenReport={() => { setReportErr(null); setReportOpen(true); }}
          />
        </div>
      </div>

      {/* Centered Report Modal via portal */}
      {reportOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/60 grid place-items-center p-4"
          onClick={() => setReportOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 text-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Report chat</h3>
            <p className="text-sm text-white/70 mb-3">
              Tell us what’s wrong. A brief reason helps us review faster.
            </p>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={4}
className="w-full rounded bg-white border border-neutral-300 text-neutral-900 placeholder:text-neutral-500 px-3 py-2 focus:outline-none focus:border-neutral-500"              placeholder="Reason (optional)"
            />
            {reportErr && <div className="text-sm text-red-400 mt-2">{reportErr}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setReportOpen(false)}
                className="px-3 py-2 rounded border border-neutral-700 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={reporting}
                className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
              >
                {reporting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function HeaderMenu({
  partner,
  muted,
  archived,
  onToggleMute,
  onToggleArchive,
  onClearHistory,
  onOpenReport,
}) {
  const [open, setOpen] = React.useState(false);

  // close menu on route changes or escape
  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
          <MenuItem onClick={() => { setOpen(false); onOpenReport?.(); }}>
            Report chat…
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

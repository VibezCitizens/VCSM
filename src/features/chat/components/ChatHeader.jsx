import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { createPortal } from 'react-dom';

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
  // { muted, archived_at, cleared_before, partner_user_id, partner }
  const [data, setData] = React.useState(null);
  const [meId, setMeId] = React.useState(null);

  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportText, setReportText] = React.useState('');
  const [reporting, setReporting] = React.useState(false);
  const [reportErr, setReportErr] = React.useState(null);

  const handleBack = () => {
    if (onBack) return onBack();
    if (backTo) return nav(backTo);
    nav(-1);
  };

  // ---- helpers ----
  const parsePairKey = (pairKey) => {
    if (typeof pairKey !== 'string') return [null, null];
    const parts = pairKey.split('::');
    if (parts[0] === 'vpc:' || parts[0]?.startsWith('vpc:')) {
      return parts.length >= 4 ? [parts[2], parts[3]] : [null, null];
    }
    return parts.length >= 2 ? [parts[0], parts[1]] : [null, null];
  };

  // Existing: create my membership if missing and set partner_user_id
  const tryRepairMembership = React.useCallback(
    async (me) => {
      const convRes = await supabase
        .schema('vc')
        .from('conversations')
        .select('pair_key')
        .eq('id', conversationId)
        .maybeSingle();
      if (convRes.error) throw convRes.error;

      const [u1, u2] = parsePairKey(convRes.data?.pair_key);
      if (!u1 || !u2) return false;

      const partnerId = me === u1 ? u2 : me === u2 ? u1 : null;
      if (!partnerId) return false;

      const upRes = await supabase
        .schema('vc')
        .from('conversation_members')
        .upsert(
          { conversation_id: conversationId, user_id: me, partner_user_id: partnerId },
          { onConflict: 'conversation_id,user_id' }
        )
        .select('conversation_id, user_id')
        .maybeSingle();
      if (upRes.error) throw upRes.error;
      return !!upRes.data;
    },
    [conversationId]
  );

  // NEW: if my membership exists but partner_user_id is null, fill it from pair_key
  const fillPartnerIfMissing = React.useCallback(
    async (me) => {
      const convRes = await supabase
        .schema('vc')
        .from('conversations')
        .select('pair_key')
        .eq('id', conversationId)
        .maybeSingle();
      if (convRes.error) throw convRes.error;

      const [u1, u2] = parsePairKey(convRes.data?.pair_key);
      if (!u1 || !u2) return null;

      const partnerId = me === u1 ? u2 : me === u2 ? u1 : null;
      if (!partnerId) return null;

      const upRes = await supabase
        .schema('vc')
        .from('conversation_members')
        .update({ partner_user_id: partnerId })
        .eq('conversation_id', conversationId)
        .eq('user_id', me)
        .select('muted, archived_at, cleared_before, partner_user_id')
        .maybeSingle();
      if (upRes.error) throw upRes.error;
      return upRes.data ?? null;
    },
    [conversationId]
  );

  const load = React.useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setErr(null);
    try {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const me = auth?.user?.id;
      if (!me) throw new Error('Not authenticated');
      setMeId(me);

      // 1) read my membership
      let memRes = await supabase
        .schema('vc')
        .from('conversation_members')
        .select('muted, archived_at, cleared_before, partner_user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', me)
        .maybeSingle();
      if (memRes.error) throw memRes.error;

      // 2) if no row, repair (create my membership + partner id)
      if (!memRes.data) {
        const repaired = await tryRepairMembership(me);
        if (repaired) {
          memRes = await supabase
            .schema('vc')
            .from('conversation_members')
            .select('muted, archived_at, cleared_before, partner_user_id')
            .eq('conversation_id', conversationId)
            .eq('user_id', me)
            .maybeSingle();
          if (memRes.error) throw memRes.error;
        }
      }

      // 3) if row exists but partner_user_id is null, fill it now
      if (memRes.data && !memRes.data.partner_user_id) {
        const filled = await fillPartnerIfMissing(me);
        if (filled) memRes = { data: filled, error: null };
      }

      if (!memRes.data) throw new Error('Conversation not found or no access');

      // 4) fetch partner profile
      let partner = null;
      if (memRes.data.partner_user_id) {
        const pRes = await supabase
          .from('profiles')
          .select('id, display_name, username, email, photo_url')
          .eq('id', memRes.data.partner_user_id)
          .maybeSingle();
        if (pRes.error) throw pRes.error;
        partner = pRes.data ?? null;
      }

      setData({ ...memRes.data, partner });
    } catch (e) {
      setErr(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId, tryRepairMembership, fillPartnerIfMissing]);

  React.useEffect(() => { load(); }, [load]);

  // ---- actions ----
  const toggleMute = async () => {
    if (!data || !meId) return;
    const next = !data.muted;
    setData((d) => ({ ...d, muted: next }));
    const { error } = await supabase
      .schema('vc')
      .from('conversation_members')
      .update({ muted: next })
      .eq('conversation_id', conversationId)
      .eq('user_id', meId);
    if (error) setData((d) => ({ ...d, muted: !next }));
  };

  const toggleArchive = async () => {
    if (!data || !meId) return;
    const prev = data.archived_at;
    const patch = prev ? { archived_at: null } : { archived_at: new Date().toISOString() };
    setData((d) => ({ ...d, archived_at: patch.archived_at ?? null }));
    const { error } = await supabase
      .schema('vc')
      .from('conversation_members')
      .update(patch)
      .eq('conversation_id', conversationId)
      .eq('user_id', meId);
    if (error) setData((d) => ({ ...d, archived_at: prev }));
  };

  const clearHistory = async () => {
    if (!meId) return;
    const iso = new Date().toISOString();
    const { error } = await supabase
      .schema('vc')
      .from('conversation_members')
      .update({ cleared_before: iso })
      .eq('conversation_id', conversationId)
      .eq('user_id', meId);
    if (!error) setData((d) => (d ? { ...d, cleared_before: iso } : d));
  };

  const submitReport = async () => {
    if (!meId || reporting) return;
    setReporting(true);
    setReportErr(null);
    try {
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
      setReportErr(e?.message || 'Failed to submit report.');
    } finally {
      setReporting(false);
    }
  };

  // ---- UI bits ----
  React.useEffect(() => {
    if (!reportOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [reportOpen]);

  const p = data?.partner;
  const avatarSrc = p?.photo_url || '/img/avatar-fallback.png';

  // Trim display_name (e.g., "Karlota ")
  const primaryDisplayName = p?.display_name ? p.display_name.trim() : null;

  // Never show “Loading…”. Use 'Chat' until partner arrives.
  const primary = title ?? primaryDisplayName ?? p?.username ?? p?.email ?? 'Chat';

  let secondary = '';
  if (!subtitle && p) {
    const handle = p.username ? `@${p.username}` : (p.email || '');
    if (handle && handle !== primary) secondary = handle;
  } else if (subtitle) {
    secondary = subtitle;
  }

  return (
    <>
      <div className={['sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-neutral-800', className].join(' ')}>
        {/* row: left content (back+avatar+title) | right menu */}
        <div className="w-full h-12 flex items-center justify-between px-3 gap-3">
          {/* LEFT: back + avatar + titles */}
          <div className="flex items-center gap-3 min-w-0">
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

            {/* Title column */}
            <div className="min-w-0">
              {/* Name (left) + dots/badges (right) */}
              <div className="flex items-center">
                <span className="truncate font-semibold text-white flex-1">
                  {primary}
                </span>

                {/* right-side dots + badges */}
                <div className="ml-2 flex items-center gap-1 shrink-0">
                  {loading && !p && <span className="text-[11px] text-white/60">• • •</span>}
                  {data?.muted && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-800 text-white/70">
                      Muted
                    </span>
                  )}
                  {data?.archived_at && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-800 text-white/70">
                      Archived
                    </span>
                  )}
                </div>
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
          </div>

          {/* RIGHT: menu pinned to the far right */}
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
              className="w-full rounded bg-white border border-neutral-300 text-neutral-900 placeholder:text-neutral-500 px-3 py-2 focus:outline-none focus:border-neutral-500"
              placeholder="Reason (optional)"
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

/* ---------------- Right-side menu ---------------- */
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

  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative shrink-0">
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
            to={partner?.username ? `/u/${partner.username}` : partner?.id ? `/user/${partner.id}` : '#'}
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

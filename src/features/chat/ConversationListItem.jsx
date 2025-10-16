// src/features/chat/ConversationListItem.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Bell, BellOff, Trash2 } from 'lucide-react';

const DEFAULT_AVATAR = '/default.png';
const DEBUG = false;
const dlog = (...a) => DEBUG && console.log('[ConversationListItem]', ...a);

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString();
}

export default function ConversationListItem({
  conversationId,
  createdAt,            // last activity time (from list query)
  lastMessage,          // optional preview (from list query)
  partner: partnerProp, // parent-provided partner (user or vport)
  isActive = false,     // hide right unread badge when viewing this convo
  unreadCount = 0,      // right-side unread badge count
  onClick,
  onRemove,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadedOnceRef = useRef(false);
  const [loading, setLoading] = useState(!partnerProp);
  const [partner, setPartner] = useState(partnerProp ?? null); // { type:'user'|'vport', display_name, photo_url }
  const [isMuted, setIsMuted] = useState(false);

  // keep local partner synced with parent updates (prevents extra fetch + flicker)
  useEffect(() => {
    if (partnerProp) setPartner(partnerProp);
  }, [partnerProp]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        if (!user?.id || !conversationId) {
          if (alive) setLoading(false);
          return;
        }
        // show skeleton only on very first load if we don't already have partner
        if (!loadedOnceRef.current && !partnerProp) setLoading(true);

        // 1) My membership (and quick state)
        const { data: me, error: meErr } = await supabase
          .schema('vc')
          .from('conversation_members')
          .select('muted, partner_user_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .is('archived_at', null)
          .maybeSingle();

        if (!alive) return;

        if (meErr || !me) {
          dlog('membership not visible, removing row', { meErr, me });
          onRemove?.(conversationId);
          setLoading(false);
          return;
        }

        setIsMuted(!!me.muted);

        // 2) Detect mirrored VPORT messages only if parent didn't already tell us it's a VPORT
        let shadowMsg = null, shErr = null;
        if (!partnerProp || partnerProp?.type !== 'vport') {
          const probe = await supabase
            .schema('vc')
            .from('messages')
            .select('id, shadow_of_vpm')
            .eq('conversation_id', conversationId)
            .not('shadow_of_vpm', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          shadowMsg = probe.data;
          shErr = probe.error;
        }

        if (shErr) dlog('shadow probe error (non-fatal):', shErr);
        dlog('shadow message probe:', shadowMsg);

        // --- VPORT PATH ---
        if (shadowMsg?.shadow_of_vpm && (!partnerProp || partnerProp?.type !== 'vport')) {
          // find the VPORT from the mirrored vport_message
          const { data: vm, error: vmErr } = await supabase
            .schema('vc')
            .from('vport_messages')
            .select('id, conversation_id')
            .eq('id', shadowMsg.shadow_of_vpm)
            .maybeSingle();

          if (!alive) return;

          if (!vmErr && vm?.conversation_id) {
            const { data: vc, error: vcErr } = await supabase
              .schema('vc')
              .from('vport_conversations')
              .select('vport_id, vport:vports ( id, name, avatar_url )')
              .eq('id', vm.conversation_id)
              .maybeSingle();

            if (!alive) return;

            dlog('vport convo join:', { vm, vc, vcErr });

            const v = vc?.vport;
            if (v?.id) {
              if (alive && !partnerProp) {
                setPartner({
                  type: 'vport',
                  id: v.id,
                  display_name: v.name || 'VPORT',
                  photo_url: v.avatar_url || DEFAULT_AVATAR,
                });
                setLoading(false);
                loadedOnceRef.current = true;
              }
              return;
            }
          } else {
            dlog('vport_messages lookup failed or not allowed', vmErr);
          }
          // if any of that failed, fall through to user path
        }

        // --- USER PATH (fallback) ---
        let partnerId = me.partner_user_id || null;

        if (!partnerId) {
          // Prefer to discover partner from membership (no dependency on direct_conversation_pairs)
          const { data: others, error: othersErr } = await supabase
            .schema('vc')
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', user.id)
            .is('archived_at', null)
            .limit(1);

          if (othersErr) dlog('other member lookup error (non-fatal):', othersErr);
          partnerId = others?.[0]?.user_id ?? null;
        }

        if (!partnerId) {
          // Fallback to latest message not from me
          const { data: msg } = await supabase
            .schema('vc')
            .from('messages')
            .select('sender_id')
            .eq('conversation_id', conversationId)
            .neq('sender_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          partnerId = msg?.sender_id ?? null;
        }

        if (partnerId && !partnerProp) {
          // best-effort: save pointer for future reads
          supabase
            .schema('vc')
            .from('conversation_members')
            .update({ partner_user_id: partnerId })
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id)
            .then(() => {}, () => {});
        }

        // only fetch profile if parent didn't pass partner
        const { data: p } = partnerProp
          ? { data: null }
          : await supabase
              .from('profiles') // public schema
              .select('id, username, display_name, photo_url')
              .eq('id', partnerId)
              .maybeSingle();

        if (!alive) return;

        dlog('user partner profile:', p);

        if (!partnerProp) {
          setPartner({
            type: 'user',
            id: p?.id ?? partnerId,
            display_name: (p?.display_name || p?.username || 'User')?.trim(),
            photo_url: p?.photo_url || DEFAULT_AVATAR,
          });
        }

        setLoading(false);
        loadedOnceRef.current = true;
      } catch (err) {
        console.error('[ConversationListItem] load error', err);
        if (alive) {
          onRemove?.(conversationId);
          setLoading(false);
        }
      }
    };

    load();
    return () => { alive = false; };
  }, [conversationId, user?.id, onRemove, partnerProp]);

  const handleMute = async (e) => {
    e.stopPropagation();
    if (!user?.id) return;

    const next = !isMuted;
    setIsMuted(next); // optimistic
    const { error } = await supabase
      .schema('vc')
      .from('conversation_members')
      .update({ muted: next })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      setIsMuted(!next); // revert on failure
      console.error('[ConversationListItem] mute toggle error', error);
    }
  };

  const handleLeave = async (e) => {
    e.stopPropagation();
    if (!user?.id) return;
    if (!confirm('Hide this conversation for you?')) return;

    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .schema('vc')
      .from('conversation_members')
      .update({ archived_at: nowIso, cleared_before: nowIso })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[ConversationListItem] archive error', error);
      return;
    }

    onRemove?.(conversationId);
    navigate('/chat');
  };

  const subtitle = useMemo(() => lastMessage || '', [lastMessage]);

  if (loading) {
    return (
      <div className="flex items-center p-2 rounded bg-neutral-900/40 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-neutral-800" />
        <div className="ml-3 flex-1">
          <div className="h-4 w-40 bg-neutral-800 rounded mb-2" />
        </div>
        <div className="w-24 h-4 bg-neutral-800 rounded ml-3" />
      </div>
    );
  }

  const displayName = partner?.display_name || 'Unknown';
  const photo = partner?.photo_url || DEFAULT_AVATAR;

  return (
    <div
      onClick={onClick}
      className="relative flex items-center p-2 pr-9 hover:bg-neutral-800 rounded cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      {/* Avatar — no left dot overlay */}
      <img
        src={photo}
        alt={displayName}
        className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0"
        onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
      />

      <div className="flex-1 flex items-center ml-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate">
            {displayName}{' '}
            {partner?.type === 'vport' && (
              <span className="text-[10px] text-purple-300 align-middle">VPORT</span>
            )}
          </div>
          <div className="text-gray-400 text-xs truncate">{subtitle}</div>
        </div>

        <div className="ml-3 flex items-center gap-3 shrink-0">
          <div className="text-gray-500 text-[11px]">{timeAgo(createdAt)}</div>

          <button
            onClick={handleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted
              ? <BellOff className="w-5 h-5 text-gray-400 hover:text-white" />
              : <Bell className="w-5 h-5 text-gray-400 hover:text-white" />
            }
          </button>

          <button onClick={handleLeave} title="Hide conversation" aria-label="Hide conversation">
            <Trash2 className="w-5 h-5 text-red-500 hover:text-white" />
          </button>
        </div>
      </div>

      {/* RIGHT unread badge — shown only when NOT active; row padded with pr-9 to avoid overlap */}
      {(!isActive && Number(unreadCount) > 0) && (
        <span
          className="absolute top-1.5 right-3 min-w-[18px] h-[18px] px-1.5 rounded-full
                     bg-red-500 text-white text-[10px] leading-[18px] text-center font-medium shadow"
        >
          {Number(unreadCount) > 99 ? '99+' : String(unreadCount)}
        </span>
      )}
    </div>
  );
}

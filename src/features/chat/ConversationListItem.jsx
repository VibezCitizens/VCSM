import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Bell, BellOff, Trash2 } from 'lucide-react';

const DEFAULT_AVATAR = '/default.png';

// ----- flip to false when you're done -----
const DEBUG = true;
const dlog = (...a) => DEBUG && console.log('[ConversationListItem]', ...a);
// ------------------------------------------

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
  createdAt,      // last activity time (from list query)
  lastMessage,    // optional preview (from list query)
  onClick,
  onRemove,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);   // { type: 'user'|'vport', display_name, photo_url }
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        if (!user?.id || !conversationId) {
          if (alive) setLoading(false);
          return;
        }
        setLoading(true);

        // 1) My membership (and quick state)
        const { data: me, error: meErr } = await supabase
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

        // 2) Detect if this convo contains mirrored VPORT messages (shadow_of_vpm != null)
        const { data: shadowMsg, error: shErr } = await supabase
          .from('messages')
          .select('id, shadow_of_vpm')
          .eq('conversation_id', conversationId)
          .not('shadow_of_vpm', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!alive) return;

        if (shErr) dlog('shadow probe error (non-fatal):', shErr);
        dlog('shadow message probe:', shadowMsg);

        // --- VPORT PATH ---
        if (shadowMsg?.shadow_of_vpm) {
          // Get the VPORT behind this shadow message.
          // Step A: find the VPORT conversation for that vport_message id
          const { data: vm, error: vmErr } = await supabase
            .from('vport_messages')
            .select('id, conversation_id')
            .eq('id', shadowMsg.shadow_of_vpm)
            .maybeSingle();

          if (!alive) return;

          if (!vmErr && vm?.conversation_id) {
            // Step B: get the VPORT itself (name + avatar)
            const { data: vc, error: vcErr } = await supabase
              .from('vport_conversations')
              .select('vport_id, vport:vports ( id, name, avatar_url )')
              .eq('id', vm.conversation_id)
              .maybeSingle();

            if (!alive) return;

            dlog('vport convo join:', { vm, vc, vcErr });

            const v = vc?.vport;
            if (v?.id) {
              if (alive) {
                setPartner({
                  type: 'vport',
                  id: v.id,
                  display_name: v.name || 'VPORT',
                  photo_url: v.avatar_url || DEFAULT_AVATAR,
                });
                setLoading(false);
              }
              return;
            }
          } else {
            dlog('vport_messages lookup failed or not allowed', vmErr);
          }
          // If any of that failed (RLS, etc.), we’ll fall through to the user path.
        }

        // --- USER PATH (fallback) ---
        let partnerId = me.partner_user_id || null;

        if (!partnerId) {
          // latest message not from me
          const { data: msg } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('conversation_id', conversationId)
            .neq('sender_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          partnerId = msg?.sender_id ?? null;
        }

        if (!partnerId) {
          // try direct_conversation_pairs
          const { data: pair } = await supabase
            .from('direct_conversation_pairs')
            .select('user_a, user_b')
            .eq('conversation_id', conversationId)
            .maybeSingle();
          if (pair) {
            partnerId =
              pair.user_a === user.id
                ? pair.user_b
                : pair.user_b === user.id
                ? pair.user_a
                : null;
          }
        }

        if (partnerId) {
          // best-effort: save pointer for future reads
          supabase
            .from('conversation_members')
            .update({ partner_user_id: partnerId })
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id)
            .then(() => {}, () => {});
        }

        if (!partnerId) {
          if (alive) {
            setPartner({ type: 'user', display_name: 'Unknown', photo_url: DEFAULT_AVATAR });
            setLoading(false);
          }
          return;
        }

        const { data: p } = await supabase
          .from('profiles')
          .select('id, username, display_name, photo_url')
          .eq('id', partnerId)
          .maybeSingle();

        if (!alive) return;

        dlog('user partner profile:', p);

        setPartner({
          type: 'user',
          id: p?.id,
          display_name: p?.display_name || p?.username || 'User',
          photo_url: p?.photo_url || DEFAULT_AVATAR,
        });
        setLoading(false);
      } catch (err) {
        console.error('[ConversationListItem] load error', err);
        if (alive) {
          onRemove?.(conversationId);
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [conversationId, user?.id, onRemove]);

  const handleMute = async (e) => {
    e.stopPropagation();
    if (!user?.id) return;

    const next = !isMuted;
    setIsMuted(next); // optimistic
    const { error } = await supabase
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
      className="flex items-center p-2 hover:bg-neutral-800 rounded cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
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

          <button onClick={handleMute} title={isMuted ? 'Unmute' : 'Mute'} aria-label={isMuted ? 'Unmute' : 'Mute'}>
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
    </div>
  );
}

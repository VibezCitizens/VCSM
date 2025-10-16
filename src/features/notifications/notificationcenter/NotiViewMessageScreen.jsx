// src/features/noti/NotiViewMessageScreen.jsx
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

export default function NotiViewMessageScreen() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // no id → go to inbox
    if (!conversationId) {
      navigate('/chat', { replace: true });
      return;
    }

    // 1) clear PWA/app badge (best-effort)
    try {
      navigator.serviceWorker?.controller?.postMessage?.({ type: 'BADGE_CLEAR' });
    } catch {}

    // 2) optional: mark all messages seen (if you have this RPC)
    if (user?.id) {
      supabase.rpc('mark_all_messages_seen', { uid: user.id }).catch(() => {});
      // or a per-conversation RPC if you have one:
      // supabase.rpc('mark_conversation_seen', { conv_id: conversationId }).catch(() => {});
    }

    // 3) then navigate
    navigate(`/chat/${encodeURIComponent(conversationId)}`, { replace: true });
  }, [conversationId, navigate, user?.id]);

  return null; // nothing to render
}

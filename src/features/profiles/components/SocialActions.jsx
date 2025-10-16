// src/features/profiles/components/SocialActions.jsx
import { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SubscribeButton from '@/features/profiles/components/subscriber/SubscribeButton';

export default function SocialActions({
  profileId,
  isOwnProfile,
  initialSubscribed,
  onSubscribeToggle,
  onFollowToggle,
  profileIsPrivate = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = user?.id || null;
  const [busy, setBusy] = useState(false);

  // hide for self/unauth
  if (!profileId || !me || isOwnProfile || me === profileId) return null;

  const handleMessage = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const dismiss = toast.loading('Opening chat…');
    try {
      // Lazy import keeps profile bundle small
      const { getOrCreateDirectVisible } = await import('@/data/user/chat/chat');

      // Ensures convo exists, unarchives my row, sets partner_user_id
      const conv = await getOrCreateDirectVisible(profileId);
      if (conv?.id) {
        toast.dismiss(dismiss);
        navigate(`/chat/${conv.id}`);
      } else {
        throw new Error('No conversation id returned');
      }
    } catch (e) {
      toast.dismiss(dismiss);
      toast.error(e?.message || 'Failed to start chat.');
    } finally {
      setBusy(false);
    }
  }, [profileId, navigate, busy]);

  const handleToggle = useCallback(
    (now) => {
      if (typeof onSubscribeToggle === 'function') return onSubscribeToggle(now);
      if (typeof onFollowToggle === 'function') return onFollowToggle(now);
    },
    [onSubscribeToggle, onFollowToggle]
  );

  return (
    <div className="flex flex-col gap-2 w-[116px]">
      <SubscribeButton
        targetId={profileId}
        initialSubscribed={initialSubscribed}
        size="sm"
        className="w-full"
        onToggle={handleToggle}
        profileIsPrivate={Boolean(profileIsPrivate)}
      />

      <button
        onClick={handleMessage}
        disabled={busy}
        className="w-full px-3 py-1.5 rounded-lg bg-white text-black text-sm hover:opacity-90 disabled:opacity-60"
        title="Send a private message"
      >
        {busy ? 'Opening…' : 'Message'}
      </button>
    </div>
  );
}

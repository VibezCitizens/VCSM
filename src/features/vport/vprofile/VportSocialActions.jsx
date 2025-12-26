import { useEffect, useState } from "react";

// shared UI buttons
import MessageButton from '@/features/profiles/shared/components/button/Messagebutton';
import SubscribeButton from '@/features/profiles/shared/components/button/Subscribebutton';

export default function VportSocialActions({
  initialSubscribed = false,
  onMessage,
  onSubscribeToggle,
}) {
  const [subscribed, setSubscribed] = useState(!!initialSubscribed);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSubscribed(!!initialSubscribed);
  }, [initialSubscribed]);

  const handleMessage = async () => {
    if (busy) return;
    setBusy(true);

    try {
      await onMessage?.();
    } finally {
      setBusy(false);
    }
  };

  const handleSubscribeToggle = async () => {
    if (busy) return;
    setBusy(true);

    const next = !subscribed;
    setSubscribed(next);

    try {
      await onSubscribeToggle?.(next);
    } catch (e) {
      setSubscribed(!next);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <MessageButton
        onClick={handleMessage}
        disabled={busy}
      />

      <SubscribeButton
        isSubscribed={subscribed}
        onClick={handleSubscribeToggle}
        disabled={busy}
      />
    </div>
  );
}

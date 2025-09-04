import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useIdentity } from '@/state/identityContext';
import { db } from '@/data/data';

export default function StartAsVportButton({ receiverUserId, className = '' }) {
  const navigate = useNavigate();
  const { identity } = useIdentity(); // expects { type: 'vport', vportId, userId }
  const [busy, setBusy] = useState(false);

  const canActAsVport = identity?.type === 'vport' && Boolean(identity?.vportId);
  const disabled = !canActAsVport || !receiverUserId;

  const go = async () => {
    if (disabled || busy) return;
    setBusy(true);
    try {
      // Use the DAL directly — no manager checks.
      // getOrCreateVport may return an object or id depending on your impl;
      // handle both shapes safely.
      const result = await db.chat.getOrCreateVport({
        vportId: identity.vportId,
        withUserId: receiverUserId,
        // viewerId is optional in many setups; include if your DAL expects it:
        viewerId: identity.userId ?? null,
      });

      const cid = typeof result === 'string' ? result : result?.id;
      if (cid) navigate(`/vchat/${cid}`);
    } catch (e) {
      console.warn('[StartAsVportButton] failed to start conversation:', e);
      alert('Could not start conversation as VPORT. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={go}
      disabled={disabled || busy}
      title={
        canActAsVport
          ? 'Message as VPORT'
          : 'Switch to a VPORT identity to message as VPORT'
      }
      className={`px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {busy ? 'Starting…' : 'Message as VPORT'}
    </button>
  );
}

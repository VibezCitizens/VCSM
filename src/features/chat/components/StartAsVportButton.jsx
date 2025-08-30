// src/features/chat/components/StartAsVportButton.jsx
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { startVportConversation } from '@/features/chat/utils/getOrCreateConversation'; // ✅ unified util wrapper
import { ensureVportManager } from '@/features/chat/utils/ensureVportManager';
import { useIdentity } from '@/state/identityContext';

export default function StartAsVportButton({ receiverUserId, className = '' }) {
  const navigate = useNavigate();
  const { identity } = useIdentity(); // expects { type: 'vport', vportId }
  const [busy, setBusy] = useState(false);

  const disabled = !(identity?.type === 'vport' && identity?.vportId);

  const go = async () => {
    if (disabled || busy) return;
    setBusy(true);
    try {
      const ok = await ensureVportManager(identity.vportId);
      if (!ok) {
        alert(
          'You are not authorized to act for this VPORT. Ask the VPORT owner to grant you manager access.'
        );
        return;
      }
      const cid = await startVportConversation(identity.vportId, receiverUserId);
      if (cid) navigate(`/vchat/${cid}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={go}
      disabled={disabled || busy}
      title={
        disabled
          ? 'Switch to a VPORT identity to message as VPORT'
          : 'Message as VPORT'
      }
      className={`px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {busy ? 'Starting…' : 'Message as VPORT'}
    </button>
  );
}

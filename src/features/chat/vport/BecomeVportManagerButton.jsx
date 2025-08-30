// src/features/chat/vport/BecomeVportManagerButton.jsx
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ensureVportManager } from '@/features/chat/utils/ensureVportManager';

export default function BecomeVportManagerButton({ vportId, onBecameManager, className = '' }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const click = async () => {
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      const ok = await ensureVportManager(vportId);
      if (ok) {
        setMsg('You are now a manager for this VPORT.');
        onBecameManager?.();
      } else {
        setMsg('Request sent to the VPORT owner for approval.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={click}
        disabled={busy}
        className={`px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50 ${className}`}
        title="If you are the owner, this promotes you immediately; otherwise it creates a request."
      >
        {busy ? 'Processing…' : 'Become Manager'}
      </button>
      {msg && <span className="text-xs text-white/70">{msg}</span>}
    </div>
  );
}

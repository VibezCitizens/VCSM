// src/features/settings/tabs/AccountTab.jsx
import { useState } from 'react';
import Card from '../components/Card';
import Row from '../components/Row';
import { db } from '@/data/data';
import { supabase } from '@/lib/supabaseClient';

export default function AccountTab() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const logout = async () => {
    try { await db.auth.signOut(); } finally { /* no-op */ }
  };

  const deleteAccount = async () => {
    setBusy(true);
    setErr('');
    try {
      // 1) Try SECURITY DEFINER RPC (best practice)
      const { error: rpcErr } = await supabase.rpc('delete_my_account');
      if (rpcErr) {
        // If you haven't set up the RPC yet, surface a helpful message.
        // (Keep this catch so the UI doesn’t look broken.)
        throw new Error(
          'Server deletion not available. Please configure the `delete_my_account` RPC.'
        );
      }

      // 2) If RPC succeeded, sign out and redirect home
      await supabase.auth.signOut();
      window.location.replace('/');
    } catch (e) {
      setErr(e?.message || 'Could not delete your account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Session */}
      <Card>
        <Row
          title="Sign out"
          subtitle="Ends your current session"
          right={
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
            >
              Log out
            </button>
          }
        />
      </Card>

      {/* Account settings (placeholders) */}
      <Card>
        <Row
          title="Change email"
          subtitle="Coming soon"
          right={
            <button
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 cursor-not-allowed text-sm"
              disabled
            >
              Edit
            </button>
          }
        />
        <Row
          title="Change password"
          subtitle="Coming soon"
          right={
            <button
              className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 cursor-not-allowed text-sm"
              disabled
            >
              Edit
            </button>
          }
        />
      </Card>

      {/* Danger zone */}
      <Card>
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3">
          <Row
            title={<span className="text-red-300 font-semibold">Delete account</span>}
            subtitle={
              <span className="text-red-200/80">
                Permanently delete your account and all associated data.
                This action cannot be undone.
              </span>
            }
            right={
              <button
                onClick={() => setShowConfirm(true)}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                Delete…
              </button>
            }
          />
          {err && (
            <div className="mt-2 rounded-lg border border-red-900 bg-red-950/60 text-red-200 px-3 py-2 text-sm">
              {err}
            </div>
          )}
        </div>
      </Card>

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmModal
          busy={busy}
          onCancel={() => { if (!busy) setShowConfirm(false); }}
          onConfirm={deleteAccount}
        />
      )}
    </div>
  );
}

/* --------------------- Local confirm modal (accessible) -------------------- */
function ConfirmModal({ busy, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100]">
      <button
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Close"
      />
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md rounded-2xl bg-zinc-950 text-white shadow-2xl border border-zinc-800">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="text-sm font-semibold">Delete account</div>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-zinc-300">
            This will permanently remove your profile, posts, messages, and all related data.
            <span className="text-red-300 font-medium"> This cannot be undone.</span>
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className={`px-3 py-1.5 rounded text-sm ${
                busy ? 'bg-red-800/70 text-red-100' : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {busy ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

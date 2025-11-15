// src/features/settings/tabs/AccountTab.jsx
import { useState } from 'react';
import Card from '../components/Card';
import Row from '../components/Row';
import { db } from '@/data/data';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';

export default function AccountTab() {
  const [showConfirmAccount, setShowConfirmAccount] = useState(false);
  const [busyAccount, setBusyAccount] = useState(false);
  const [errAccount, setErrAccount] = useState('');

  // VPORT delete states
  const [showConfirmVport, setShowConfirmVport] = useState(false);
  const [busyVport, setBusyVport] = useState(false);
  const [errVport, setErrVport] = useState('');

  const { user } = useAuth();
  const { identity } = useIdentity();
  const isVport = identity?.type === 'vport' && !!identity?.vportId;
  const vportId = identity?.vportId ?? null;

  const logout = async () => {
    try {
      // 1) Supabase sign out (clears local session)
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;

      // 2) Optional app-level cleanup (safe no-op if not present)
      try { await db?.auth?.signOut?.(); } catch {}

      // 3) Clear any actor state your UI uses
      try {
        localStorage.removeItem('actor_kind');
        localStorage.removeItem('actor_vport_id');
        localStorage.setItem('actor_touch', String(Date.now()));
        window.dispatchEvent(new CustomEvent('actor:changed', { detail: { kind: 'profile', id: null } }));
      } catch {}

      // 4) Optional: close realtime channels
      try { supabase.getChannels?.().forEach(ch => supabase.removeChannel(ch)); } catch {}

      // 5) Redirect to login (not central feed)
      window.location.replace('/login');
    } catch (e) {
      setErrAccount(e?.message || 'Could not sign out.');
    }
  };

  const deleteAccount = async () => {
    setBusyAccount(true);
    setErrAccount('');
    try {
      // SECURITY DEFINER RPC you create on the DB side
      const { error: rpcErr } = await supabase.rpc('delete_my_account');
      if (rpcErr) {
        throw new Error('Server deletion not available. Please configure the `delete_my_account` RPC.');
      }

      // Sign out locally after deletion and go to login
      await supabase.auth.signOut({ scope: 'local' });
      window.location.replace('/login');
    } catch (e) {
      setErrAccount(e?.message || 'Could not delete your account.');
    } finally {
      setBusyAccount(false);
    }
  };

  // ---------------- VPORT deletion ----------------
  const deleteVport = async () => {
    setBusyVport(true);
    setErrVport('');
    try {
      if (!user?.id) throw new Error('You must be signed in.');
      if (!vportId) throw new Error('No VPORT selected.');

      // Prefer a SECURITY DEFINER RPC that does full cascade + ownership checks.
      // Try RPC first (recommended to implement on DB side):
      //   create or replace function delete_my_vport(p_vport_id uuid) returns void ...
      const { error: rpcErr } = await supabase.rpc('delete_my_vport', { p_vport_id: vportId });

      if (rpcErr) {
        // Fallback: direct delete if your RLS allows owner-only delete
        // Adjust owner column name if different (e.g., creator_id / user_id).
        const { error: delErr } = await supabase
          .from('vports')
          .delete()
          .eq('id', vportId)
          .eq('owner_id', user.id); // <-- change this if your schema uses a different owner column

        if (delErr) {
          throw new Error(
            'Server-side VPORT deletion is not configured. Create RPC `delete_my_vport` or enable owner delete on `vports`.'
          );
        }
      }

      // Clean up actor state (switch back to user persona)
      try {
        localStorage.setItem('actor_kind', 'profile');
        localStorage.removeItem('actor_vport_id');
        localStorage.setItem('actor_touch', String(Date.now()));
        window.dispatchEvent(new CustomEvent('actor:changed', { detail: { kind: 'profile', id: null } }));
      } catch {}

      // Close realtime channels
      try { supabase.getChannels?.().forEach(ch => supabase.removeChannel(ch)); } catch {}

      // Redirect to a safe page (user profile or feed)
      window.location.replace('/me');
    } catch (e) {
      setErrVport(e?.message || 'Could not delete the VPORT.');
    } finally {
      setBusyVport(false);
      setShowConfirmVport(false);
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

      {/* Danger zone: Delete VPORT (only when acting as VPORT) */}
      {isVport && (
        <Card>
          <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3">
            <Row
              title={<span className="text-red-300 font-semibold">Delete VPORT</span>}
              subtitle={
                <span className="text-red-200/80">
                  Permanently delete this VPORT and all associated data (posts, media, chats scoped to this VPORT).
                  <span className="text-red-300 font-medium"> This cannot be undone.</span>
                </span>
              }
              right={
                <button
                  onClick={() => setShowConfirmVport(true)}
                  className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Delete…
                </button>
              }
            />
            {errVport && (
              <div className="mt-2 rounded-lg border border-red-900 bg-red-950/60 text-red-200 px-3 py-2 text-sm">
                {errVport}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Danger zone: Delete Account (user account) */}
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
                onClick={() => setShowConfirmAccount(true)}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                Delete…
              </button>
            }
          />
          {errAccount && (
            <div className="mt-2 rounded-lg border border-red-900 bg-red-950/60 text-red-200 px-3 py-2 text-sm">
              {errAccount}
            </div>
          )}
        </div>
      </Card>

      {/* Confirm modals */}
      {showConfirmVport && (
        <ConfirmVportModal
          busy={busyVport}
          onCancel={() => { if (!busyVport) setShowConfirmVport(false); }}
          onConfirm={deleteVport}
        />
      )}

      {showConfirmAccount && (
        <ConfirmModal
          busy={busyAccount}
          onCancel={() => { if (!busyAccount) setShowConfirmAccount(false); }}
          onConfirm={deleteAccount}
        />
      )}
    </div>
  );
}

/* --------------------- Local confirm modal (account) -------------------- */
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

/* --------------------- Local confirm modal (VPORT) -------------------- */
function ConfirmVportModal({ busy, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100]">
      <button
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Close"
      />
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md rounded-2xl bg-zinc-950 text-white shadow-2xl border border-zinc-800">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="text-sm font-semibold">Delete VPORT</div>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-zinc-300">
            This will permanently remove this VPORT and all related data (posts, media, subscriptions, chats scoped to this VPORT).
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
              {busy ? 'Deleting…' : 'Delete VPORT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

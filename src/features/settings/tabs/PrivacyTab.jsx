import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Row from '../components/Row';
import ProfilePrivacyToggle from '../components/ProfilePrivacyToggle';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/data/data';

function BlockedUsersPanel() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    if (!user?.id) { setList([]); setLoading(false); return; }
    setLoading(true);
    setMsg('');
    try {
      const rows = await db.blocks.list({ userId: user.id });
      setList(rows || []);
    } catch (e) {
      setMsg(e.message || 'Could not load.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-line */ }, [user?.id]);

  const add = async () => {
    const raw = (input || '').trim();
    if (!raw || !user?.id || busy) return;
    try {
      setBusy(true);
      setMsg('');
      const ok = await db.blocks.blockByUsername({ blockerId: user.id, username: raw });
      if (!ok) setMsg('User not found or already blocked.');
      setInput('');
      await load();
    } catch (e) {
      setMsg(e.message || 'Failed to block.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (blockedId) => {
    if (!user?.id || busy) return;
    try {
      setBusy(true);
      setMsg('');
      await db.blocks.unblock({ blockerId: user.id, blockedId });
      await load();
    } catch (e) {
      setMsg(e.message || 'Failed to unblock.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="@username"
          className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm"
          disabled={busy || loading}
        />
        <button
          onClick={add}
          disabled={busy || loading || !input.trim()}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-sm"
        >
          Block
        </button>
      </div>

      {msg && <div className="text-xs text-amber-300">{msg}</div>}

      <div className="rounded-xl border border-zinc-800">
        <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-400">
          {loading ? 'Loading…' : `${list.length} blocked`}
        </div>
        {loading ? (
          <div className="p-3 text-sm text-zinc-400">Please wait…</div>
        ) : list.length === 0 ? (
          <div className="p-3 text-sm text-zinc-400">You haven’t blocked anyone.</div>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {list.map(u => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm truncate">
                    {u.display_name}
                    {u.username ? <span className="ml-2 text-xs text-zinc-400">@{u.username}</span> : null}
                  </div>
                </div>
                <button
                  onClick={() => remove(u.id)}
                  disabled={busy}
                  className="text-sm px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PrivacyTab() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="text-sm text-zinc-300 mb-3">
          Control who can see your profile and activity. New accounts start <b>public</b>.
        </div>
        <Row
          title="Profile visibility"
          subtitle="Public (default) or Private"
          right={<ProfilePrivacyToggle />}
        />
      </Card>

      <Card>
        <div className="px-2 pb-2">
          <h3 className="text-sm font-semibold">Blocked users</h3>
          <p className="text-xs text-zinc-400">Manage who can’t view or interact with you.</p>
        </div>
        <BlockedUsersPanel />
      </Card>
    </div>
  );
}

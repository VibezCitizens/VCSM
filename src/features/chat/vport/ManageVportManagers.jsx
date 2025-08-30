// src/features/chat/vport/ManageVportManagers.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ManageVportManagers({ vportId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    const { data, error } = await supabase
      .from('vport_manager_requests')
      .select(`
        id, status, decision_reason, decided_at, created_at,
        requester_user_id,
        requester:profiles!inner(id, username, display_name, photo_url)
      `)
      .eq('vport_id', vportId)
      .order('created_at', { ascending: false });

    if (error) setErr(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { if (vportId) load(); }, [vportId]);

  const decide = async (id, approve) => {
    const reason = !approve ? window.prompt('Reason (optional):', '') : null;
    const { error } = await supabase.rpc('decide_vport_manager', {
      p_request_id: id,
      p_approve: approve,
      p_reason: reason,
    });
    if (error) {
      alert(error.message || 'Failed to decide.');
      return;
    }
    await load();
  };

  if (!vportId) return null;

  return (
    <div className="p-3 space-y-3 bg-neutral-900 rounded border border-neutral-800">
      <div className="text-white font-medium">Manager Requests</div>
      {loading && <div className="text-white/70">Loading…</div>}
      {err && <div className="text-red-300">Error: {err}</div>}
      {!loading && rows.length === 0 && (
        <div className="text-white/60 text-sm">No requests.</div>
      )}

      {!loading && rows.map(r => (
        <div key={r.id} className="flex items-center justify-between p-2 rounded bg-neutral-800">
          <div className="flex items-center gap-3">
            <img
              src={r.requester?.photo_url || '/default.png'}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-neutral-700"
              onError={(e) => { e.currentTarget.src = '/default.png'; }}
            />
            <div className="text-sm text-white">
              {r.requester?.display_name || r.requester?.username || r.requester_user_id}
              <div className="text-xs text-white/60">
                Status: {r.status}
                {r.decided_at ? ` • Decided: ${new Date(r.decided_at).toLocaleString()}` : ''}
                {r.decision_reason ? ` • Reason: ${r.decision_reason}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {r.status === 'pending' ? (
              <>
                <button
                  onClick={() => decide(r.id, true)}
                  className="px-3 py-1 rounded bg-green-600 text-white"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(r.id, false)}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >
                  Deny
                </button>
              </>
            ) : (
              <button
                onClick={load}
                className="px-3 py-1 rounded bg-neutral-700 text-white"
              >
                Refresh
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

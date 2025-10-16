// src/features/settings/components/pendingrequest/PendingRequestsList.jsx
import { useEffect, useState, useCallback } from 'react';
import { listIncomingFollowRequests } from '@/features/profiles/lib/friendrequest/followRequests';
import PendingRequestItem from './PendingRequestItem';

export default function PendingRequestsList() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');
    setLoading(true);
    try {
      const data = await listIncomingFollowRequests();
      setRows(data);
    } catch (e) {
      setErr(e?.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="px-1 py-2">
        <div className="h-9 rounded-md bg-neutral-800 animate-pulse mb-2" />
        <div className="h-9 rounded-md bg-neutral-800 animate-pulse mb-2" />
      </div>
    );
  }

  if (err) {
    return <div className="px-1 py-2 text-sm text-red-400">{err}</div>;
  }

  if (!rows.length) {
    return <div className="px-1 py-2 text-sm text-zinc-400">No pending requests.</div>;
  }

  return (
    <ul className="divide-y divide-zinc-800 rounded-lg overflow-hidden">
      {rows.map(r => (
        <PendingRequestItem
          key={`${r.requesterAuthId}-${r.createdAt}`}
          item={r}
          onChanged={load}
        />
      ))}
    </ul>
  );
}

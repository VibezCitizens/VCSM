import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function VPortProfile() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, error: null, vport: null });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setState({ loading: true, error: null, vport: null });
      if (!id || id === ':id') {
        if (!cancelled) setState({ loading: false, error: 'Invalid VPort id.', vport: null });
        return;
      }
      try {
        const { data, error } = await supabase.from('vports').select('*').eq('id', id).maybeSingle();
        if (error) {
          const friendly = error.code === '22P02' ? 'Invalid VPort id format.' : error.message || 'Failed to load VPort.';
          if (!cancelled) setState({ loading: false, error: friendly, vport: null });
          return;
        }
        if (!data) {
          if (!cancelled) setState({ loading: false, error: 'VPort not found.', vport: null });
          return;
        }
        if (!cancelled) setState({ loading: false, error: null, vport: data });
      } catch {
        if (!cancelled) setState({ loading: false, error: 'Unexpected error loading VPort.', vport: null });
      }
    }
    run();
    return () => { cancelled = true; };
  }, [id]);

  if (state.loading) return <div className="min-h-screen bg-black text-white grid place-items-center"><div className="text-white/70">Loading VPort…</div></div>;
  if (state.error)   return <div className="min-h-screen bg-black text-white grid place-items-center"><div className="text-red-400">{state.error}</div></div>;

  const v = state.vport;
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center gap-4">
          {v.avatar_url ? (
            <img src={v.avatar_url} alt={`${v.name} logo`} className="w-16 h-16 rounded-xl object-cover border border-neutral-700" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-neutral-700 grid place-items-center text-xl font-semibold">
              {(v.name || 'VP').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-xl font-semibold">{v.name}</div>
            <div className="text-sm text-white/60">
              {v.city || v.region || v.country ? [v.city, v.region, v.country].filter(Boolean).join(', ') : '—'}
            </div>
          </div>
        </div>

        <div className="mt-6 text-white/80">
          <div className="mb-2"><span className="text-white/60">Type:</span> {v.type}</div>
          {v.website && <div className="mb-2"><span className="text-white/60">Website:</span> <a className="text-purple-300 underline" href={v.website} target="_blank" rel="noreferrer">{v.website}</a></div>}
          {v.phone &&   <div className="mb-2"><span className="text-white/60">Phone:</span> {v.phone}</div>}
          {v.address && <div className="mb-2"><span className="text-white/60">Address:</span> {v.address}</div>}
          <div className="mb-2"><span className="text-white/60">Verified:</span> {v.verified ? 'Yes' : 'No'}</div>
          <div className="mb-2"><span className="text-white/60">Claim Status:</span> {v.claim_status || 'Unclaimed'}</div>
        </div>
      </div>
    </div>
  );
}

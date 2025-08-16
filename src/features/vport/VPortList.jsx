import React, { useEffect, useMemo, useState } from 'react';
import { Link, generatePath } from 'react-router-dom';
import { listVPorts } from './VPortService';
import { supabase } from '@/lib/supabaseClient';
import InitialBadge from './InitialBadge';

function VPortRow({ v, currentUserId }) {
  const [imgOk, setImgOk] = useState(Boolean(v?.avatar_url));
  const cacheKey = v?.updated_at || v?.created_at || '';
  const src = v?.avatar_url ? `${v.avatar_url}${cacheKey ? `?t=${encodeURIComponent(cacheKey)}` : ''}` : null;
  const isOwner = v?.created_by === currentUserId;
  const href = v?.id ? generatePath('/vports/:id', { id: v.id }) : '/vports';

  return (
    <div className="rounded-xl border border-zinc-800 hover:border-zinc-600 transition p-3 flex gap-3 items-center">
      <Link to={href} className="flex gap-3 flex-1 items-center no-underline hover:no-underline text-white">
        {src && imgOk ? (
          <img
            src={src}
            alt={v.name || 'VPort'}
            className="w-16 h-16 rounded-lg object-cover"
            loading="lazy"
            onError={() => setImgOk(false)}
          />
        ) : (
          <InitialBadge name={v.name} />
        )}
        <div className="flex-1">
          <div className="text-base font-semibold">{v.name}</div>
          <div className="text-xs opacity-70">
            {v.type} • {[v.city, v.region, v.country].filter(Boolean).join(', ')}
          </div>
        </div>
      </Link>

      {isOwner && (
        <Link
          to={`/posts/new?vport_id=${v.id}`}
          className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-xs"
        >
          Post
        </Link>
      )}

      <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function VPortList() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const [{ data: authUser }, { data, count }] = await Promise.all([
        supabase.auth.getUser(),
        listVPorts({ q, limit: 50, offset: 0 }) // ensure it returns created_by
      ]);
      setCurrentUserId(authUser?.user?.id || null);
      setRows(data);
      setCount(count);
    } catch (e) {
      setErr(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 text-white">
      <div className="flex items-center gap-2">
        <input
          className="flex-1 p-2 rounded bg-white text-black border border-gray-300"
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700" onClick={load}>
          Search
        </button>
        <Link to="/vports/new" className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700">
          New
        </Link>
      </div>

      {err && <div className="text-red-400 text-sm">{err}</div>}

      {loading ? (
        <div className="opacity-70">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="opacity-70">No results.</div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs opacity-60">{count} results</div>
          {rows.map((v) => (
            <VPortRow key={v.id} v={v} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

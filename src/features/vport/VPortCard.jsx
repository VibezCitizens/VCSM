import React, { useState } from 'react';
import { Link, generatePath } from 'react-router-dom';
import InitialBadge from './InitialBadge';

function VerifiedDot() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border border-zinc-700"
      title="Verified"
      aria-label="Verified"
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </span>
  );
}

export default function VPortCard({ v }) {
  if (!v) return null;

  const cacheKey = v?.updated_at || v?.created_at || '';
  const baseImage = v?.avatar_url || v?.logo_url || v?.cover_url || null;
  const imageSrc = baseImage ? `${baseImage}${cacheKey ? `?t=${encodeURIComponent(cacheKey)}` : ''}` : null;
  const [imgOk, setImgOk] = useState(Boolean(imageSrc));

  const location = [v?.city, v?.region, v?.country].filter(Boolean).join(', ');
  const href = v?.id ? generatePath('/vports/:id', { id: v.id }) : '/vports';

  return (
    <Link
      to={href}
      className="block rounded-xl border border-zinc-800 hover:border-zinc-600 transition p-3 flex gap-3 items-center no-underline hover:no-underline"
      aria-label={`Open VPort ${v?.name || 'Untitled'}`}
    >
      {imageSrc && imgOk ? (
        <img
          src={imageSrc}
          alt={v?.name ? `${v.name} logo` : 'VPort logo'}
          className="w-16 h-16 rounded-lg object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgOk(false)}
        />
      ) : (
        <InitialBadge name={v?.name} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-base font-semibold truncate text-white">{v?.name || 'Untitled'}</div>
          {v?.verified ? <VerifiedDot /> : null}
        </div>
        <div className="text-xs opacity-70 truncate text-white">{(v?.type || '—') + ' • ' + (location || '—')}</div>
        <div className="text-xs mt-1 opacity-60 text-white">Status: {(v?.claim_status || (v?.verified ? 'verified' : 'unverified'))}</div>
      </div>

      <svg className="w-5 h-5 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

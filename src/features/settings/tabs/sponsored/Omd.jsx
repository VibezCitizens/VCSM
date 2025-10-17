// src/features/settings/tabs/sponsored/Omd.jsx
import React from 'react';

export default function Omd() {
  const href = 'https://onemoredays.com';

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Heading / context (optional) */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white">One More Day</h2>
        <p className="text-sm text-neutral-400">Powered by Vibez Citizens</p>
      </div>

      {/* Clickable image card */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block group rounded-2xl overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950 hover:ring-1 hover:ring-white/10 transition"
        aria-label="Open onemoredays.com"
      >
        <img
          src="/vgrid-preview.jpg"
          alt="One More Day preview"
          className="w-full h-auto object-cover group-hover:opacity-95 transition"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/avatar.jpg';
          }}
        />
      </a>

      {/* Optional CTA button */}
      <div className="mt-3">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-medium hover:opacity-90 transition"
        >
          Visit onemoredays.com
        </a>
      </div>
    </div>
  );
}

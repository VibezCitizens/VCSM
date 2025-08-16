import React from 'react';

export default function Section({ title, children, className = '' }) {
  return (
    <div className={`bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 ${className}`}>
      {title && <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-3">{title}</h3>}
      <div className="text-zinc-100">{children}</div>
    </div>
  );
}

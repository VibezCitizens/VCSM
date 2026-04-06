// src/ui/components/NewBadge.jsx
import React from 'react';

export default function NewBadge({ className = '' }) {
  return (
    <span
      className={[
        // rectangle style
        'inline-flex items-center justify-center',
        'px-2 py-0.5 rounded-md',
        // visual
        'bg-white text-black',
        'text-[10px] font-semibold tracking-wide uppercase',
        // subtle shadow on dark UI
        'shadow-sm',
        className,
      ].join(' ')}
    >
      new
    </span>
  );
}

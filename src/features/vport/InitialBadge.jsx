import React, { useMemo } from 'react';

export default function InitialBadge({ name }) {
  const initials = useMemo(() => {
    const v = (name || '')
      .trim()
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
    return v || 'VP';
  }, [name]);

  return (
    <div
      className="w-16 h-16 rounded-lg bg-zinc-800 grid place-items-center text-sm font-semibold"
      aria-label="VPort placeholder"
    >
      {initials}
    </div>
  );
}

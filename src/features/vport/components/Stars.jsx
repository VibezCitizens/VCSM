import React from 'react';
import { Star } from 'lucide-react';

export function StarsRead({ value = 0, size = 18 }) {
  const full = Math.round(value);
  return (
    <div className="inline-flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < full ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'} />
      ))}
    </div>
  );
}

export function StarsInput({ value, setValue, disabled }) {
  return (
    <div className="inline-flex items-center">
      {Array.from({ length: 5 }).map((_, i) => {
        const val = i + 1;
        const active = val <= (value || 0);
        return (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && setValue(val)}
            disabled={disabled}
            className="p-1"
            title={`Rate ${val} star${val > 1 ? 's' : ''}`}
          >
            <Star size={20} className={active ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600 hover:text-zinc-300'} />
          </button>
        );
      })}
    </div>
  );
}

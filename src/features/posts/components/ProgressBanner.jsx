// src/components/ProgressBanner.jsx
/**
 * @file ProgressBanner.jsx
 * Lightweight status banner with an optional determinate progress bar.
 *
 * Props:
 * - message   (string)  : Status text to display. If falsy, renders nothing.
 * - showBar   (boolean) : Whether a progress bar may be shown.
 * - progress  (number)  : 0–100. Bar shows only when 0 < progress < 100.
 */
import React from 'react';

export default function ProgressBanner({ message, showBar = false, progress = 0 }) {
  if (!message) return null;

  const clamped = Math.max(0, Math.min(100, Number(progress) || 0));
  const showDeterminate = showBar && clamped > 0 && clamped < 100;

  return (
    <div
      className="bg-blue-600 text-white text-sm text-center p-3 rounded mb-4 w-full max-w-md"
      role="status"
      aria-live="polite"
    >
      <span>{message}</span>

      {showDeterminate && (
        <div
          className="mt-2 w-full bg-blue-200 rounded-full h-2.5"
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clamped)}
        >
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-[width] duration-200 ease-linear"
            style={{ width: `${clamped}%` }}
          />
        </div>
      )}
    </div>
  );
}

// src/features/settings/ui/Card.jsx
// ============================================================
// SETTINGS — CARD (UI)
// ------------------------------------------------------------
// Reusable container for Settings views
// Pure UI, no logic, no hooks
// ============================================================

import { cx } from '../constants';

export default function Card({ title, children, className = '' }) {
  return (
    <section
      className={cx(
        'settings-card-surface rounded-2xl text-white shadow-sm',
        className
      )}
    >
      {title ? (
        <div className="px-4 pt-3 pb-2 text-xs tracking-wide text-slate-400">
          {title}
        </div>
      ) : null}

      <div className="px-2 pb-2">
        {children}
      </div>
    </section>
  );
}

// src/features/settings/components/Row.jsx
import { Link } from 'react-router-dom';

export default function Row({
  to,
  onClick,
  title,
  subtitle,
  left,          // optional custom node; if provided it replaces the title/subtitle block
  right,         // trailing control (e.g. a button or switch)
  className = '',
}) {
  const hasAction = !!(to || onClick);
  const Interactive = to ? Link : 'button';

  return (
    <section
      className={[
        'rounded-2xl bg-zinc-900/80 border border-zinc-800 p-3',
        hasAction ? 'hover:bg-zinc-900 transition-colors' : '',
        className,
      ].join(' ')}
    >
      <div className="w-full flex items-center justify-between gap-3">
        {/* LEFT SIDE (text or custom) */}
        <div className="min-w-0">
          {left ? (
            left
          ) : hasAction ? (
            <Interactive
              to={to}
              onClick={onClick}
              className="block text-left no-underline"
            >
              <div className="text-sm font-semibold text-white truncate">
                {title}
              </div>
              {subtitle ? (
                <div className="text-xs text-zinc-400 truncate">{subtitle}</div>
              ) : null}
            </Interactive>
          ) : (
            <>
              <div className="text-sm font-semibold text-white truncate">
                {title}
              </div>
              {subtitle ? (
                <div className="text-xs text-zinc-400 truncate">{subtitle}</div>
              ) : null}
            </>
          )}
        </div>

        {/* RIGHT SIDE (control) */}
        <div className="shrink-0">
          {right}
        </div>
      </div>
    </section>
  );
}

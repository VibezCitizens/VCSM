// src/features/settings/components/Row.jsx
import { Link } from 'react-router-dom';

export default function Row({ to, onClick, left, right }) {
  const Component = to ? Link : 'button';
  return (
    <Component
      to={to}
      onClick={onClick}
      className="w-full text-left group flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-zinc-800/70 transition-colors"
    >
      <div className="flex min-w-0 items-center gap-3">{left}</div>
      <div className="flex items-center gap-2 shrink-0 text-zinc-400">
        {right}
        {(to || onClick) ? (
          <svg viewBox="0 0 20 20" className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          </svg>
        ) : null}
      </div>
    </Component>
  );
}

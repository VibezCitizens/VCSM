// src/ui/components/TopNav.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useIdentity } from '@/state/identityContext';

export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { identity } = useIdentity();

  const inVoid = pathname.startsWith('/void');
  const isVport = identity?.type === 'vport' && !!identity?.vportId;

  // compact persona label
  const personaLabel = isVport
    ? `VPORT${identity?.vportSlug ? ` · ${identity.vportSlug}` : ''}`
    : 'USER';

  return (
    <div className="fixed top-0 inset-x-0 z-50 h-12 bg-black border-b border-neutral-800">
      <div className="h-full px-4 flex items-center justify-between gap-2">
        {/* Persona chip (read-only indicator) */}
        <div className="min-w-[84px] flex justify-start">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
              isVport
                ? 'bg-purple-950/40 text-purple-200 border-purple-700/40'
                : 'bg-neutral-900 text-neutral-300 border-neutral-700/60'
            }`}
            title={isVport ? 'You are acting as a VPORT' : 'You are acting as a user'}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isVport ? 'bg-purple-400' : 'bg-neutral-400'
              }`}
              aria-hidden="true"
            />
            {personaLabel}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold text-center flex-1 select-none">
          {inVoid ? 'The Void' : 'Vibez Citizens'}
        </h1>

        {/* Void toggle (same routes, persona-aware tooltip) */}
        <div className="min-w-[84px] flex justify-end">
          {inVoid ? (
            <button
              onClick={() => navigate('/feed')}
              title={`Exit the Void (${personaLabel})`}
              className="text-white opacity-80 hover:opacity-100 transition focus:outline-none"
              aria-label="Exit the Void"
            >
              🚪
            </button>
          ) : (
            <button
              onClick={() => navigate('/void')}
              title={`Enter the Void (${personaLabel})`}
              className="text-white opacity-60 hover:opacity-100 transition focus:outline-none"
              aria-label="Enter the Void"
            >
              👁️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

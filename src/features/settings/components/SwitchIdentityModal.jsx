// src/features/settings/components/SwitchIdentityModal.jsx
import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import CreateVportInline from './CreateVportInline';
import { cx } from '../constants';

export default function SwitchIdentityModal({
  open,
  onClose,
  userEntry,
  vports,
  currentIdentity,   // { type:'user'|'vport', vportId? }
  onActAsUser,
  onActAsVport,
  onCreated,
  user,              // for create form
}) {
  const [mode, setMode] = useState('switch'); // 'switch' | 'create'
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (open) setMode('switch');
  }, [open]);

  // Focus + Esc to close
  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement;
    closeBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prevActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const isUser = currentIdentity?.type === 'user';
  const activeVportId =
    currentIdentity?.type === 'vport' ? currentIdentity.vportId : null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-identity-title"
    >
      {/* Backdrop: use a div, not a button (avoids nested-button issues) */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="absolute z-[101] inset-x-0 bottom-0 md:inset-0 md:m-auto md:max-w-lg md:h-fit rounded-t-2xl md:rounded-2xl bg-zinc-950 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div id="switch-identity-title" className="text-sm font-semibold">
            {mode === 'switch' ? 'Switch account' : 'Create a Vport'}
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 rounded p-1 focus:outline-none focus:ring-2 focus:ring-violet-600"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-5">
          {mode === 'switch' ? (
            <>
              {/* MAIN ACCOUNT */}
              <div>
                <div className="px-1 pb-2 text-xs tracking-wide text-zinc-400">
                  MAIN ACCOUNT
                </div>
                <div
                  className={cx(
                    'flex items-center justify-between gap-2 rounded-xl p-2',
                    isUser ? 'bg-violet-900/30 ring-1 ring-violet-700' : 'bg-zinc-900'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar url={userEntry.avatar_url} name={userEntry.display} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{userEntry.display}</div>
                      <div className="text-xs text-zinc-400 truncate">{userEntry.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={onActAsUser}
                    className={cx(
                      'rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-600',
                      isUser ? 'bg-zinc-800 text-zinc-300 cursor-default' : 'bg-violet-600 hover:bg-violet-700'
                    )}
                    disabled={isUser}
                  >
                    {isUser ? 'Current' : 'Switch'}
                  </button>
                </div>
              </div>

              {/* VPORT ACCOUNTS */}
              <div>
                <div className="px-1 pb-2 text-xs tracking-wide text-zinc-400">
                  VPORT ACCOUNTS
                </div>
                {vports.length === 0 ? (
                  <div className="text-sm text-zinc-400 px-2 py-3 bg-zinc-900 rounded-xl">
                    You don’t have any VPORTs yet.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {vports.map((vp) => {
                      const active = activeVportId === vp.id;
                      return (
                        <li
                          key={vp.id}
                          className={cx(
                            'flex items-center justify-between gap-2 rounded-xl p-2',
                            active ? 'bg-violet-900/30 ring-1 ring-violet-700' : 'bg-zinc-900'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar url={vp.avatar_url} name={vp.name} />
                            <div className="min-w-0">
                              <div className="truncate font-medium">{vp.name}</div>
                              <div className="text-xs text-zinc-400 truncate">
                                VPORT • {vp.id}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onActAsVport(vp)}
                            className={cx(
                              'rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-600',
                              active ? 'bg-zinc-800 text-zinc-300 cursor-default' : 'bg-violet-600 hover:bg-violet-700'
                            )}
                            disabled={active}
                          >
                            {active ? 'Current' : 'Switch'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* CREATE A VPORT */}
              <div>
                <div className="px-1 pb-2 text-xs tracking-wide text-zinc-400">
                  CREATE A VPORT
                </div>
                <button
                  onClick={() => setMode('create')}
                  className="block w-full text-center rounded-xl bg-blue-600 py-2.5 font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create a Vport
                </button>
              </div>
            </>
          ) : (
            <CreateVportInline
              user={user}
              onCreated={onCreated}
              onCancel={() => setMode('switch')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// src/features/settings/VportsTab.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Plus, X, ExternalLink } from 'lucide-react';

// data-layer for vc.vports
import { listMyVports } from '@/data/vport/vprofile/vport.js';
import CreateVportForm from '@/features/vport/CreateVportForm.jsx';

// ✅ unified actor helpers (legacy store used by other parts like Upload)
import {
  getActor,
  onActorChange,
  setProfileMode,
  setVportMode,
} from '@/lib/actors/actor';

// ✅ Identity context used by navbar/routing
import { useIdentity } from '@/state/identityContext';

function visit(url) {
  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = url;
  } catch {
    window.location.href = url;
  }
}

export default function VportsTab() {
  const { user } = useAuth() || {};
  const { actAsUser, actAsVport } = useIdentity(); // ← bridge to IdentityContext
  const [items, setItems] = useState([]);
  const [activeActor, setActiveActor] = useState('profile'); // 'profile' | `vport:${id}`
  const [busy, setBusy] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const navigate = useNavigate();

  const omdUrl = useMemo(() => 'https://onemoredays.com', []);

  useEffect(() => {
    let alive = true;

    // load owned vports
    (async () => {
      try {
        const list = await listMyVports();
        if (alive) setItems(list ?? []);
      } catch (e) {
        console.error('Failed to load vports:', e);
        if (alive) setItems([]);
      }
    })();

    // hydrate current actor from legacy unified API
    const current = getActor();
    setActiveActor(current?.kind === 'vport' ? `vport:${current.id}` : 'profile');

    // subscribe to actor changes (covers same-tab & cross-tab)
    const unsub = onActorChange((a) => {
      setActiveActor(a?.kind === 'vport' ? `vport:${a.id}` : 'profile');
    });

    return () => {
      alive = false;
      try { unsub?.(); } catch {}
    };
  }, []);

  // Ensure we have current auth id when hook isn't ready
  const getAuthedUserId = async () => {
    if (user?.id) return user.id;
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const uid = data?.user?.id;
    if (!uid) throw new Error('Not authenticated');
    return uid;
  };

  const switchToProfile = async () => {
    setBusy(true);
    try {
      const meId = await getAuthedUserId();

      // 1) legacy store (keeps upload/etc happy)
      setProfileMode();

      // 2) IdentityContext (keeps navbar/routing happy)
      actAsUser();

      setActiveActor('profile');

      // 👉 route to user inbox
      navigate(`/notifications?actor=profile:${meId}`);
    } finally {
      setBusy(false);
    }
  };

  const switchToVport = async (v) => {
    setBusy(true);
    try {
      // 1) legacy store
      setVportMode(v.id);

      // 2) IdentityContext
      actAsVport(v.id); // v.id is vc.vports.id (uuid)

      setActiveActor(`vport:${v.id}`);

      // 👉 route to vport inbox
      navigate(`/vport/notifications?actor=vport:${v.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Current Profile */}
      <Card className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white/90">Your Profile</div>
        </div>

        <button
          onClick={switchToProfile}
          disabled={busy}
          className={[
            'w-full text-left px-4 py-3 rounded-xl transition ring-offset-0',
            'border flex items-center justify-between',
            activeActor === 'profile'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-500'
              : 'bg-neutral-900/70 text-neutral-200 border-neutral-800 hover:bg-neutral-800',
            busy ? 'opacity-60 cursor-wait' : 'hover:ring-1 hover:ring-white/10'
          ].join(' ')}
        >
          <span className="font-medium tracking-wide">
            {busy && activeActor === 'profile'
              ? 'Switching…'
              : activeActor === 'profile'
              ? 'Current Profile'
              : 'Switch to My Profile'}
          </span>
          <span
            className={[
              'text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wide',
              activeActor === 'profile'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/70'
            ].join(' ')}
          >
            {activeActor === 'profile' ? 'Active' : 'Profile'}
          </span>
        </button>
      </Card>

      {/* Owned VPORTs + Create button */}
      <Card className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white/90">Your VPORTs</div>
          <button
            onClick={() => setShowCreator(true)}
            className="inline-flex items-center gap-2 text-xs md:text-sm px-3 py-1.5 rounded-lg border bg-neutral-900/80 text-neutral-100 border-neutral-800 hover:bg-neutral-800 hover:ring-1 hover:ring-white/10 transition"
          >
            <Plus className="w-4 h-4" />
            Create VPORT
          </button>
        </div>

        {!items.length ? (
          <div className="text-sm text-neutral-400 bg-neutral-900/60 border border-neutral-800 rounded-xl px-4 py-3">
            You don’t own any yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {items.map((v) => {
              const isActive = activeActor === `vport:${v.id}`;
              return (
                <li
                  key={v.id}
                  className="group flex items-center justify-between rounded-xl border px-3 py-2.5 bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={v.avatar_url || '/avatar.jpg'}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover border border-neutral-700/70"
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{v.name}</div>
                      <div className="text-[11px] text-white/50 truncate">
                        {/* you can put v.slug or stats here */}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => switchToVport(v)}
                    disabled={busy}
                    className={[
                      'text-xs md:text-sm px-3 py-1.5 rounded-lg border transition whitespace-nowrap',
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-500'
                        : 'bg-neutral-900/80 text-neutral-200 border-neutral-800 hover:bg-neutral-800',
                      busy ? 'opacity-60 cursor-wait' : 'hover:ring-1 hover:ring-white/10'
                    ].join(' ')}
                  >
                    {busy && isActive ? 'Switching…' : isActive ? 'Current' : 'Switch'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Sponsored: OneMoreDays */}
      <Card className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/90">Sponsored</div>
              <h2 className="text-lg font-semibold tracking-tight mt-1">OneMoreDays</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Jump over to <span className="text-neutral-200">onemoredays.com</span> — explore and come back anytime.
              </p>
            </div>

            <button
              onClick={() => visit(omdUrl)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-neutral-900/80 text-neutral-100 border-neutral-800 hover:bg-neutral-800 hover:ring-1 hover:ring-white/10 transition text-sm whitespace-nowrap"
              aria-label="Open onemoredays.com"
            >
              Visit site
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Optional inline preview; remove if you prefer just a link */}
          <div className="mt-4 rounded-xl overflow-hidden border border-neutral-800 bg-black/40">
            <iframe
              title="onemoredays.com"
              src={omdUrl}
              className="w-full h-[420px] bg-black"
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>

          <div className="mt-3 text-xs text-neutral-500">
            The preview is embedded for convenience. For the best experience, use the “Visit site” button above.
          </div>
        </div>
      </Card>

      {/* Modal: Create VPORT */}
      {showCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCreator(false)}
          />
          <div className="relative w-full max-w-[560px] rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <div className="text-sm font-semibold text-white/90">Create a VPORT</div>
              <button
                onClick={() => setShowCreator(false)}
                className="p-1.5 rounded-md hover:bg-white/5 text-white/70 hover:text-white transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <CreateVportForm
                onCreated={() => {
                  setBusy(true);
                  listMyVports()
                    .then(setItems)
                    .catch((e) => console.error('refresh vports failed', e))
                    .finally(() => setBusy(false));
                  setShowCreator(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

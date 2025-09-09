// src/features/settings/VportsTab.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { db } from '@/data/data';
// Use the clean, title-less form in the modal:
import CreateVportForm from '@/Vport/CreateVportForm.jsx';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Plus, X } from 'lucide-react';

export default function VportsTab() {
  const { user } = useAuth() || {};
  const [items, setItems] = useState([]);
  const [activeActor, setActiveActor] = useState(null); // 'profile' | `vport:${id}`
  const [busy, setBusy] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const navigate = useNavigate();

  // notify app-wide (actor picker)
  const broadcastActor = (detail) => {
    try {
      window.dispatchEvent(new CustomEvent('actor:changed', { detail }));
      localStorage.setItem('actor_touch', String(Date.now()));
    } catch {}
  };

  useEffect(() => {
    (async () => {
      const list = await db.profiles.vports.listOwnedByMe();
      setItems(list ?? []);
    })();

    const kind = localStorage.getItem('actor_kind');
    const vid  = localStorage.getItem('actor_vport_id');
    setActiveActor(kind === 'vport' && vid ? `vport:${vid}` : 'profile');

    const onChanged = (e) => {
      const a = e.detail;
      if (!a || a.kind === 'profile') setActiveActor('profile');
      else setActiveActor(`vport:${a.id}`);
    };
    const onStorage = () => {
      const k = localStorage.getItem('actor_kind');
      const id = localStorage.getItem('actor_vport_id');
      setActiveActor(k === 'vport' && id ? `vport:${id}` : 'profile');
    };
    window.addEventListener('actor:changed', onChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('actor:changed', onChanged);
      window.removeEventListener('storage', onStorage);
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
      if (db?.session?.setActor) {
        await db.session.setActor({ kind: 'profile', id: meId });
      }
      localStorage.setItem('actor_kind', 'profile');
      localStorage.removeItem('actor_vport_id');
      setActiveActor('profile');
      broadcastActor({ kind: 'profile', id: meId });
      navigate(`/inbox?actor=profile:${meId}&tab=notifications`);
    } finally {
      setBusy(false);
    }
  };

  const switchToVport = async (v) => {
    setBusy(true);
    try {
      if (db?.session?.setActor) {
        await db.session.setActor({ kind: 'vport', id: v.id });
      }
      localStorage.setItem('actor_kind', 'vport');
      localStorage.setItem('actor_vport_id', String(v.id));
      setActiveActor(`vport:${v.id}`);
      broadcastActor({ kind: 'vport', id: v.id });
      navigate(`/inbox?actor=vport:${v.id}&tab=notifications`);
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
                      <div className="text-[11px] text-white/50 truncate">VPORT</div>
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

      {/* Modal: Create VPORT (uses CreateVportForm with no internal title) */}
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
              <CreateVportForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

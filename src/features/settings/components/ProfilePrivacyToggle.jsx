import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/data/data';

export default function ProfilePrivacyToggle() {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false); // false=public, true=private
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) { setLoaded(true); return; }
      try {
        const me = await db.profiles.users.getById(user.id);
        if (!cancelled) {
          setChecked(Boolean(me?.private));
          setLoaded(true);
        }
      } catch {
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const save = async (next) => {
    if (!user?.id) return;
    setBusy(true);
    try {
      if (typeof db.profiles.setPrivacy === 'function') {
        await db.profiles.setPrivacy({ userId: user.id, isPrivate: next });
      } else {
        // fallback: update directly via users.update
        await db.profiles.users.update(user.id, { private: next });
      }
    } catch (e) {
      // revert on error
      setChecked((v) => !v);
      alert(e?.message || 'Failed to update privacy.');
    } finally {
      setBusy(false);
    }
  };

  const onChange = () => {
    const next = !checked;
    setChecked(next);
    save(next);
  };

  return (
    <label className="inline-flex items-center gap-2 select-none">
      <span className="text-sm text-zinc-300">{checked ? 'Private' : 'Public'}</span>
      <button
        type="button"
        onClick={onChange}
        disabled={!loaded || busy}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? 'bg-violet-600' : 'bg-zinc-700'
        } ${(!loaded || busy) ? 'opacity-60' : ''}`}
        aria-pressed={checked}
        aria-label="Toggle profile privacy"
        title={checked ? 'Private' : 'Public'}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

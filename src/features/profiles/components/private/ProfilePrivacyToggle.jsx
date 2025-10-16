// src/features/profiles/components/private/ProfilePrivacyToggle.jsx
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePrivacyToggle() {
  const { user } = useAuth();
  const [value, setValue] = useState(false);   // false=Public, true=Private
  const [loaded, setLoaded] = useState(false); // internal only; no UI "Loading…"
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) { setLoaded(true); return; }
    setErr('');
    try {
      const { data, error } = await supabase
        .from('profiles')         // public.profiles
        .select('private')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setValue(Boolean(data?.private));
    } catch (e) {
      setErr(e.message || 'Failed to load privacy.');
    } finally {
      setLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onToggle = async () => {
    if (!user?.id || saving || !loaded) return;
    const next = !value;

    // optimistic
    setValue(next);
    setSaving(true);
    setErr('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ private: next })
        .eq('id', user.id);
      if (error) throw error;
    } catch (e) {
      // rollback
      setValue(!next);
      setErr(e.message || 'Failed to update privacy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Toggle */}
      <button
        type="button"
        onClick={onToggle}
        disabled={saving || !loaded || !user?.id}
        className={[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          value ? 'bg-purple-600' : 'bg-zinc-800', // ✅ purple filler when ON
          (saving || !loaded) ? 'opacity-70 cursor-wait' : 'hover:bg-zinc-700'
        ].join(' ')}
        aria-pressed={value}
        aria-label="Toggle profile privacy"
        title={value ? 'Private' : 'Public'}
      >
        <span
          className={[
            'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
            value ? 'translate-x-5' : 'translate-x-1'
          ].join(' ')}
        />
      </button>

      {/* Text (no Loading… state shown) */}
      <div className="text-sm">
        <div className="text-zinc-200">{value ? 'Private' : 'Public'}</div>
        <div className="text-xs text-zinc-400">
          {value
            ? 'Only approved followers can view your activity.'
            : 'Anyone can view your profile.'}
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
            <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
            Saving…
          </div>
        )}
        {err && <div className="text-xs text-amber-300 mt-1">{err}</div>}
      </div>
    </div>
  );
}

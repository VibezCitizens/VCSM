// src/features/profiles/components/private/ProfilePrivacyToggle.jsx
import { useEffect, useMemo, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { vc } from '@/lib/vcClient';
import { useIdentity } from '@/state/identityContext';

export default function ProfilePrivacyToggle({ scope: propScope, userId: propUserId, vportId: propVportId }) {
  const { identity } = useIdentity();

  // Resolve scope + ids
  const scope = useMemo(() => propScope || (identity?.type === 'vport' ? 'vport' : 'user'), [propScope, identity?.type]);
  const userId  = useMemo(() => propUserId  || identity?.userId  || identity?.profileId || null, [propUserId, identity]);
  const vportId = useMemo(() => propVportId || identity?.vportId || null, [propVportId, identity]);

  const [value, setValue] = useState(null); // null = loading
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Load current flag (READ ONLY — no writes on mount)
  useEffect(() => {
    let alive = true;
    (async () => {
      setErr('');
      setValue(null);
      try {
        if (scope === 'vport') {
          if (!vportId) { if (alive) setValue(false); return; }
          const { data, error } = await vc.from('vports').select('id, is_private').eq('id', vportId).maybeSingle();
          if (error) throw error;
          if (alive) setValue(!!data?.is_private);
        } else {
          if (!userId) { if (alive) setValue(false); return; }
          const { data, error } = await supabase.from('profiles').select('id, private').eq('id', userId).maybeSingle();
          if (error) throw error;
          if (alive) setValue(!!data?.private);
        }
      } catch (e) {
        if (alive) { setErr(e.message || 'Failed to load privacy'); setValue(false); }
      }
    })();
    return () => { alive = false; };
  }, [scope, userId, vportId]);

  async function onToggle() {
    if (value == null) return;
    setSaving(true);
    setErr('');
    try {
      const next = !value;
      if (scope === 'vport') {
        const { error } = await vc.from('vports').update({ is_private: next }).eq('id', vportId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').update({ private: next }).eq('id', userId);
        if (error) throw error;
      }
      setValue(next);
    } catch (e) {
      setErr(e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  const label = value == null ? 'Loading…' : value ? 'Private' : 'Public';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggle}
        disabled={value == null || saving}
        className="px-3 py-2 rounded-lg bg-zinc-800 text-white disabled:opacity-50 text-sm"
      >
        {saving ? 'Saving…' : `Make ${value ? 'Public' : 'Private'}`}
      </button>
      <span className="text-xs text-zinc-400">{label}</span>
      {err && <span className="text-xs text-amber-300">{err}</span>}
    </div>
  );
}

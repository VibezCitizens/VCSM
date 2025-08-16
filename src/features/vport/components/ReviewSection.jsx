import React from 'react';
import { Loader2, Send, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Section from './Section';
import { DEFAULT_USER_AVATAR } from '../constants';

function StarsRead({ value = 0, size = 18 }) {
  const full = Math.round(value);
  return (
    <div className="inline-flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < full ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'} />
      ))}
    </div>
  );
}
function StarsInput({ value, setValue, disabled }) {
  return (
    <div className="inline-flex items-center">
      {Array.from({ length: 5 }).map((_, i) => {
        const val = i + 1;
        const active = val <= (value || 0);
        return (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && setValue(val)}
            disabled={disabled}
            className="p-1"
            title={`Rate ${val} star${val > 1 ? 's' : ''}`}
          >
            <Star size={20} className={active ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600 hover:text-zinc-300'} />
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewSection({ vportId, user }) {
  // agg + recent carousel
  const [agg, setAgg] = React.useState({ enabled: false, avg: 0, count: 0 });
  const [recent, setRecent] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  // form state
  const [formOpen, setFormOpen] = React.useState(false);
  const [myReview, setMyReview] = React.useState({ rating: 0, body: '' });
  const [saving, setSaving] = React.useState(false);
  const [saveErr, setSaveErr] = React.useState(null);
  const [meProfile, setMeProfile] = React.useState(null);

  const loadReviews = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vport_reviews')
        .select('user_id, rating, body, created_at')
        .eq('vport_id', vportId);
      if (error) throw error;

      const count = data?.length || 0;
      const avg = count ? data.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
      setAgg({ enabled: true, avg, count });

      const userIds = Array.from(new Set((data || []).map(r => r.user_id).filter(Boolean)));
      let profilesMap = {};
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, display_name, username, photo_url')
          .in('id', userIds);
        profilesMap = Object.fromEntries((profs || []).map(p => [p.id, p]));
      }

      const withProfiles = (data || []).map(r => ({ ...r, profile: profilesMap[r.user_id] || null }));
      const recent10 = withProfiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
      setRecent(recent10);
      setIdx(0);
    } catch {
      setAgg({ enabled: false, avg: 0, count: 0 });
      setRecent([]);
      setIdx(0);
    }
  }, [vportId]);

  React.useEffect(() => { loadReviews(); }, [loadReviews]);

  React.useEffect(() => {
    if (paused || recent.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % recent.length), 4000);
    return () => clearInterval(t);
  }, [recent.length, paused]);

  const toggleForm = async () => {
    setSaveErr(null);
    setFormOpen((open) => {
      const next = !open;
      if (next) setMyReview({ rating: 0, body: '' });
      return next;
    });
    if (user?.id && !meProfile) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, username, photo_url')
        .eq('id', user.id)
        .maybeSingle();
      setMeProfile(data || null);
    }
  };

  async function submitReview(e) {
    e.preventDefault();
    setSaveErr(null);
    if (!user?.id) return; // parent already routes unauthenticated users on actions
    if (!myReview.rating) {
      setSaveErr('Please select a star rating.');
      return;
    }
    setSaving(true);
    try {
      const { error: insErr } = await supabase
        .from('vport_reviews')
        .insert({ vport_id: vportId, user_id: user.id, rating: myReview.rating, body: myReview.body || null });
      if (insErr) throw insErr;

      await loadReviews();
      setFormOpen(false);
      setMyReview({ rating: 0, body: '' });
    } catch (err) {
      setSaveErr(err.message || 'Failed to save review.');
    } finally {
      setSaving(false);
    }
  }

  if (!agg.enabled) {
    return (
      <Section title="Customer Reviews" className="p-3">
        <div className="text-zinc-400 text-sm">No reviews yet.</div>
      </Section>
    );
  }

  return (
    <Section title="Customer Reviews" className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <StarsRead value={agg.avg} />
          <span className="text-zinc-400 text-sm">
            {agg.avg.toFixed(1)} / 5 • {agg.count} {agg.count === 1 ? 'review' : 'reviews'}
          </span>
        </div>
        <button
          onClick={toggleForm}
          className="rounded-lg px-3 py-1.5 bg-zinc-800 text-white hover:bg-zinc-700 transition text-sm"
        >
          {formOpen ? 'Cancel' : 'Leave a Review'}
        </button>
      </div>

      <div
        className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 min-h-[92px] relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {recent.length === 0 ? (
          <div className="text-zinc-400 text-sm">No reviews yet.</div>
        ) : (
          <div key={idx} className="transition-opacity duration-300">
            <div className="flex items-center gap-2">
              <img
                src={recent[idx]?.profile?.photo_url || DEFAULT_USER_AVATAR}
                alt=""
                className="w-7 h-7 rounded-full object-cover bg-zinc-800"
              />
              <div className="text-sm text-zinc-300">
                {recent[idx]?.profile?.display_name || recent[idx]?.profile?.username || 'User'}
              </div>
              <div className="ml-auto text-[11px] text-zinc-500">
                {new Date(recent[idx].created_at).toLocaleString()}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <StarsRead value={recent[idx]?.rating || 0} />
            </div>
            {recent[idx]?.body && (
              <p className="text-zinc-200 mt-2 whitespace-pre-wrap text-sm">{recent[idx].body}</p>
            )}
            {recent.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setIdx((i) => (i - 1 + recent.length) % recent.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-sm"
                  aria-label="Previous review"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setIdx((i) => (i + 1) % recent.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-sm"
                  aria-label="Next review"
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {formOpen && (
        <form onSubmit={submitReview} className="mt-3 space-y-2">
          {user?.id && (
            <div className="flex items-center gap-2">
              <img
                src={(meProfile?.photo_url) || DEFAULT_USER_AVATAR}
                alt=""
                className="w-7 h-7 rounded-full object-cover bg-zinc-800"
              />
              <div className="text-sm text-zinc-400">
                Reviewing as {meProfile?.display_name || meProfile?.username || 'you'}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <StarsInput
              value={myReview.rating}
              setValue={(val) => setMyReview((r) => ({ ...r, rating: val }))}
              disabled={saving}
            />
            <span className="text-zinc-400 text-sm">
              {myReview.rating ? `${myReview.rating}/5` : 'Select stars'}
            </span>
          </div>
          <textarea
            rows={3}
            value={myReview.body}
            onChange={(e) => setMyReview((r) => ({ ...r, body: e.target.value }))}
            placeholder="Share details (optional)…"
            className="w-full bg-zinc-800/70 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm"
            disabled={saving}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !myReview.rating}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white text-black hover:opacity-90 transition text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              {saving ? 'Saving…' : 'Submit review'}
            </button>
            {saveErr && <span className="text-red-400 text-sm">{saveErr}</span>}
          </div>
        </form>
      )}
    </Section>
  );
}

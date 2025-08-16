import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/** tiny star selector */
function StarInput({ value, onChange, disabled }) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1,2,3,4,5].map((n) => {
        const active = value >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(n)}
            className="p-0.5"
            title={`${n} star${n>1?'s':''}`}
            aria-label={`${n} star${n>1?'s':''}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path
                d="M12 .587l3.668 7.431 8.204 1.193-5.936 5.788 1.402 8.168L12 18.896l-7.338 3.871 1.402-8.168L.128 9.211l8.204-1.193L12 .587z"
                className={active ? 'text-yellow-400' : 'text-zinc-700'}
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewForm({ vportId, userId: userIdProp, onSubmitted }) {
  const [userId, setUserId] = useState(userIdProp ?? null);

  // my existing review (if any)
  const [existing, setExisting] = useState(null);

  // form
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'err'|'ok', msg:string}

  useEffect(() => {
    (async () => {
      if (!userIdProp) {
        const { data } = await supabase.auth.getUser();
        setUserId(data?.user?.id ?? null);
      }
    })();
  }, [userIdProp]);

  // load existing review to prefill
  useEffect(() => {
    if (!vportId || !userId) return;
    (async () => {
      const { data, error } = await supabase
        .from('vport_reviews')
        .select('id, rating, body, created_at')
        .eq('vport_id', vportId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setExisting(data);
        setRating(Number(data.rating) || 0);
        setBody(data.body ?? '');
      } else {
        setExisting(null);
        setRating(0);
        setBody('');
      }
    })();
  }, [vportId, userId]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!userId) {
      setMsg({ type: 'err', msg: 'Please sign in to leave a review.' });
      return;
    }

    const r = Number(rating);
    if (!r || r < 1 || r > 5) {
      setMsg({ type: 'err', msg: 'Please select a rating (1–5).' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vport_id: vportId,
        user_id: userId,
        rating: r,
        body: body?.trim() || null,
      };

      // one-review-per-user-per-vport (needs unique idx on (vport_id,user_id), which you have)
      const { error } = await supabase
        .from('vport_reviews')
        .upsert([payload], { onConflict: 'vport_id,user_id' });

      if (error) throw error;

      setMsg({ type: 'ok', msg: existing ? 'Your review was updated.' : 'Thanks! Your review was posted.' });
      onSubmitted?.();
    } catch (err) {
      // if db throws unique error, treat as update advice
      const message = err?.message || 'Could not submit right now. Please try again.';
      setMsg({ type: 'err', msg: message });
    } finally {
      setSaving(false);
    }
  }

  const ctl =
    'block w-full min-w-0 box-border rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white ' +
    'placeholder-white/40 outline-none focus:border-red-500';

  return (
    <form onSubmit={onSubmit} className="rounded-xl ring-1 ring-white/10 bg-white/5 p-4 md:p-5 text-white">
      <h4 className="font-semibold text-red-500 mb-3">{existing ? 'Edit Your Review' : 'Leave a Review'}</h4>

      {/* rating */}
      <div className="flex items-center gap-3">
        <label className="text-xs opacity-80">Rating</label>
        <StarInput value={rating} onChange={setRating} disabled={saving} />
        <span className="text-xs opacity-70">{rating ? `${rating}/5` : 'Select rating'}</span>
      </div>

      {/* text */}
      <div className="mt-3 flex flex-col">
        <label htmlFor="text" className="text-xs opacity-80">Your review <span className="opacity-60">(optional)</span></label>
        <textarea
          id="text"
          rows={4}
          className={ctl}
          placeholder="Tell us about your experience…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={saving}
        />
      </div>

      {/* actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition shadow disabled:opacity-60"
        >
          {saving ? 'Saving…' : existing ? 'Update Review' : 'Post Review'}
        </button>
        {msg && (
          <div className={`text-sm ${msg.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>
            {msg.msg}
          </div>
        )}
      </div>
    </form>
  );
}

// src/Vport/CreateVportForm.js
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';

const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const TYPE_OPTIONS = [
  'creator',
  'artist',
  'public figure',
  'athlete',
  'driver',
  'business',
  'organization',
  'other',
];

function cx(...xs) { return xs.filter(Boolean).join(' '); }

export default function CreateVportForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { identity } = useIdentity(); // available if you want to auto-switch later

  const [name, setName] = useState('');
  const [type, setType] = useState('business');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!avatarFile) { setAvatarPreview(''); return; }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const canSubmit = !!(user?.id && name.trim() && type);

  async function handlePickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large (max 5MB).');
      return;
    }
    setError('');
    setAvatarFile(file);
  }

  async function uploadAvatar() {
    if (!avatarFile) return '';
    const fd = new FormData();
    fd.append('file', avatarFile);
    fd.append('folder', `vports/${user.id}`);
    const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const json = await res.json();
    if (!json?.url) throw new Error('Upload response missing URL');
    return json.url;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      let finalAvatarUrl = avatarUrl;
      if (!finalAvatarUrl && avatarFile) {
        finalAvatarUrl = await uploadAvatar();
        setAvatarUrl(finalAvatarUrl);
      }

      const { data, error: insertErr } = await supabase
        .from('vports')
        .insert({
          created_by: user.id,              // << matches your schema
          name: name.trim(),
          type: String(type).toLowerCase(), // << satisfy lower(type) CHECK
          avatar_url: finalAvatarUrl || null,
          description: description.trim() || null,
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      // Make current user the owner in vport_managers (non-fatal if it fails)
      await supabase
        .from('vport_managers')
        .insert({ vport_id: data.id, user_id: user.id, role: 'owner' })
        .select('vport_id')
        .single()
        .catch(() => null);

      navigate(`/vport/${data.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create Vport.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white px-4 py-6">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-1">Create a Vport</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Set a name, type, and avatar. You can change details later.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Joseline’s Trucking"
              className="w-full rounded-xl bg-white border border-zinc-300 text-black px-3 py-2 outline-none focus:ring-2 focus:ring-violet-600"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              cclassName="w-full rounded-xl bg-white border border-zinc-300 text-black px-3 py-2 outline-none focus:ring-2 focus:ring-violet-600"
              required
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <div className="text-xs text-zinc-500 mt-1">
              Must be one of: {TYPE_OPTIONS.join(', ')}.
            </div>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Avatar</label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-zinc-900 overflow-hidden flex items-center justify-center">
                {avatarPreview || avatarUrl ? (
                  <img
                    src={avatarPreview || avatarUrl}
                    alt="avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-7 w-7 text-zinc-500">
                    <path
                      fill="currentColor"
                      d="M12 12a5 5 0 100-10 5 5 0 000 10Zm-7 9a7 7 0 0114 0v1H5v-1Z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePickFile}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
                >
                  Choose image
                </button>
                {avatarFile || avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => { setAvatarFile(null); setAvatarUrl(''); }}
                    className="rounded-xl bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
                  >
                    Remove
                  </button>
                ) : null}
                <span className="text-xs text-zinc-500">PNG/JPG up to 5MB.</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-zinc-300 mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell people what this Vport is about…"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-600"
            />
            <div className="text-xs text-zinc-500 mt-1">Max ~500 characters recommended.</div>
          </div>

          {/* Errors */}
          {error ? (
            <div className="rounded-xl bg-red-950 border border-red-900 text-red-200 px-3 py-2 text-sm">
              {error}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={cx(
                'rounded-xl px-5 py-2.5 font-semibold transition-colors',
                canSubmit && !submitting ? 'bg-violet-600 hover:bg-violet-700' : 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
              )}
            >
              {submitting ? 'Creating…' : 'Create Vport'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl bg-zinc-800 px-4 py-2.5 hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>

          <div className="text-xs text-zinc-500">
            Owner: <span className="text-zinc-300">{user?.email}</span>
          </div>
        </form>
      </div>
    </div>
  );
}

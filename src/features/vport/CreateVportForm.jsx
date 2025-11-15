// src/features/vport/CreateVportForm.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { createVport } from '@/data/vport/vprofile/vport'; // <-- use RPC wrapper

const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// Grouped and alphabetized type taxonomy (UI only)
const TYPE_GROUPS = {
  'Arts, Media & Entertainment': [
    'artist',
    'creator',
    'dj',
    'event planner',
    'musician',
    'photographer',
    'public figure',
    'videographer',
  ],

  'Beauty & Wellness': [
    'barber',
    'esthetician',
    'fitness instructor',
    'hairstylist',
    'makeup artist',
    'massage therapist',
    'nail technician',
    'yoga instructor',
  ],

  'Education & Care': [
    'babysitter',
    'caregiver',
    'counselor',
    'elder care',
    'nanny',
    'teacher',
    'therapist',
    'tutor',
  ],

  'Food, Hospitality & Events': [
    'baker',
    'bartender',
    'caterer',
    'chef',
    'cook',
    'restaurant',
    'server',
  ],

  'Health & Medical': [
    'chiropractor',
    'dentist',
    'doctor',
    'nurse',
    'nutritionist',
  ],

  'Home, Maintenance & Trades': [
    'carpenter',
    'cleaning service',
    'contractor',
    'electrician',
    'gardener',
    'handyman',
    'landscaper',
    'mechanic',
    'painter',
    'plumber',
  ],

  'Professional & Business Services': [
    'accountant',
    'bookkeeper',
    'business',
    'consultant',
    'designer',
    'developer',
    'engineer',
    'lawyer',
    'marketer',
    'notary',
    'organization',
    'real estate',
  ],

  'Retail, Sales & Commerce': [
    'nonprofit',
    'shop',
    'vendor',
  ],

  'Sports & Fitness': [
    'athlete',
    'coach',
    'trainer',
  ],

  'Transport & Logistics': [
    'courier',
    'delivery',
    'driver',
    'mover',
    'rideshare',
    'towing',
    'truck driver',
  ],

  'Animal Care': [
    'dog walker',
    'pet sitter',
  ],

  Other: ['other'],
};

function cx(...xs) { return xs.filter(Boolean).join(' '); }

export default function CreateVportForm({ onCreated }) {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

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

      const normalizedType = String(type).toLowerCase();
      const allTypes = Object.values(TYPE_GROUPS).flat();
      if (!allTypes.includes(normalizedType)) {
        throw new Error('Invalid Vport type.');
      }

      const res = await createVport({
        name: name.trim(),
        slug: nullIfEmpty(slugifyMaybe(name)),
        avatarUrl: finalAvatarUrl || null,
        bio: (description || '').trim() || null,
        ownerUserId: user?.id ?? null,
      });

      if (onCreated) {
        onCreated(res);
      } else {
        navigate(`/vport/${res.vport_id}`);
      }

      setName('');
      setType('business');
      setAvatarFile(null);
      setAvatarPreview('');
      setAvatarUrl('');
      setDescription('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create Vport.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
          className="w-full rounded-xl bg-white border border-zinc-300 text-black px-3 py-2 outline-none focus:ring-2 focus:ring-violet-600"
          required
        >
          {Object.entries(TYPE_GROUPS).map(([groupName, types]) => (
            <optgroup key={groupName} label={groupName}>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
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
            {(avatarFile || avatarUrl) && (
              <button
                type="button"
                onClick={() => { setAvatarFile(null); setAvatarUrl(''); }}
                className="rounded-xl bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
              >
                Remove
              </button>
            )}
            <span className="text-xs text-zinc-500">PNG/JPG up to 5MB.</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-zinc-300 mb-1.5">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Tell people what this Vport is about…"
          className="w-full min-h-24 rounded-xl bg-white border border-zinc-300 text-black px-3 py-2 outline-none focus:ring-2 focus:ring-violet-600 placeholder-black/50"
        />
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
            canSubmit && !submitting
              ? 'bg-violet-600 hover:bg-violet-700'
              : 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
          )}
        >
          {submitting ? 'Creating…' : 'Create Vport'}
        </button>
      </div>
    </form>
  );
}

/* -------------------- local helpers -------------------- */
function nullIfEmpty(s) { return s && s.trim() ? s.trim() : null; }
function slugifyMaybe(name) {
  return name
    ?.toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

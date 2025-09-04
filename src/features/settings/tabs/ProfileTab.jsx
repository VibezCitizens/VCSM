// src/features/settings/tabs/ProfileTab.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/data/data';
import Card from '../components/Card';
import { uploadProfilePicture } from '@/features/chat/hooks/useProfileUploader';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export default function ProfileTab() {
  const { user } = useAuth();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  // fields
  const [username, setUsername]       = useState(''); // read-only
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [bio, setBio]                 = useState('');

  // avatar
  const [photoUrl, setPhotoUrl] = useState('');
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState('');
  const fileInputRef = useRef(null);

  // load profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const p = await db.profiles.users.getById(user.id);
        if (cancelled) return;
        setUsername(p?.username || '');
        setDisplayName(p?.display_name || '');
        setEmail(p?.email || user.email || '');
        setBio(p?.bio || '');
        setPhotoUrl(p?.photo_url || '');
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // preview lifecycle
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handlePickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type?.startsWith('image/')) {
      setErr('Please choose an image file.');
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setErr('Image is too large (max 5MB).');
      return;
    }
    setErr('');
    setFile(f);
  };

  const removePhoto = () => {
    setFile(null);
    setPreview('');
    setPhotoUrl('');
  };

  const onSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setErr('');
    try {
      // 1) upload new image if selected
      let finalUrl = photoUrl;
      if (file) {
        finalUrl = await uploadProfilePicture(file);
      }

      // 2) update profile (do NOT include username/email here)
      await db.profiles.users.update(user.id, {
        display_name: (displayName || '').trim(),
        bio: (bio || '').trim(),
        photo_url: finalUrl || null,
      });

      setPhotoUrl(finalUrl || '');
      setFile(null);
      setPreview('');
    } catch (e) {
      setErr(e?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const profilePath = username ? `/u/${username}` : (user?.id ? `/profile/${user.id}` : '#');

  return (
    <div className="space-y-4">
      <Card>
        {/* Top bar: title + View profile (white text, no underline, no icon) */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Profile</div>
          <Link
            to={profilePath}
            className="text-white no-underline hover:no-underline focus:no-underline active:no-underline visited:text-white hover:text-white active:text-white focus:text-white outline-none"
            aria-label="View my profile"
            title="View my profile"
          >
            View my profile
          </Link>
        </div>

        {/* Avatar row */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-300">Profile picture</label>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
              {(preview || photoUrl) ? (
                <img
                  src={preview || photoUrl}
                  alt="profile"
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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePickFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
                disabled={saving}
              >
                Choose image
              </button>
              {(file || photoUrl) && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
                  disabled={saving}
                >
                  Remove
                </button>
              )}
              <span className="text-[11px] text-zinc-500">PNG/JPG up to 5MB.</span>
            </div>
          </div>
        </div>

        {/* Username (locked) */}
        <div className="mt-4 space-y-1">
          <label className="text-xs text-zinc-400">Username</label>
          <div className="relative">
            <input
              value={username ? `@${username}` : '—'}
              disabled
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-2"
              readOnly
            />
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"
              title="Usernames are permanent"
              aria-hidden
            >
              🔒
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Usernames are permanent and can’t be changed.
          </p>
        </div>

        {/* Display name (editable) */}
        <div className="mt-3 space-y-1">
          <label className="text-xs text-zinc-300">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-white px-3 py-2"
            placeholder="Your name shown on your profile"
            disabled={saving}
          />
        </div>

        {/* Email (read-only) */}
        <div className="mt-3 space-y-1">
          <label className="text-xs text-zinc-400">Email</label>
          <input
            value={email}
            disabled
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-2"
            readOnly
          />
        </div>

        {/* Bio (editable) */}
        <div className="mt-3 space-y-1">
          <label className="text-xs text-zinc-300">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-white px-3 py-2 resize-y"
            placeholder="Tell people a bit about you…"
            disabled={saving}
          />
        </div>

        {err && (
          <div className="mt-3 rounded-lg bg-red-950/60 border border-red-900 text-red-200 px-3 py-2 text-sm">
            {err}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              saving ? 'bg-zinc-800 text-zinc-400' : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Card>
    </div>
  );
}

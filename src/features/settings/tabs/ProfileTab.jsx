// src/features/settings/tabs/ProfileTab.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import { db } from '@/data/data';
import Card from '../components/Card';
import { uploadProfilePicture } from '@/features/chat/hooks/useProfileUploader';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ProfileTab(props) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const { identity } = useIdentity(); // { type: 'vport'|'user', vportId?, userId? }

  const inferModeFromPath = () => {
    const segs = location.pathname.split('/').filter(Boolean);
    return segs.includes('vport') ? 'vport' : 'user';
  };

  const rawMode =
    props.mode ??
    ((identity?.type === 'vport') ? 'vport' : null) ??
    searchParams.get('mode') ??
    inferModeFromPath() ??
    'user';

  const mode = String(rawMode).toLowerCase() === 'vport' ? 'vport' : 'user';

  // Only pick vportId from params for vport mode; do NOT mix in actorId here.
  const pathVportId = params.vportId || null;
  const qpActorId = searchParams.get('actorId');

  // VPORT MODE precedence = route :vportId → identity.vportId → null (NEVER actorId)
  // USER MODE precedence = props.actorId → qpActorId → user.id
  const resolvedActorId =
    (mode === 'vport')
      ? (
          props.actorId ?? // if you explicitly pass a vport id via props, allow it
          pathVportId ??
          identity?.vportId ??
          null
        )
      : (
          props.actorId ??
          qpActorId ??
          (user?.id || null)
        );

  // --- DB adapter (db.vport is singular) ------------------------------------
  const vportApi = db?.vport || {};

  const vportGet =
    vportApi.getVport ||
    vportApi.get ||
    vportApi.fetch ||
    vportApi.getById ||
    vportApi.getVportById;

  const vportUpdate =
    vportApi.updateVport ||
    vportApi.update ||
    vportApi.patch;

  const getProfileBySubject = async (subjectId, subjectMode) => {
    if (subjectMode === 'vport') {
      if (!vportGet) throw new Error('vport.get function not found in db.vport');

      // Guard: ensure we are hitting by vc.vports.id UUID (not actor_id)
      if (!UUID_RX.test(subjectId)) {
        throw new Error('Invalid VPort id. Expected a vc.vports.id UUID.');
      }

      const row = await vportGet(subjectId);
      if (!row) throw new Error('VPort not found');
      return row; // { id, name, slug, avatar_url, banner_url, bio, ... }
    }
    return db.profiles.users.get(subjectId);
  };

  const updateProfileBySubject = async (subjectId, subjectMode, data) => {
    if (subjectMode === 'vport') {
      if (!vportUpdate) throw new Error('vport.update function not found in db.vport');

      // same guard here too
      if (!UUID_RX.test(subjectId)) {
        throw new Error('Invalid VPort id. Expected a vc.vports.id UUID.');
      }

      const payload = {
        ...(data.display_name ? { name: data.display_name } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.photo_url !== undefined ? { avatar_url: data.photo_url } : {}),
        ...(data.banner_url !== undefined ? { banner_url: data.banner_url } : {}),
      };
      return vportUpdate(subjectId, payload);
    }
    return db.profiles.users.update(subjectId, data);
  };
  // --------------------------------------------------------------------------

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  // fields
  const [username, setUsername]       = useState(''); // @username or @slug
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [bio, setBio]                 = useState('');

  // avatar
  const [photoUrl, setPhotoUrl] = useState('');
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState('');
  const fileInputRef = useRef(null);

  // banner
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const bannerInputRef = useRef(null);

  // quick visibility
  console.log('[ProfileTab] mode=', mode, 'resolvedActorId=', resolvedActorId, 'identity=', identity);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!resolvedActorId) {
        console.log('[ProfileTab] resolvedActorId is null; skip fetch');
        setLoading(false);
        return;
      }
      try {
        console.log('[ProfileTab] fetching profile', { id: resolvedActorId, mode });
        const p = await getProfileBySubject(resolvedActorId, mode);
        console.log('[ProfileTab] fetched profile:', p);
        if (cancelled) return;

        if (mode === 'vport') {
          setUsername(p?.slug || '');
          setDisplayName(p?.name || '');
          setEmail(user?.email || ''); // vports don’t have email
          setBio(p?.bio || '');
          setPhotoUrl(p?.avatar_url || '');
          setBannerUrl(p?.banner_url || '/default-banner.jpg');
        } else {
          setUsername(p?.username || '');
          setDisplayName(p?.display_name || '');
          setEmail(p?.email || user?.email || '');
          setBio(p?.bio || '');
          setPhotoUrl(p?.photo_url || '');
          setBannerUrl(p?.banner_url || '/default-banner.jpg');
        }
      } catch (e) {
        console.error('[ProfileTab] load error:', e);
        if (!cancelled) setErr(e?.message || 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [
    resolvedActorId,
    mode,
    user?.email,
    identity?.type,
    identity?.vportId,
  ]);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!bannerFile) { setBannerPreview(''); return; }
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

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

  const handlePickBanner = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type?.startsWith('image/')) {
      setErr('Please choose an image file for the banner.');
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setErr('Banner image is too large (max 5MB).');
      return;
    }
    setErr('');
    setBannerFile(f);
  };

  const removePhoto = () => {
    setFile(null);
    setPreview('');
    setPhotoUrl('');
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview('');
    setBannerUrl('/default-banner.jpg');
  };

  const uploadVportAvatar = async (blob) => {
    if (!resolvedActorId) throw new Error('Not authenticated');
    const key = `vports/${resolvedActorId}/avatar.jpg`;
    const { url, error } = await uploadToCloudflare(blob, key);
    if (error || !url) throw new Error('Avatar upload failed.');
    return url;
  };

  const uploadProfileBanner = async (blob) => {
    if (!resolvedActorId) throw new Error('Not authenticated');
    const key =
      mode === 'vport'
        ? `vports/${resolvedActorId}/banner.jpg`
        : `profile-banners/${resolvedActorId}.jpg`;
    const { url, error } = await uploadToCloudflare(blob, key);
    if (error || !url) throw new Error('Banner upload failed.');
    return url;
  };

  const onSave = async () => {
    if (!resolvedActorId) return;
    setSaving(true);
    setErr('');

    try {
      // preflight for vport mode (explicit visibility only)
      if (mode === 'vport') {
        console.log('[VPORT save] resolvedActorId=', resolvedActorId);

        // guard again
        if (!UUID_RX.test(resolvedActorId)) {
          setErr('Invalid VPort id. Expected a vc.vports.id UUID.');
          setSaving(false);
          return;
        }

        try {
          const row = await db.vport.getVportById(resolvedActorId);
          console.log('[VPORT save] loaded row:', row);
          if (!row?.id) {
            setErr('VPort not found. Make sure this id is vc.vports.id (not actor_id).');
            setSaving(false);
            return;
          }
          if (row.owner_user_id !== user?.id) {
            setErr('You do not own this VPort. Update blocked by RLS.');
            setSaving(false);
            return;
          }
        } catch (preErr) {
          console.error('[VPORT save] preflight error:', preErr);
          setErr(preErr?.message || 'Could not load VPort (RLS or wrong id).');
          setSaving(false);
          return;
        }
      }

      // avatar
      let finalAvatarUrl = photoUrl;
      if (file) {
        finalAvatarUrl =
          mode === 'vport'
            ? await uploadVportAvatar(file)
            : await uploadProfilePicture(file);
      }

      // banner
      let finalBannerUrl = bannerUrl || null;
      if (bannerFile) {
        finalBannerUrl = await uploadProfileBanner(bannerFile);
      }

      const payload = {
        display_name: (displayName || '').trim(), // maps to name for vport
        bio: (bio || '').trim(),
        photo_url: finalAvatarUrl || null,
        banner_url: finalBannerUrl || null,
      };

      console.log('[SAVE] mode', mode, 'payload', payload);

      const updated = await updateProfileBySubject(resolvedActorId, mode, payload);
      console.log('[SAVE] updated row', updated);

      // reset local state
      setPhotoUrl(finalAvatarUrl || '');
      setFile(null);
      setPreview('');
      setBannerUrl(finalBannerUrl || '/default-banner.jpg');
      setBannerFile(null);
      setBannerPreview('');
    } catch (e) {
      console.error('[SAVE] error', e);
      setErr(e?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const profilePath =
    mode === 'vport'
      ? (resolvedActorId ? `/vport/${resolvedActorId}` : '#')
      : (user ? '/me' : '#');

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">
            {mode === 'vport' ? 'VPort Profile' : 'Profile'}
          </div>
          <Link
            to={profilePath}
            className="text-white no-underline hover:no-underline focus:no-underline active:no-underline visited:text-white hover:text-white active:text-white focus:text-white outline-none"
            aria-label="View profile"
            title="View profile"
          >
            View {mode === 'vport' ? 'VPort' : 'my'} profile
          </Link>
        </div>

        {/* Banner */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-300">
            {mode === 'vport' ? 'VPort banner' : 'Profile banner'}
          </label>
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
            <div className="relative w-full h-32 sm:h-40 md:h-48">
              <img
                src={bannerPreview || bannerUrl || '/default-banner.jpg'}
                alt="profile banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handlePickBanner}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
              disabled={saving}
            >
              Choose banner
            </button>
            {(bannerFile || bannerUrl) && (
              <button
                type="button"
                onClick={removeBanner}
                className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
                disabled={saving}
              >
                Remove
              </button>
            )}
            <span className="text-[11px] text-zinc-500">
              Wide image works best (e.g. 1600×500). PNG/JPG up to 5MB.
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div className="mt-4 space-y-1">
          <label className="text-xs text-zinc-300">
            {mode === 'vport' ? 'VPort picture' : 'Profile picture'}
          </label>
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

        {/* Display name */}
        <div className="mt-3 space-y-1">
          <label className="text-xs text-zinc-300">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-white px-3 py-2"
            placeholder={mode === 'vport' ? 'VPort name' : 'Your name shown on your profile'}
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

        {/* Bio/About */}
        <div className="mt-3 space-y-1">
          <label className="text-xs text-zinc-300">{mode === 'vport' ? 'About' : 'Bio'}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-white px-3 py-2 resize-y"
            placeholder={mode === 'vport' ? 'Tell people about this VPort…' : 'Tell people a bit about you…'}
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
              saving ? 'bg-zinc-800 text-zinc-400' : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Card>
    </div>
  );
}

// src/features/vport/VPortEdit.jsx
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import VPortForm from './VPortForm';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';

const DEFAULT_VPORT_AVATAR = '/icon/vport-default-192.png';

// keep original file extension when uploading
function extOf(file) {
  const n = (file?.name || '').toLowerCase();
  const dot = n.lastIndexOf('.');
  return dot !== -1 ? n.slice(dot + 1) : 'jpg';
}

export default function VPortEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = React.useState({
    loading: true,
    error: null,
    v: null,
  });

  const [savingDetails, setSavingDetails] = React.useState(false);
  const [saveErr, setSaveErr] = React.useState('');

  // photo state
  const [avatarFile, setAvatarFile] = React.useState(null);
  const [bannerFile, setBannerFile] = React.useState(null);
  const [savingPhotos, setSavingPhotos] = React.useState(false);
  const [photosErr, setPhotosErr] = React.useState('');

  // delete state
  const [deleting, setDeleting] = React.useState(false);
  const [deleteErr, setDeleteErr] = React.useState('');

  // load vport
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('vports')
          .select(`
            id, name, type, phone, website, description,
            address, city, region, country,
            created_by, avatar_url, banner_url
          `)
          .eq('id', id)
          .single();
        if (error) throw error;
        if (mounted) setState({ loading: false, error: null, v: data });
      } catch (err) {
        if (mounted) setState({ loading: false, error: err.message || 'Failed to load VPort', v: null });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const canEdit = Boolean(user?.id) && state.v && user.id === state.v.created_by;

  async function handleDetailsSubmit(payload) {
    if (!canEdit) return;
    setSaveErr('');
    setSavingDetails(true);
    try {
      const { error } = await supabase
        .from('vports')
        .update({
          name: payload.name,
          type: payload.type,
          phone: payload.phone || null,
          website: payload.website || null,
          description: payload.description || null,
          address: payload.address || null,
          city: payload.city || null,
          region: payload.region || null,
          country: payload.country || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      // Reload values and go back to detail
      const { data } = await supabase
        .from('vports')
        .select('id, name, type, phone, website, description, address, city, region, country, created_by, avatar_url, banner_url')
        .eq('id', id)
        .single();

      setState((s) => ({ ...s, v: data }));
      navigate(`/vports/${id}`, { replace: true });
    } catch (e) {
      setSaveErr(e.message || 'Failed to save');
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleSavePhotos() {
    if (!canEdit) return;
    setPhotosErr('');
    setSavingPhotos(true);
    try {
      let avatar_url = state.v.avatar_url || null;
      let banner_url = state.v.banner_url || null;

      if (avatarFile) {
        const ext = extOf(avatarFile);
        const key = `vports/${id}/avatar/${id}_${Date.now()}.${ext}`;
        const { url, error } = await uploadToCloudflare(avatarFile, key);
        if (error) throw new Error(error);
        avatar_url = url;
      }
      if (bannerFile) {
        const ext = extOf(bannerFile);
        const key = `vports/${id}/banner/${id}_${Date.now()}.${ext}`;
        const { url, error } = await uploadToCloudflare(bannerFile, key);
        if (error) throw new Error(error);
        banner_url = url;
      }

      if (avatarFile || bannerFile) {
        const { error: upErr } = await supabase
          .from('vports')
          .update({ avatar_url, banner_url, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (upErr) throw upErr;

        setState((s) => ({ ...s, v: { ...s.v, avatar_url, banner_url } }));
        setAvatarFile(null);
        setBannerFile(null);

        // close editor after success
        navigate(`/vports/${id}`, { replace: true });
      }
    } catch (e) {
      setPhotosErr(e.message || 'Failed to save photos');
    } finally {
      setSavingPhotos(false);
    }
  }

  // Client-side "cascade" delete so FK constraints don't block the vport delete.
  async function handleDelete() {
    if (!canEdit || deleting) return;
    setDeleteErr('');

    const ok = window.confirm(
      'Delete this VPort permanently?\n\nThis will remove posts, reactions, comments, reviews, photos, hours, and claims. This cannot be undone.'
    );
    if (!ok) return;

    setDeleting(true);
    try {
      // 1) fetch post ids
      const { data: posts, error: postsErr } = await supabase
        .from('vport_posts')
        .select('id')
        .eq('vport_id', id);
      if (postsErr) throw postsErr;
      const postIds = (posts || []).map((p) => p.id);

      // 2) delete child rows that depend on posts first
      if (postIds.length) {
        await supabase.from('vport_post_comments').delete().in('vport_post_id', postIds);
        await supabase.from('vport_post_reactions').delete().in('post_id', postIds);
        await supabase.from('vport_posts').delete().in('id', postIds);
      }

      // 3) delete other direct children
      await supabase.from('vport_reviews').delete().eq('vport_id', id);
      await supabase.from('vport_photos').delete().eq('vport_id', id);
      await supabase.from('vport_hours').delete().eq('vport_id', id);
      await supabase.from('vport_claims').delete().eq('vport_id', id);

      // 4) finally, delete vport
      const { error: delErr } = await supabase.from('vports').delete().eq('id', id);
      if (delErr) throw delErr;

      // 5) back to list
      navigate('/vports', { replace: true });
    } catch (e) {
      setDeleteErr(e.message || 'Delete failed');
      setDeleting(false);
    }
  }

  if (state.loading) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center">
        <div className="opacity-90">Loading…</div>
      </div>
    );
  }

  if (state.error || !state.v) {
    return (
      <div className="min-h-[100dvh] bg-black text-white p-6">
        <div className="mb-4">
          <button onClick={() => navigate(-1)} className="text-zinc-300 hover:text-white">
            ← Back
          </button>
        </div>
        <div className="bg-red-600/10 border border-red-600/30 text-red-300 rounded-2xl p-4">
          {state.error || 'VPort not found'}
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-[100dvh] bg-black text-white p-6">
        <div className="mb-4">
          <Link to={`/vports/${id}`} className="text-zinc-300 hover:text-white">
            ← View VPort
          </Link>
        </div>
        <div className="bg-yellow-600/10 border border-yellow-600/30 text-yellow-300 rounded-2xl p-4">
          You don’t have permission to edit this VPort.
        </div>
      </div>
    );
  }

  const v = state.v;

  return (
    <div className="min-h-[100dvh] bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="text-zinc-300 hover:text-white">← Back</button>
          <Link to={`/vports/${id}`} className="text-zinc-300 hover:text-white">View profile</Link>
        </div>

        <h1 className="text-center text-sm uppercase tracking-wider text-zinc-400 mb-6">Edit VPort</h1>

        {/* ---- DETAILS ---- */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 mb-6">
          <h2 className="text-sm uppercase tracking-wider text-zinc-400 mb-3">Details</h2>

          {saveErr && (
            <div className="mb-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 px-3 py-2">
              {saveErr}
            </div>
          )}

          <VPortForm
            initial={v}
            submitting={savingDetails}
            onSubmit={handleDetailsSubmit}
            onCancel={() => navigate(`/vports/${id}`)}
          />
        </div>

        {/* ---- PHOTOS ---- */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Avatar */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-3">Avatar</h3>
            <div className="flex items-center gap-3">
              <img
                src={v.avatar_url || DEFAULT_VPORT_AVATAR}
                className="w-16 h-16 rounded-xl object-cover bg-zinc-800"
                alt=""
              />
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          {/* Banner */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-3">Banner</h3>
            <div className="flex items-center gap-3">
              <div
                className="w-64 h-24 rounded-xl bg-zinc-800 bg-cover bg-center"
                style={v.banner_url ? { backgroundImage: `url(${v.banner_url})` } : undefined}
              />
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
        </div>

        {photosErr && (
          <div className="mb-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 px-3 py-2">
            {photosErr}
          </div>
        )}

        <div className="flex gap-2 mb-10">
          <button
            onClick={handleSavePhotos}
            disabled={savingPhotos || (!avatarFile && !bannerFile)}
            className="px-4 py-2 rounded bg-white text-black hover:opacity-90 disabled:opacity-50"
          >
            {savingPhotos ? 'Saving photos…' : 'Save Photos'}
          </button>
          <button
            onClick={() => {
              setAvatarFile(null);
              setBannerFile(null);
            }}
            className="px-4 py-2 rounded border border-zinc-600 bg-zinc-800 hover:bg-zinc-700"
          >
            Cancel
          </button>
        </div>

        {/* ---- DANGER ZONE ---- */}
        <div className="bg-red-900/20 border border-red-800 rounded-2xl p-4">
          <h3 className="text-sm uppercase tracking-wider text-red-300 mb-2">Danger Zone</h3>
          {deleteErr && (
            <div className="mb-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 px-3 py-2">
              {deleteErr}
            </div>
          )}
          <p className="text-sm text-red-200/80 mb-3">
            Deleting this VPort will permanently remove its posts, reactions, comments, reviews, photos, hours, and
            claims. This cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete VPort'}
          </button>
        </div>
      </div>
    </div>
  );
}

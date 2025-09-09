// src/features/posts/screens/UploadScreen.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useIdentity } from '@/state/identityContext';

import ModeTabs from '../components/ModeTabs';
import IdentityBanner from '../components/IdentityBanner';
import ProgressBanner from '../components/ProgressBanner';
import CropperPanel from '../components/CropperPanel';

import { useFileSelection } from '../hooks/useFileSelection';
import { runUpload } from '../services/uploadFlow';
import { db } from '@/data/data'; // ← DAL only

export default function UploadScreen() {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  /* ------------------------------------------------------------------ */
  /* Auth (via DAL)                                                      */
  /* ------------------------------------------------------------------ */
  const [user, setUser] = useState(null);
  useEffect(() => {
    db.auth.getAuthUser().then(setUser).catch(() => setUser(null));
  }, []);

  /* ------------------------------------------------------------------ */
  /* Identity                                                            */
  /* ------------------------------------------------------------------ */
  const isActingAsVPort = useMemo(
    () => identity?.type === 'vport' && Boolean(identity?.vportId),
    [identity?.type, identity?.vportId]
  );
  const profileId  = identity?.userId ?? user?.id ?? null;              // auth user id
  const vportId    = isActingAsVPort ? identity.vportId : null;         // acting vport id

  // If you still want to resolve actorId for other flows, keep it (not required for button enablement)
  const [actorId, setActorId] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!profileId) return;
        const aId = await db.actors.resolveActorId({
          profileId,
          actingAsVport: !!vportId,
          vportId: vportId ?? null,
        });
        if (!cancelled) setActorId(aId);
      } catch {
        if (!cancelled) setActorId(null);
      }
    })();
    return () => { cancelled = true; };
  }, [profileId, vportId]);

  /* ------------------------------------------------------------------ */
  /* UI / Mode                                                           */
  /* ------------------------------------------------------------------ */
  const [mode, setMode] = useState('POST'); // 'POST' | '24DROP' | 'VDROP'

  /* ------------------------------------------------------------------ */
  /* File state                                                          */
  /* ------------------------------------------------------------------ */
  const { file, mediaType, filePreviewUrl, handleFileChange, resetFile } = useFileSelection();

  /* ------------------------------------------------------------------ */
  /* Cropper                                                             */
  /* ------------------------------------------------------------------ */
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const onCropComplete = useCallback((_, px) => setCroppedAreaPixels(px), []);

  /* ------------------------------------------------------------------ */
  /* Form fields                                                         */
  /* ------------------------------------------------------------------ */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');

  /* ------------------------------------------------------------------ */
  /* UX / progress                                                       */
  /* ------------------------------------------------------------------ */
  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [compressionProgress, setCompressionProgress] = useState(0);

  /* ------------------------------------------------------------------ */
  /* Optional cooldown banner (if enforced in backend)                   */
  /* ------------------------------------------------------------------ */
  const [imageUploadBlocked, setImageUploadBlocked] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(0);

  /* ------------------------------------------------------------------ */
  /* Debug panel                                                         */
  /* ------------------------------------------------------------------ */
  const [showDebug, setShowDebug] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Reset when switching modes                                          */
  /* ------------------------------------------------------------------ */
  const resetAll = useCallback(() => {
    setTitle(''); setDescription(''); setCategory(''); setTags('');
    setCrop({ x: 0, y: 0 }); setZoom(1); setCroppedAreaPixels(null);
    resetFile();
    setImageUploadBlocked(false); setHoursRemaining(0); setMinutesRemaining(0);
  }, [resetFile]);

  /* ------------------------------------------------------------------ */
  /* Accept attribute                                                    */
  /* ------------------------------------------------------------------ */
  const acceptAttr = useMemo(() => {
    if (mode === 'VDROP') return 'video/*';
    if (mode === 'POST') return 'image/*';
    return 'image/*,video/*'; // 24DROP allows both
  }, [mode]);

  /* ------------------------------------------------------------------ */
  /* Upload handler                                                      */
  /* ------------------------------------------------------------------ */
  const handleUpload = async () => {
    if (!user || !profileId) {
      toast.error('You must be logged in with a valid identity.');
      return;
    }
    try {
      setLoading(true);
      setProcessingMessage('Starting upload…');
      setCompressionProgress(0);

      const result = await runUpload({
        mode,
        // Unified actor semantics used by your service
        // NOTE: runUpload expects actorUserId / actorVportId (not strictly actorId)
        actorUserId: profileId,
        actorVportId: vportId,
        // keep actorId if your runUpload uses it elsewhere
        actorId,
        // media
        file,
        mediaType,
        filePreviewUrl,
        croppedAreaPixels,
        // meta
        title,
        description,
        category,
        tags,
        visibility,
        setProgress: setProcessingMessage,
        setCompressionProgress,
      });

      if (result?.ok) {
        toast.success(
          result.enqueued
            ? 'Uploading in background. You can keep browsing ✨'
            : mode === '24DROP'
            ? '24DROP uploaded!'
            : mode === 'VDROP'
            ? 'VDROP posted!'
            : file
            ? 'Photo posted!'
            : 'Text post published!'
        );
        resetAll();
        navigate('/');
        return;
      }
    } catch (err) {
      if (err?.code === 'IMAGE_COOLDOWN') {
        setImageUploadBlocked(true);
        setHoursRemaining(err.hours || 0);
        setMinutesRemaining(err.minutes || 0);
      }
      console.error('[Upload Error]', err);
      toast.error(err?.message || 'Upload failed.');
    } finally {
      setLoading(false);
      setProcessingMessage('');
      setCompressionProgress(0);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Disabled guard (FIX: don’t gate on actorId)                         */
  /* ------------------------------------------------------------------ */
  const disabled =
    !user ||
    loading ||
    (mode === 'POST' && mediaType === 'image' && imageUploadBlocked) ||
    (mode === 'VDROP' && (!file || mediaType !== 'video' || !title.trim())) ||
    (mode === '24DROP' && (!file || (mediaType !== 'image' && mediaType !== 'video'))) ||
    (mode === 'POST' && !file && !description.trim()) ||
    (mode === 'POST' && mediaType === 'image' && !croppedAreaPixels);

  /* ------------------------------------------------------------------ */
  /* Renderers                                                           */
  /* ------------------------------------------------------------------ */
  const renderFilePreview = () => {
    if (!filePreviewUrl) {
      return (
        <span className="text-sm text-zinc-400">
          {mode === 'POST' ? 'Click to upload image' : 'Click to upload image or video'}
        </span>
      );
    }
    if (mediaType === 'image') {
      if (mode === 'POST') return null; // cropper will show below
      return <img src={filePreviewUrl} alt="Preview" className="rounded-xl w-full h-48 object-cover" />;
    }
    if (mediaType === 'video') {
      return <video src={filePreviewUrl} controls className="rounded-xl w-full h-48 object-cover" />;
    }
    return <span className="text-sm text-zinc-400">Selected: {file?.name} (Unsupported preview)</span>;
  };

  const debugPayload = {
    state: {
      user: !!user,
      userId: user?.id ?? null,
      identityType: identity?.type ?? null,
      identityUserId: identity?.userId ?? null,
      isActingAsVPort,
      vportId,
      actorIdResolved: !!actorId,
    },
    mode,
    guards: {
      disabled,
      noUser: !user,
      loading,
      imageCooldown: mode === 'POST' && mediaType === 'image' && imageUploadBlocked,
      vdropNeedsVideoAndTitle: mode === 'VDROP' && (!file || mediaType !== 'video' || !title.trim()),
      dropNeedsFile: mode === '24DROP' && (!file || (mediaType !== 'image' && mediaType !== 'video')),
      textPostNeedsBody: mode === 'POST' && !file && !description.trim(),
      imagePostNeedsCrop: mode === 'POST' && mediaType === 'image' && !croppedAreaPixels,
    },
    inputs: {
      hasFile: !!file,
      mediaType,
      hasPreview: !!filePreviewUrl,
      title: title.trim(),
      descLen: description.trim().length,
      tags,
      visibility,
      category,
      croppedAreaPixels: !!croppedAreaPixels,
    },
  };

  /* ------------------------------------------------------------------ */
  /* JSX                                                                 */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-[100svh] bg-black text-white p-4 flex flex-col items-center" aria-busy={loading}>
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between my-6">
          <h1 className="text-2xl font-bold">Upload to Vibez</h1>
          <button
            type="button"
            onClick={() => setShowDebug(v => !v)}
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>

        {identity?.type && (
          <IdentityBanner isActingAsVPort={isActingAsVPort} actorVportId={vportId} />
        )}

        <ModeTabs mode={mode} setMode={setMode} disabled={loading} onReset={resetAll} />

        {imageUploadBlocked && (
          <div className="bg-red-600 text-white text-sm text-center p-3 rounded mb-4">
            Wait {hoursRemaining}h {minutesRemaining}m before posting another image.
          </div>
        )}

        <ProgressBanner
          message={processingMessage}
          showBar={mediaType === 'video' && loading}
          progress={compressionProgress}
        />

        {!loading && (
          <label className="block w-full mb-4 border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-white">
            <input
              type="file"
              accept={acceptAttr}
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
            {renderFilePreview()}
          </label>
        )}

        {mode === 'POST' && mediaType === 'image' && filePreviewUrl && (
          <CropperPanel
            filePreviewUrl={filePreviewUrl}
            crop={crop}
            setCrop={setCrop}
            zoom={zoom}
            setZoom={setZoom}
            onCropComplete={onCropComplete}
            disabled={loading}
          />
        )}

        {(mode === 'VDROP' || isActingAsVPort) && (
          <input
            type="text"
            placeholder={mode === 'VDROP' ? 'Title (Required for VDROP)' : 'Title (optional)'}
            className="bg-zinc-800 text-white p-3 rounded-xl w-full mb-3 placeholder:text-zinc-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        )}

        {mode === 'VDROP' && !isActingAsVPort && (
          <input
            type="text"
            placeholder="Category (e.g. Dance, Comedy)"
            className="bg-zinc-800 text-white p-3 rounded-xl w-full mb-3 placeholder:text-zinc-400"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          />
        )}

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-zinc-800 text-white p-3 rounded-xl w-full h-24 mb-3 placeholder:text-zinc-400 resize-y"
          placeholder={
            mode === 'VDROP'
              ? 'Description (optional for VDROP)'
              : mode === '24DROP'
              ? 'Caption (optional for 24DROP)'
              : isActingAsVPort
              ? 'Body / caption for VPort post…'
              : 'Write a caption...'
          }
          disabled={loading}
        />

        {!isActingAsVPort && (
          <>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-zinc-800 text-white p-3 rounded-xl w-full mb-3 placeholder:text-zinc-400"
              placeholder="Tags (comma-separated, e.g., #funny, dance)"
              disabled={loading}
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="bg-zinc-800 text-white p-3 rounded-xl w-full mb-4"
              disabled={loading}
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="subscribers">Subscribers</option>
              <option value="close_friends">Close Friends</option>
            </select>
          </>
        )}

        <button
          onClick={handleUpload}
          className="mt-2 bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-md text-base font-semibold disabled:opacity-50 w-full hover:bg-purple-700 transition-colors"
          disabled={disabled}
          aria-disabled={disabled}
        >
          {loading ? processingMessage : `Post to ${isActingAsVPort ? 'VPORT' : mode}`}
        </button>

        {/* Debug panel */}
        {showDebug && (
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300">
            <div className="font-semibold mb-2">Debug</div>
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(debugPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

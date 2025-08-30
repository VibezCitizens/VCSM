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
import { db } from '@/data/data'; // ← use DAL, no direct supabase imports

export default function UploadScreen() {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  // Auth (via DAL)
  const [user, setUser] = useState(null);
  useEffect(() => {
    db.auth.getAuthUser().then(setUser).catch(() => setUser(null));
  }, []);

  // Identity
  const isActingAsVPort = useMemo(
    () => identity?.type === 'vport' && Boolean(identity?.vportId),
    [identity?.type, identity?.vportId]
  );
  const actorUserId  = identity?.userId ?? user?.id ?? null;
  const actorVportId = isActingAsVPort ? identity.vportId : null;

  // UI / mode
  const [mode, setMode] = useState('POST'); // 'POST' | '24DROP' | 'VDROP'

  // File state
  const { file, mediaType, filePreviewUrl, handleFileChange, resetFile } = useFileSelection();

  // Cropper
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const onCropComplete = useCallback((_, px) => setCroppedAreaPixels(px), []);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');

  // UX / progress
  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Optional cooldown banner (if your backend enforces it)
  const [imageUploadBlocked, setImageUploadBlocked] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(0);

  // Reset when switching modes
  const resetAll = useCallback(() => {
    setTitle(''); setDescription(''); setCategory(''); setTags('');
    setCrop({ x: 0, y: 0 }); setZoom(1); setCroppedAreaPixels(null);
    resetFile();
    setImageUploadBlocked(false); setHoursRemaining(0); setMinutesRemaining(0);
  }, [resetFile]);

  const acceptAttr = useMemo(() => {
    if (mode === 'VDROP') return 'video/*';
    if (mode === 'POST') return 'image/*';
    return 'image/*,video/*'; // 24DROP
  }, [mode]);

  const handleUpload = async () => {
    if (!user || !actorUserId) {
      toast.error('You must be logged in to upload.');
      return;
    }
    try {
      setLoading(true);
      setProcessingMessage('Starting upload…');
      setCompressionProgress(0);

      const result = await runUpload({
        mode,
        isActingAsVPort,
        actorUserId,
        actorVportId,
        file,
        mediaType,
        filePreviewUrl,
        croppedAreaPixels,
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
          mode === '24DROP' ? '24DROP uploaded!' :
          mode === 'VDROP'   ? 'VDROP posted!'   :
                               (file ? 'Photo posted!' : 'Text post published!')
        );
        setTimeout(() => navigate('/'), 800);
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

  const renderFilePreview = () => {
    if (!filePreviewUrl) {
      return (
        <span className="text-sm text-zinc-400">
          {mode === 'POST' ? 'Click to upload image' : 'Click to upload image or video'}
        </span>
      );
    }
    if (mediaType === 'image') {
      // In POST mode, the Cropper handles the image preview instead.
      if (mode === 'POST') return null;
      return <img src={filePreviewUrl} alt="Preview" className="rounded-xl w-full h-48 object-cover" />;
    }
    if (mediaType === 'video') {
      return <video src={filePreviewUrl} controls className="rounded-xl w-full h-48 object-cover" />;
    }
    return <span className="text-sm text-zinc-400">Selected: {file?.name} (Unsupported preview)</span>;
  };

  const disabled =
    !user ||
    loading ||
    (mode === 'POST' && mediaType === 'image' && imageUploadBlocked) ||
    (mode === 'VDROP' && (!file || mediaType !== 'video' || !title.trim())) ||
    (mode === '24DROP' && (!file || (mediaType !== 'image' && mediaType !== 'video'))) ||
    (mode === 'POST' && !file && !description.trim()) ||
    (mode === 'POST' && mediaType === 'image' && !croppedAreaPixels);

  return (
    <div className="min-h-[100svh] bg-black text-white p-4 flex flex-col items-center" aria-busy={loading}>
      <h1 className="text-2xl font-bold my-6">Upload to Vibez</h1>

      {identity?.type && (
        <IdentityBanner isActingAsVPort={isActingAsVPort} actorVportId={actorVportId} />
      )}

      <ModeTabs mode={mode} setMode={setMode} disabled={loading} onReset={resetAll} />

      {imageUploadBlocked && (
        <div className="bg-red-600 text-white text-sm text-center p-3 rounded mb-4 w-full max-w-md">
          Wait {hoursRemaining}h {minutesRemaining}m before posting another image.
        </div>
      )}

      <ProgressBanner
        message={processingMessage}
        showBar={mediaType === 'video'}
        progress={compressionProgress}
      />

      {!loading && (
        <label className="w-full max-w-md mb-4 border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-white">
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
          className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-zinc-400"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      )}

      {mode === 'VDROP' && !isActingAsVPort && (
        <input
          type="text"
          placeholder="Category (e.g. Dance, Comedy)"
          className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-zinc-400"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
        />
      )}

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md h-24 mb-3 placeholder:text-zinc-400 resize-y"
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
            className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-zinc-400"
            placeholder="Tags (comma-separated, e.g., #funny, dance)"
            disabled={loading}
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md mb-4"
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
        className="mt-6 bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-md text-base font-semibold disabled:opacity-50 w-full max-w-md hover:bg-purple-700 transition-colors"
        disabled={disabled}
        aria-disabled={disabled}
      >
        {loading ? processingMessage : `Post to ${isActingAsVPort ? 'VPORT' : mode}`}
      </button>
    </div>
  );
}

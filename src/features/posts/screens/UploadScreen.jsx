// src/features/posts/screens/UnifiedUploadScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabaseClient';
import getCroppedImg from '@/lib/cropImage';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';

import { getTimeRemaining } from '@/utils/getTimeRemaining';
import { compressVideo } from '@/utils/compressVideo';

export default function UnifiedUploadScreen() {
  const navigate = useNavigate();

  // ------------------------ //
  // USER + MODE
  // ------------------------ //
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('POST'); // POST | 24DROP | VDROP

  // ------------------------ //
  // MEDIA + FORM STATE
  // ------------------------ //
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');

  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Image post cool-down banner (POST + image only)
  const [imageUploadBlocked, setImageUploadBlocked] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(0);

  const videoPreviewRef = useRef(null);

  // ------------------------ //
  // EFFECTS
  // ------------------------ //
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  // revoke object URLs on unmount / when file changes
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // ------------------------ //
  // HELPERS
  // ------------------------ //
  const parseTags = (input) =>
    input
      .replace(/,/g, ' ')
      .split(' ')
      .map((t) => (t.startsWith('#') ? t.slice(1) : t))
      .map((t) => t.trim())
      .filter(Boolean);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const resetFileState = () => {
    setFile(null);
    setMediaType('');
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      resetFileState();
      return;
    }

    setFile(selected);
    const t = selected.type.startsWith('image/')
      ? 'image'
      : selected.type.startsWith('video/')
      ? 'video'
      : '';
    setMediaType(t);

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(URL.createObjectURL(selected));
    setCroppedAreaPixels(null);
  };

  // ------------------------ //
  // MAIN UPLOAD HANDLER
  // ------------------------ //
  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload.');
      return;
    }

    const processedTags = parseTags(tags);
    setLoading(true);
    setProcessingMessage('Starting upload…');

    try {
      // ========== 24DROP (story: image or video) ==========
      if (mode === '24DROP') {
        if (!file || (mediaType !== 'image' && mediaType !== 'video')) {
          throw new Error('Media (image or video) is required for 24DROP.');
        }

        setProcessingMessage(`Preparing ${mediaType} for 24DROP…`);

        let uploadFile = file;
        if (mediaType === 'video') {
          setProcessingMessage('Compressing video for 24DROP…');
          setCompressionProgress(0);
          uploadFile = await compressVideo(file, (p) => {
            setCompressionProgress(p);
            setProcessingMessage(`Compressing video: ${p}%`);
          });
          if (uploadFile.size > 25 * 1024 * 1024) {
            throw new Error('Compressed video for 24DROP is too large (max 25MB).');
          }
        }

        const key = `stories/${user.id}/${Date.now()}-${uploadFile.name}`;
        setProcessingMessage('Uploading media to Cloudflare…');
        const { url, error } = await uploadToCloudflare(uploadFile, key);
        if (error) throw new Error(error);

        setProcessingMessage('Saving 24DROP…');
        const { error: dbErr } = await supabase.from('stories').insert({
          user_id: user.id,
          media_url: url,
          media_type: mediaType,
          caption: description.trim() || null,
        });
        if (dbErr) throw new Error(dbErr.message);

        toast.success('24DROP uploaded!');
        setTimeout(() => navigate('/'), 800);
        return;
      }

      // ========== VDROP (video post) ==========
      if (mode === 'VDROP') {
        if (mediaType !== 'video' || !file) throw new Error('Video is required for VDROP.');
        if (!title.trim()) throw new Error('Title is required for VDROP.');
        if (file.size > 100 * 1024 * 1024) throw new Error('Max video size before compression is 100MB.');

        setProcessingMessage('Compressing video for VDROP…');
        setCompressionProgress(0);
        const compressed = await compressVideo(file, (p) => {
          setCompressionProgress(p);
          setProcessingMessage(`Compressing video: ${p}%`);
        });
        if (compressed.size > 25 * 1024 * 1024) {
          throw new Error(
            `Compressed video is still too large (${(compressed.size / (1024 * 1024)).toFixed(2)}MB). Max 25MB.`
          );
        }

        const key = `videos/${user.id}/${Date.now()}-${compressed.name}`;
        setProcessingMessage('Uploading compressed video…');
        const { url, error } = await uploadToCloudflare(compressed, key);
        if (error) throw new Error(error);

        setProcessingMessage('Saving VDROP…');
        const { error: dbErr } = await supabase.from('posts').insert({
          user_id: user.id,
          media_url: url,
          media_type: 'video',
          title: title.trim(),
          category: category.trim() || null,
          tags: processedTags.length ? processedTags : null,
          visibility,
          text: description.trim() || null,
          post_type: 'video',
          created_at: new Date().toISOString(),
        });
        if (dbErr) throw new Error(dbErr.message);

        toast.success('VDROP posted!');
        setTimeout(() => navigate('/'), 800);
        return;
      }

      // ========== POST (text or image) ==========
      if (mode === 'POST') {
        // TEXT ONLY
        if (!file) {
          if (!description.trim()) throw new Error('Caption is required for text-only posts.');
          setProcessingMessage('Saving text post…');
          const { error } = await supabase.from('posts').insert({
            user_id: user.id,
            text: description.trim(),
            media_url: null,
            media_type: null,
            tags: processedTags,
            visibility,
            post_type: 'text',
          });
          if (error) throw new Error(error.message);

          toast.success('Text post published!');
          setTimeout(() => navigate('/'), 800);
          return;
        }

        // IMAGE POST
        if (mediaType !== 'image') throw new Error('Only images can be uploaded in POST mode with media.');

        // DB-driven cool-down (3h) — only for image posts
        const { data: recentPosts, error: fetchErr } = await supabase
          .from('posts')
          .select('id, created_at')
          .eq('user_id', user.id)
          .eq('media_type', 'image')
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchErr) throw new Error(fetchErr.message);

        if (recentPosts?.length > 0) {
          const { hours, minutes } = getTimeRemaining(recentPosts[0].created_at, 3 * 60); // 3h window
          const nowMs = Date.now();
          const lastMs = new Date(recentPosts[0].created_at).getTime();
          const limitMs = 3 * 60 * 60 * 1000;

          if (nowMs - lastMs < limitMs) {
            setHoursRemaining(hours);
            setMinutesRemaining(minutes);
            setImageUploadBlocked(true);
            throw new Error(`Wait ${hours}h ${minutes}m before uploading another image.`);
          }
        }

        // Crop is required for POST+image
        if (!croppedAreaPixels) throw new Error('Please crop the image before uploading.');

        setProcessingMessage('Cropping image…');
        const croppedBlob = await getCroppedImg(filePreviewUrl, croppedAreaPixels);

        const key = `images/${user.id}/${Date.now()}-cropped.jpg`;
        setProcessingMessage('Uploading image…');
        const { url, error: uploadErr } = await uploadToCloudflare(croppedBlob, key);
        if (uploadErr) throw new Error(uploadErr);

        setProcessingMessage('Saving post…');
        const { error: dbErr } = await supabase.from('posts').insert({
          user_id: user.id,
          text: description.trim() || null,
          media_url: url,
          media_type: 'image',
          tags: processedTags,
          visibility,
          post_type: 'photo',
        });
        if (dbErr) throw new Error(dbErr.message);

        toast.success('Photo posted!');
        setTimeout(() => navigate('/'), 800);
        return;
      }

      throw new Error('Invalid upload mode selected.');
    } catch (err) {
      console.error('[Upload Error]', err);
      toast.error(err.message || 'Upload failed.');
    } finally {
      setLoading(false);
      setProcessingMessage('');
      setCompressionProgress(0);
    }
  };

  // ------------------------ //
  // RENDER HELPERS
  // ------------------------ //
  const renderFilePreview = () => {
    if (!filePreviewUrl) {
      return <span className="text-sm text-zinc-400">Click to upload image or video</span>;
    }

    if (mediaType === 'image') {
      // For POST we render the Cropper instead of a static <img>
      if (mode === 'POST') return null;
      return <img src={filePreviewUrl} alt="Preview" className="rounded-xl w-full h-48 object-cover" />;
    }

    if (mediaType === 'video') {
      return (
        <video
          ref={videoPreviewRef}
          src={filePreviewUrl}
          controls
          className="rounded-xl w-full h-48 object-cover"
        />
      );
    }

    return <span className="text-sm text-zinc-400">Selected: {file?.name} (Unsupported preview)</span>;
  };

  // ------------------------ //
  // UI
  // ------------------------ //
  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold my-6">Upload to Vibez</h1>

      {/* Mode switch */}
      <div className="flex mb-4 space-x-2">
        {['POST', '24DROP', 'VDROP'].map((type) => (
          <button
            key={type}
            onClick={() => {
              setMode(type);
              resetFileState();
              setTitle('');
              setDescription('');
              setCategory('');
              setTags('');
              setImageUploadBlocked(false);
              setHoursRemaining(0);
              setMinutesRemaining(0);
            }}
            className={`px-4 py-2 rounded-full font-semibold text-sm ${
              mode === type ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
            disabled={loading}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Cool-down banner (POST + image only) */}
      {imageUploadBlocked && (
        <div className="bg-red-600 text-white text-sm text-center p-3 rounded mb-4 w-full max-w-md">
          Wait {hoursRemaining}h {minutesRemaining}m before posting another image.
        </div>
      )}

      {/* Processing banner + (optional) progress */}
      {loading && processingMessage && (
        <div className="bg-blue-600 text-white text-sm text-center p-3 rounded mb-4 w-full max-w-md">
          {processingMessage}
          {mediaType === 'video' && compressionProgress > 0 && compressionProgress < 100 && (
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${compressionProgress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* File input + preview */}
      {!loading && (
        <label className="w-full max-w-md mb-4 border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-white">
          <input
            type="file"
            id="file-upload-input"
            accept={mode === 'VDROP' ? 'video/*' : 'image/*,video/*'}
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          {renderFilePreview()}
        </label>
      )}

      {/* Cropper (POST + image) */}
      {mode === 'POST' && mediaType === 'image' && filePreviewUrl && (
        <>
          <div className="relative w-full max-w-md aspect-square bg-black mb-4 rounded-xl overflow-hidden">
            <Cropper
              image={filePreviewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
              objectFit="contain"
            />
          </div>

          <div className="mb-4 flex items-center w-full max-w-md">
            <label htmlFor="zoom-slider" className="mr-2 text-sm text-white/60">
              Zoom:
            </label>
            <input
              type="range"
              id="zoom-slider"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
              disabled={loading}
            />
          </div>
        </>
      )}

      {/* VDROP only fields */}
      {mode === 'VDROP' && (
        <>
          <input
            type="text"
            placeholder="Title (Required for VDROP)"
            className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-zinc-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Category (e.g., Dance, Comedy)"
            className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-zinc-400"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          />
        </>
      )}

      {/* Caption / Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md h-24 mb-3 placeholder:text-zinc-400 resize-y"
        placeholder={
          mode === 'VDROP'
            ? 'Description (optional for VDROP)'
            : mode === '24DROP'
            ? 'Caption (optional for 24DROP)'
            : 'Write a caption…'
        }
        disabled={loading}
      />

      {/* Tags */}
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-zinc-400"
        placeholder="Tags (comma-separated, e.g., #funny, dance)"
        disabled={loading}
      />

      {/* Visibility */}
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

      {/* Upload */}
      <button
        onClick={handleUpload}
        className="mt-6 bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-md text-base font-semibold disabled:opacity-50 w-full max-w-md hover:bg-purple-700 transition-colors"
        disabled={
          !user ||
          loading ||
          (mode === 'POST' && mediaType === 'image' && imageUploadBlocked) ||
          (mode === 'VDROP' && (!file || mediaType !== 'video' || !title.trim())) ||
          (mode === '24DROP' && (!file || (mediaType !== 'image' && mediaType !== 'video'))) ||
          (mode === 'POST' && !file && !description.trim()) ||
          (mode === 'POST' && mediaType === 'image' && !croppedAreaPixels)
        }
      >
        {loading ? processingMessage : `Post to ${mode}`}
      </button>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import getCroppedImg from '@/lib/cropImage';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { getTimeRemaining } from '@/utils/getTimeRemaining';
import { compressVideo } from '@/utils/compressVideo'; // Video compressor

export default function UnifiedUploadScreen() {
  const navigate = useNavigate();

  // ------------------------ //
  // USER + UPLOAD MODE LOGIC
  // ------------------------ //
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('POST'); // POST | 24DROP | VDROP

  // ------------------------ //
  // MEDIA + FORM STATES
  // ------------------------ //
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null); // This will be null until crop is complete

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');

  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [compressionProgress, setCompressionProgress] = useState(0);

  const [imageUploadBlocked, setImageUploadBlocked] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(0);

  const videoPreviewRef = useRef(null);

  // --- Effects ---

  useEffect(() => {
    // Fetch user on component mount
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  useEffect(() => {
    // Cleanup object URLs when component unmounts or file changes
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // --- Utility Functions ---

  const parseTags = (input) =>
    input.replace(/,/g, ' ') // Replace commas with spaces
      .split(' ')
      .map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag)) // Remove leading '#'
      .map((tag) => tag.trim()) // Trim whitespace
      .filter(Boolean); // Remove empty strings

  const onCropComplete = useCallback((_, croppedPixels) => {
    // This callback is crucial for setting croppedAreaPixels
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // ------------------------ //
  // FILE HANDLING
  // ------------------------ //
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setMediaType('');
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
      setCroppedAreaPixels(null); // Reset cropped area when no file or new file
      return;
    }

    setFile(selected);
    const type = selected.type.startsWith('image/')
      ? 'image'
      : selected.type.startsWith('video/')
      ? 'video'
      : '';
    setMediaType(type);

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl); // Clean up previous URL
    setFilePreviewUrl(URL.createObjectURL(selected)); // Create new URL for preview
    setCroppedAreaPixels(null); // Reset cropped area for new file, will be set by Cropper if applicable
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
    setProcessingMessage('Starting upload...');

    try {
      // ========== MODE: 24DROP ==========
      if (mode === '24DROP') {
        if (!file || (mediaType !== 'image' && mediaType !== 'video')) {
          throw new Error('Media (image or video) is required for 24DROP.');
        }

        setProcessingMessage(`Preparing ${mediaType} for 24DROP...`);
        let uploadFile = file;
        if (mediaType === 'video') {
          setProcessingMessage('Compressing video for 24DROP...');
          uploadFile = await compressVideo(file, (progress) => {
            setCompressionProgress(progress);
            setProcessingMessage(`Compressing video: ${progress}%`);
          });
          if (uploadFile.size > 25 * 1024 * 1024) { // Max size for story video
            throw new Error('Compressed video for 24DROP is too large (max 25MB).');
          }
        } else if (mediaType === 'image') {
          // No cropping for 24DROP images, upload original
          // If you want cropping for 24DROP images, you'd need a separate cropper instance or logic
        }

        const uploadKey = `stories/${user.id}/${Date.now()}-${uploadFile.name}`;
        setProcessingMessage('Uploading media to Cloudflare...');
        const { url, error } = await uploadToCloudflare(uploadFile, uploadKey);
        if (error) throw new Error(error);

        setProcessingMessage('Saving 24DROP details...');
        const { error: insertErr } = await supabase.from('stories').insert({
          user_id: user.id,
          media_url: url,
          media_type: mediaType,
          caption: description.trim() || null,
        });

        if (insertErr) throw new Error(insertErr.message);
        toast.success('24DROP uploaded!');
        setTimeout(() => navigate('/'), 1000); // Navigate after a short delay
        return;
      }

      // ========== MODE: VDROP (VIDEO POST) ==========
      if (mode === 'VDROP') {
        if (mediaType !== 'video' || !file) throw new Error('Video file is required for VDROP.');
        if (!title.trim()) throw new Error('Title is required for VDROP.');
        if (file.size > 100 * 1024 * 1024) { // Initial client-side video size limit
          throw new Error('Max video size before compression is 100MB.');
        }

        setProcessingMessage('Compressing video for VDROP... This may take a while.');
        setCompressionProgress(0); // Reset progress

        const compressed = await compressVideo(file, (progress) => {
          setCompressionProgress(progress);
          setProcessingMessage(`Compressing video: ${progress}%`);
        });

        if (compressed.size > 25 * 1024 * 1024) { // Final compressed size limit
          throw new Error(`Compressed video is still too large (${(compressed.size / (1024 * 1024)).toFixed(2)}MB). Max 25MB.`);
        }

        const key = `videos/${user.id}/${Date.now()}-${compressed.name}`;
        setProcessingMessage('Uploading compressed video...');
        const { url, error } = await uploadToCloudflare(compressed, key);
        if (error) throw new Error(error);

        setProcessingMessage('Saving VDROP details...');
        const { error: dbErr } = await supabase.from('posts').insert({
          user_id: user.id,
          media_url: url,
          media_type: 'video',
          title: title.trim(),
          category: category.trim() || null,
          tags: processedTags.length > 0 ? processedTags : null,
          visibility,
          text: description.trim() || null, // Description is optional for VDROP
          post_type: 'video',
          created_at: new Date().toISOString(),
        });

        if (dbErr) throw new Error(dbErr.message);
        toast.success('VDROP posted!');
        setTimeout(() => navigate('/'), 1000);
        return;
      }

      // ========== MODE: POST (TEXT or IMAGE) ==========
      if (mode === 'POST') {
        if (!file) {
          // TEXT-ONLY POST
          if (!description.trim()) throw new Error('Caption is required for text-only posts.');
          setProcessingMessage('Saving text post...');
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
          setTimeout(() => navigate('/'), 1000);
          return;
        }

        // IMAGE POST (requires cropping)
        if (mediaType !== 'image') throw new Error('Only images can be uploaded in POST mode with media.');

        // Cooldown check for image posts
        const { data: recentPosts, error: fetchErr } = await supabase
          .from('posts')
          .select('id, created_at')
          .eq('user_id', user.id)
          .eq('media_type', 'image')
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchErr) throw new Error(fetchErr.message);

        if (recentPosts?.length > 0) {
          const lastPostTime = new Date(recentPosts[0].created_at).getTime();
          const now = Date.now();
          const limit = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

          if (now - lastPostTime < limit) {
            const { hours, minutes } = getTimeRemaining(recentPosts[0].created_at);
            setHoursRemaining(hours);
            setMinutesRemaining(minutes);
            setImageUploadBlocked(true);
            throw new Error(`Wait ${hours}h ${minutes}m before uploading another image.`);
          }
        }

        setProcessingMessage('Cropping image...');
        // Crucial check: croppedAreaPixels must be available for image cropping
        if (!croppedAreaPixels) {
          throw new Error('Please crop the image before uploading.');
        }
        const croppedBlob = await getCroppedImg(filePreviewUrl, croppedAreaPixels);
        const key = `images/${user.id}/${Date.now()}-cropped.jpg`;

        setProcessingMessage('Uploading image...');
        const { url, error: uploadError } = await uploadToCloudflare(croppedBlob, key);
        if (uploadError) throw new Error(uploadError);

        setProcessingMessage('Saving post details...');
        const { error: dbError } = await supabase.from('posts').insert({
          user_id: user.id,
          text: description.trim() || null,
          media_url: url,
          media_type: 'image',
          tags: processedTags,
          visibility,
          post_type: 'photo',
        });

        if (dbError) throw new Error(dbError.message);
        toast.success('Photo posted!');
        setTimeout(() => navigate('/'), 1000);
        return;
      }

      // Fallback for unexpected mode
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

  // --- Render Logic ---

  const renderFilePreview = () => {
    if (!filePreviewUrl) {
      return <span className="text-sm text-zinc-400">Click to upload image or video</span>;
    }

    if (mediaType === 'image') {
      // For POST mode, image will be handled by Cropper.
      // For 24DROP, we show a simple preview.
      if (mode === 'POST') {
        // The Cropper component itself will render the image
        return null; // Don't render a separate <img> here if Cropper is active
      } else {
        return <img src={filePreviewUrl} alt="Preview" className="rounded-xl w-full h-48 object-cover" />;
      }
    } else if (mediaType === 'video') {
      return (
        <video
          ref={videoPreviewRef}
          src={filePreviewUrl}
          controls
          className="rounded-xl w-full h-48 object-cover"
        />
      );
    } else {
      return <span className="text-sm text-zinc-400">Selected: {file.name} (Unsupported preview)</span>;
    }
  };


  // ------------------------ //
  // UI RENDER LOGIC
  // ------------------------ //
  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold my-6">Upload to Vibez</h1>

      {/* --- Tab Switcher: POST / 24DROP / VDROP --- */}
      <div className="flex mb-4 space-x-2">
        {['POST', '24DROP', 'VDROP'].map((type) => (
          <button
            key={type}
            onClick={() => {
              setMode(type);
              // Reset file and preview when changing mode to avoid confusion
              setFile(null);
              setMediaType('');
              if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
              setFilePreviewUrl(null);
              setCroppedAreaPixels(null); // Crucial: Reset cropped area
              setTitle('');
              setDescription('');
              setCategory('');
              setTags('');
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

      {/* Upload Blocked Message (Image Cooldown) */}
      {imageUploadBlocked && (
        <div className="bg-red-600 text-white text-sm text-center p-3 rounded mb-4 w-full max-w-md">
          Wait {hoursRemaining}h {minutesRemaining}m before posting another image.
        </div>
      )}

      {/* Loading/Processing Message */}
      {loading && processingMessage && (
        <div className="bg-blue-600 text-white text-sm text-center p-3 rounded mb-4 w-full max-w-md">
          {processingMessage}
          {mediaType === 'video' && compressionProgress > 0 && compressionProgress < 100 && (
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2.5 dark:bg-blue-700">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${compressionProgress}%` }}></div>
            </div>
          )}
        </div>
      )}

      {/* --- File Upload Input & Preview --- */}
      {/* Only show the file input if not in a loading state */}
      {!loading && (
        <label className="w-full max-w-md mb-4 border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-white">
          <input
            type="file"
            id="file-upload-input" // Added ID for better accessibility
            accept={mode === 'VDROP' ? 'video/*' : 'image/*,video/*'} // Restrict file types based on mode
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          {renderFilePreview()}
        </label>
      )}

      {/* Image Cropper - ONLY for POST mode and image media */}
      {mode === 'POST' && mediaType === 'image' && filePreviewUrl && (
        <>
          <div className="relative w-full max-w-md aspect-square bg-black mb-4 rounded-xl overflow-hidden">
            <Cropper
              image={filePreviewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1} // Assuming square crop for posts
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={true}
              objectFit="contain" // Added for better fit within the crop area
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

      {/* Conditional fields for video uploads (VDROP mode) */}
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
            placeholder="Category (e.g. Dance, Comedy)"
            className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-zinc-400"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          />
        </>
      )}

      {/* Description/Caption - always present */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md h-24 mb-3 placeholder:text-zinc-400 resize-y"
        placeholder={
          mode === 'VDROP'
            ? 'Description (optional for VDROP)'
            : mode === '24DROP'
            ? 'Caption (optional for 24DROP)'
            : 'Write a caption...' // POST mode
        }
        disabled={loading}
      />

      {/* Tags Input - always present */}
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="bg-zinc-800 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-zinc-400"
        placeholder="Tags (comma-separated, e.g., #funny, dance)"
        disabled={loading}
      />

      {/* Visibility Selector - always present */}
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

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className="mt-6 bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-md text-base font-semibold disabled:opacity-50 w-full max-w-md hover:bg-purple-700 transition-colors"
        disabled={
          !user ||
          loading || // Disable if any processing is ongoing
          (mode === 'POST' && mediaType === 'image' && imageUploadBlocked) || // Image cooldown for POST mode
          (mode === 'VDROP' && (!file || mediaType !== 'video' || !title.trim())) || // VDROP requires video and title
          (mode === '24DROP' && (!file || (mediaType !== 'image' && mediaType !== 'video'))) || // 24DROP requires media
          (mode === 'POST' && !file && !description.trim()) || // Text-only POST requires description
          (mode === 'POST' && mediaType === 'image' && !croppedAreaPixels) // Image POST requires cropping to be done
        }
      >
        {loading ? processingMessage : `Post to ${mode}`}
      </button>
    </div>
  );
}

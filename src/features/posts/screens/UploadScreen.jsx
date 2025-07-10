import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import getCroppedImg from '@/lib/cropImage';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { getTimeRemaining } from '@/utils/getTimeRemaining';
import { compressVideo } from '@/lib/compressVideo'; // Your client-side compression function

export default function UnifiedUploadScreen() {
  const navigate = useNavigate();

  // State for user and UI elements
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null); // The original file selected by user
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
  const [filePreviewUrl, setFilePreviewUrl] = useState(null); // URL for image or video preview

  // State for image cropping
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // State for post details
  const [title, setTitle] = useState(''); // For videos
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(''); // For videos
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');

  // Loading and status states
  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [compressionProgress, setCompressionProgress] = useState(0); // 0-100 for video compression

  // Image upload cooldown
  const [imageUploadBlocked, setImageUploadBlocked] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(0);

  // Refs for cleanup
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
    input
      .replace(/,/g, ' ') // Replace commas with spaces
      .split(' ')
      .map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag)) // Remove leading '#'
      .map((tag) => tag.trim()) // Trim whitespace
      .filter(Boolean); // Remove empty strings

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // --- Handlers ---

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setMediaType('');
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl); // Clean up old preview
      setFilePreviewUrl(null);
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
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to post.');
      return;
    }

    const processedTags = parseTags(tags);
    setLoading(true);
    setProcessingMessage('Starting upload...');

    // --- No file: text-only post ---
    if (!file) {
      if (!description.trim()) {
        toast.error('Please add a caption or media.');
        setLoading(false);
        setProcessingMessage('');
        return;
      }

      try {
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
        toast.success('Posted!');
        setTimeout(() => navigate('/'), 1000);
      } catch (err) {
        console.error('Text post error:', err);
        toast.error(`Post error: ${err.message}`);
      } finally {
        setLoading(false);
        setProcessingMessage('');
      }
      return;
    }

    // --- Image upload flow ---
    if (mediaType === 'image') {
      // Cooldown check for image posts
      try {
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
            toast.error(`Wait ${hours}h ${minutes}m before uploading another image.`);
            setLoading(false);
            setProcessingMessage('');
            return;
          }
        }

        setProcessingMessage('Cropping image...');
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
      } catch (err) {
        console.error('Image upload failed:', err);
        toast.error(`Image upload failed: ${err.message}`);
      } finally {
        setLoading(false);
        setProcessingMessage('');
      }
      return;
    }

    // --- VIDEO upload flow ---
    if (mediaType === 'video') {
      if (!description.trim()) {
        toast.error('Please add a description.');
        setLoading(false);
        setProcessingMessage('');
        return;
      }

      // Client-side file size limit (before compression)
      if (file.size > 100 * 1024 * 1024) { // Increased to 100MB as per previous discussion for input
        toast.error('Max video size before compression is 100MB.');
        setLoading(false);
        setProcessingMessage('');
        return;
      }

      try {
        setProcessingMessage('Compressing video... This may take a while.');
        setCompressionProgress(0); // Reset progress

        // Perform client-side compression
        const compressedFile = await compressVideo(file, (progress) => {
          setCompressionProgress(progress);
          setProcessingMessage(`Compressing video: ${progress}%`);
        });

        // Optional: Add a check for the compressed file size
        if (compressedFile.size > 25 * 1024 * 1024) { // Final compressed size limit
          toast.error(`Compressed video is still too large (${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB). Max 25MB.`);
          setLoading(false);
          setProcessingMessage('');
          return;
        }


        const key = `videos/${user.id}/${Date.now()}-${compressedFile.name}`;

        setProcessingMessage('Uploading compressed video...');
        const { url, error: uploadError } = await uploadToCloudflare(compressedFile, key);
        if (uploadError) throw new Error(uploadError);

        setProcessingMessage('Saving post details...');
        const { error: dbError } = await supabase.from('posts').insert({
          user_id: user.id,
          text: description.trim(),
          media_url: url,
          media_type: 'video',
          tags: processedTags.length > 0 ? processedTags : null,
          visibility,
          post_type: 'video',
          created_at: new Date().toISOString(), // Use ISO string for Supabase timestamp
          title: title.trim() || null,
          category: category.trim() || null,

        });

        if (dbError) throw new Error(dbError.message);
        toast.success('Video posted!');
        setTimeout(() => navigate('/'), 1000);
      } catch (err) {
        console.error('[Video Upload Error]', err);
        toast.error(`Video upload failed: ${err.message || 'An unknown error occurred.'}`);
      } finally {
        setLoading(false);
        setProcessingMessage('');
        setCompressionProgress(0); // Reset progress
      }
      return;
    }

    // Fallback for unsupported file types
    toast.error('Unsupported file type.');
    setLoading(false);
    setProcessingMessage('');
  };

  // --- Render Logic ---

  const renderFilePreview = () => {
    if (!filePreviewUrl) {
      return <span className="text-sm text-white/60">Click to select an image or video</span>;
    }

    if (mediaType === 'image') {
      return <img src={filePreviewUrl} alt="Preview" className="rounded-xl w-full h-48 object-cover" />;
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
      return <span className="text-sm text-white/60">Selected: {file.name} (Unsupported preview)</span>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-start">
      <h1 className="text-2xl font-bold mb-4 mt-6">Upload to Vibez</h1>

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

      {/* Unified File Upload Area */}
      <label
        htmlFor="file-upload"
        className="w-full max-w-md cursor-pointer border-dashed border-2 border-white/20 rounded-2xl p-4 text-center hover:border-white transition-all mb-4"
      >
        <input
          id="file-upload"
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading} // Disable file input during processing
        />
        {renderFilePreview()}
      </label>

      {/* Conditional fields for video uploads */}
      {mediaType === 'video' && (
        <>
          <input
            type="text"
            placeholder="Title (Required for videos)"
            className="bg-white/10 text-white p-3 rounded-xl w-full max-w-md mb-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Category (e.g. Dance, Comedy)"
            className="bg-white/10 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-white/60"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          />
        </>
      )}

      {/* Description/Caption */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-white/10 text-white p-3 rounded-xl w-full max-w-md h-20 mb-3 placeholder:text-white/60 resize-y"
        placeholder={mediaType === 'video' ? 'Description (optional)' : 'Write a caption...'}
        disabled={loading}
      />

      {/* Tags Input */}
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="bg-white/10 text-white p-3 rounded-xl w-full max-w-md mb-3 placeholder:text-white/60"
        placeholder="Tags (comma-separated, e.g., #funny, dance)"
        disabled={loading}
      />

      {/* Visibility Selector */}
      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
        className="bg-white/10 text-white p-3 rounded-xl w-full max-w-md mb-4"
        disabled={loading}
      >
        <option value="public">Public</option>
        <option value="friends">Friends</option>
        <option value="subscribers">Subscribers</option>
        <option value="close_friends">Close Friends</option>
      </select>

      {/* Image Cropper */}
      {mediaType === 'image' && filePreviewUrl && (
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

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className="mt-6 bg-purple-500 text-white px-5 py-3 rounded-2xl shadow-md text-base font-semibold disabled:opacity-50 w-full max-w-md"
        disabled={
          !user ||
          loading || // Disable if any processing is ongoing
          (mediaType === 'image' && imageUploadBlocked) ||
          (mediaType === 'video' && !title.trim()) || // Title is required for video
          (!file && !description.trim()) // Must have file or description for text-only
        }
      >
        {loading ? processingMessage : mediaType === 'video' ? 'Upload Video' : 'Post'}
      </button>
    </div>
  );
}
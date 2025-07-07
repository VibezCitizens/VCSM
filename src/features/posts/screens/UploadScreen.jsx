import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import getCroppedImg from '@/lib/cropImage';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { getTimeRemaining } from '@/utils/getTimeRemaining';

export default function UnifiedUploadScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
  const [imagePreview, setImagePreview] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [title, setTitle] = useState(''); // For videos
  const [description, setDescription] = useState(''); // Renamed from 'text'
  const [category, setCategory] = useState(''); // For videos
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [imageUploadBlocked, setImageUploadBlocked] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const parseTags = (input) =>
    input
      .replace(/,/g, ' ')
      .split(' ')
      .map(tag => tag.startsWith('#') ? tag.slice(1) : tag)
      .map(tag => tag.trim())
      .filter(Boolean);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setMediaType('');
      setImagePreview(null);
      return;
    }
    setFile(selected);
    const type = selected.type.startsWith('image/') ? 'image' :
                 selected.type.startsWith('video/') ? 'video' : '';
    setMediaType(type);
    if (type === 'image') {
      setImagePreview(URL.createObjectURL(selected));
    } else if (type === 'video') {
      setImagePreview(URL.createObjectURL(selected)); // This will be used to render the video preview
    } else {
      setImagePreview(null);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to post.');
      return;
    }

    const processedTags = parseTags(tags);
    setLoading(true);

    // No file: text-only post (This logic remains largely the same)
    if (!file) {
      if (!description.trim()) {
        toast.error('Please add a caption or media.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        text: description.trim(),
        media_url: null,
        media_type: null,
        tags: processedTags,
        visibility,
        post_type: 'text',
      });

      if (error) toast.error(`Post error: ${error.message}`);
      else {
        toast.success('Posted!');
        setTimeout(() => navigate('/'), 1000);
      }

      setLoading(false);
      return;
    }

    // Image upload flow
    if (mediaType === 'image') {
      // Check cooldown for image posts
      const { data: recentPosts, error: fetchErr } = await supabase
        .from('posts')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('media_type', 'image')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchErr) {
        toast.error('Error checking post history.');
        setLoading(false);
        return;
      }

      if (recentPosts?.length > 0) {
        const lastPostTime = new Date(recentPosts[0].created_at).getTime();
        const now = Date.now();
        const limit = 3 * 60 * 60 * 1000;

        if ((now - lastPostTime) < limit) {
          const { hours, minutes } = getTimeRemaining(recentPosts[0].created_at);
          setHoursRemaining(hours);
          setMinutesRemaining(minutes);
          setImageUploadBlocked(true);
          toast.error(`Wait ${hours}h ${minutes}m before uploading another image.`);
          setLoading(false);
          return;
        }
      }

      try {
        const croppedBlob = await getCroppedImg(imagePreview, croppedAreaPixels);
        const key = `posts/${user.id}/${Date.now()}-cropped.jpg`;
        const { url, error: uploadError } = await uploadToCloudflare(croppedBlob, key);
        if (uploadError) throw new Error(uploadError);

        const { error } = await supabase.from('posts').insert({
          user_id: user.id,
          text: description.trim() || null,
          media_url: url,
          media_type: 'image',
          tags: processedTags,
          visibility,
          post_type: 'photo',
        });

        if (error) toast.error(`Post error: ${error.message}`);
        else {
          toast.success('Photo posted!');
          setTimeout(() => navigate('/'), 1000);
        }

      } catch (err) {
        toast.error('Image upload failed.');
      } finally {
        setLoading(false);
      }

      return;
    }

    // VIDEO upload flow
    if (mediaType === 'video') {
        if (!title.trim()) {
            toast.error('Video title is required.');
            setLoading(false);
            return;
        }
      try {
        const key = `posts/${user.id}/${Date.now()}-${file.name}`;
        const { url, error: uploadError } = await uploadToCloudflare(file, key);
        if (uploadError) throw new Error(uploadError);

        const { error } = await supabase.from('posts').insert({
          user_id: user.id,
          title: title.trim(), // Video title
          text: description.trim() || null, // Video description
          media_url: url,
          media_type: 'video',
          category: category.trim() || null, // Video category
          tags: processedTags,
          visibility,
          post_type: 'video',
        });

        if (error) toast.error(`Post error: ${error.message}`);
        else {
          toast.success('Video posted!');
          setTimeout(() => navigate('/'), 1000);
        }

      } catch (err) {
        toast.error('Video upload failed.');
        setLoading(false);
      }

      return;
    }

    toast.error('Unsupported file type.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p4 flex flex-col items-center justify-start">
      <h1 className="text-xl font-bold mb4 mt6">Upload to Vibez</h1>

      {imageUploadBlocked && (
        <div className="bg-red-600 text-white text-sm text-center p-3 rounded mb-4 w-full max-w-md">
          Wait {hoursRemaining}h {minutesRemaining}m before posting another image.
        </div>
      )}

      {/* Unified File Upload Area */}
      <label
        htmlFor="file-upload"
        className="w-full max-w-md cursor-pointer border-dashed border-2 border-white/20 rounded-2xl p4 text-center hover:border-white transition-all mb4"
      >
        <input
          id="file-upload"
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {file ? (
          mediaType === 'image' && imagePreview ? (
            <img src={imagePreview} alt="Preview" className="rounded-xl w-full h-48 object-cover" />
          ) : mediaType === 'video' && imagePreview ? (
            <video
              src={imagePreview}
              controls
              className="rounded-xl w-full h-48 object-cover"
            />
          ) : (
            <span className="text-sm text-white/60">Selected: {file.name}</span>
          )
        ) : (
          <span className="text-sm text-white/60">Click to select an image or video</span>
        )}
      </label>

      {/* Conditional fields for video uploads */}
      {mediaType === 'video' && (
        <input
          type="text"
          placeholder="Title"
          className="bg-white/10 text-white p3 rounded-xl w-full max-w-md mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      )}

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-white/10 text-white p3 rounded-xl w-full max-w-md h-20 mb-3 placeholder:text-white/60"
        placeholder={mediaType === 'video' ? "Description (optional)" : "Write a caption..."}
      />

      {mediaType === 'video' && (
        <input
          type="text"
          placeholder="Category (e.g. Dance, Comedy)"
          className="bg-white/10 text-white p3 rounded-xl w-full max-w-md mb-3 placeholder:text-white/60"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      )}

      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="bg-white/10 text-white p3 rounded-xl w-full max-w-md mb-3 placeholder:text-white/60"
        placeholder="Tags (comma-separated)"
      />

      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
        className="bg-white/10 text-white p3 rounded-xl w-full max-w-md mb-4"
      >
        <option value="public">Public</option>
        <option value="friends">Friends</option>
        <option value="subscribers">Subscribers</option>
        <option value="close_friends">Close Friends</option>
      </select>

      {mediaType === 'image' && imagePreview && (
        <>
          <div className="relative w-full max-w-md aspect-square bg-black mb-4 rounded-xl overflow-hidden">
            <Cropper
              image={imagePreview}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={true}
            />
          </div>

          <div className="mb-4 flex items-center w-full max-w-md">
            <label htmlFor="zoom-slider" className="mr-2 text-sm text-white/60">Zoom:</label>
            <input
              type="range"
              id="zoom-slider"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
        </>
      )}

      <button
        onClick={handleUpload}
        className="mt6 bg-purple-500 text-white px5 py3 rounded-2xl shadow-md text-sm font-semibold disabled:opacity-50 w-full max-w-md"
        disabled={!user || loading || (mediaType === 'image' && imageUploadBlocked) || (mediaType === 'video' && !title.trim())}
      >
        {loading ? 'Posting...' : mediaType === 'video' ? 'Upload Video' : 'Post'}
      </button>
    </div>
  );
}
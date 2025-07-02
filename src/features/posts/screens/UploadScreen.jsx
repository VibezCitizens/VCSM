import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import getCroppedImg from '@/lib/cropImage';

const UPLOAD_ENDPOINT = 'https://upload-post-media-worker.olivertrest3.workers.dev';

export default function UploadScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tags, setTags] = useState(''); // State to hold the raw tag input string
  const [visibility, setVisibility] = useState('public');
  const [postType, setPostType] = useState('photo');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const onCropComplete = (_, croppedPixels) => setCroppedAreaPixels(croppedPixels);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setMediaType(selected.type.startsWith('image/') ? 'image' : '');
    setImagePreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to post.');
      return;
    }

    if (!file || mediaType !== 'image') {
      toast.error('Image required for photo posts.');
      return;
    }

    // Daily limit: 1 image post per 24h
    // This check should ideally happen server-side (via Supabase function or RLS)
    // for robust security, but client-side is fine for a first layer.
    const { data: recentPosts, error: fetchErr } = await supabase
      .from('posts')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('media_type', 'image')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchErr) {
      console.error('Supabase fetch error checking post history:', fetchErr);
      toast.error('Error checking post history. Please try again.');
      return;
    }

    if (recentPosts?.length > 0) {
      const lastPostTime = new Date(recentPosts[0].created_at).getTime();
      const now = Date.now();
      if ((now - lastPostTime) < 24 * 60 * 60 * 1000) {
        toast.error('Only 1 image post allowed every 24 hours. Please wait before posting another image.');
        return;
      }
    }

    try {
      // Get the cropped image blob
      const croppedBlob = await getCroppedImg(imagePreview, croppedAreaPixels);
      if (!croppedBlob) {
        toast.error('Failed to crop image.');
        return;
      }

      // Generate a unique key for Cloudflare R2
      const key = `posts/${user.id}/${Date.now()}-cropped.jpg`;

      // Prepare FormData for Cloudflare Worker upload
      const form = new FormData();
      form.append('file', croppedBlob, key.split('/').pop()); // Add filename to blob for worker
      form.append('key', key);

      // Upload to Cloudflare Worker
      const res = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errorText = await res.text(); // Get raw error message from worker
        console.error('Cloudflare upload response not OK:', res.status, errorText);
        toast.error(`Cloudflare upload failed: ${errorText.substring(0, 100)}...`); // Show part of error
        return;
      }

      const { url } = await res.json();
      if (!url) {
        console.error('Cloudflare Worker response missing URL:', await res.text());
        toast.error('Missing uploaded URL from Cloudflare. Check worker logs.');
        return;
      }

      // Process tags for Supabase TEXT[] column
      const rawTags = tags.trim();
      const processedTags = rawTags
        .replace(/,/g, ' ') // Replace commas with spaces
        .split(' ')         // Split by spaces
        .map(tag => tag.startsWith('#') ? tag.substring(1) : tag) // Remove '#' prefix
        .map(tag => tag.trim()) // Trim whitespace from each tag
        .filter(tag => tag); // Filter out any empty strings

      // Insert post data into Supabase
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        text: text.trim(),
        media_url: url,
        media_type: 'image',
        tags: processedTags, // This is the processed array of tags
        visibility,
        post_type: postType,
      });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        toast.error(`Supabase post failed: ${insertError.message}`);
        return;
      }

      toast.success('Posted!');
      navigate('/'); // Redirect to home or feed after successful post
    } catch (err) {
      console.error('Unexpected upload error:', err);
      toast.error('An unexpected error occurred during upload.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-neutral-900 min-h-screen text-white">
      <h1 className="text-xl font-bold mb-4 text-white">Upload a Photo</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 mb-3 text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        placeholder="Write a caption..."
        rows={3}
      />

      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 mb-3 text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        placeholder="Tags (e.g., #life #happy or life, happy)"
      />

      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 mb-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      >
        <option value="public">Public</option>
        <option value="friends">Friends</option>
        <option value="subscribers">Subscribers</option>
        <option value="close_friends">Close Friends</option>
      </select>

      <label htmlFor="file-upload" className="block w-full py-2 px-4 bg-neutral-700 text-white text-center rounded cursor-pointer hover:bg-neutral-600 transition-colors mb-3">
        {file ? `Selected: ${file.name}` : 'Select Image'}
      </label>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden" // Hide the default input
      />


      {imagePreview && (
        <>
          <div className="relative w-full aspect-square bg-black mb-3 rounded overflow-hidden">
            <Cropper
              image={imagePreview}
              crop={crop}
              zoom={zoom}
              aspect={1} // Enforce 1:1 aspect ratio for cropping
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={true}
              classes={{ containerClassName: 'cropper-container', mediaClassName: 'cropper-image' }}
            />
          </div>
          {/* Optional: Zoom slider for better UX */}
          <div className="mb-3 flex items-center">
            <label htmlFor="zoom-slider" className="mr-2 text-sm text-neutral-400">Zoom:</label>
            <input
              type="range"
              id="zoom-slider"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </>
      )}

      <button
        onClick={handleUpload}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!user || !file || mediaType !== 'image'} // Disable if not ready to upload
      >
        Post
      </button>
    </div>
  );
}
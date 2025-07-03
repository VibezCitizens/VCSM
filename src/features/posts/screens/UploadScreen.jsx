import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import getCroppedImg from '@/lib/cropImage';
import { getTimeRemaining } from '@/utils/getTimeRemaining';

const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';

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
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [postType, setPostType] = useState('photo');
  const [imageUploadBlocked, setImageUploadBlocked] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(0);

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

    const { data: recentPosts, error: fetchErr } = await supabase
      .from('posts')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('media_type', 'image')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchErr) {
      console.error('Supabase fetch error:', fetchErr);
      toast.error('Error checking post history.');
      return;
    }

    if (recentPosts?.length > 0) {
      const lastPostTime = new Date(recentPosts[0].created_at).getTime();
      const now = Date.now();
      const limit = 3 * 60 * 60 * 1000; // 3-hour cooldown

      if ((now - lastPostTime) < limit) {
        const { hours, minutes } = getTimeRemaining(recentPosts[0].created_at);
        setHoursRemaining(hours);
        setMinutesRemaining(minutes);
        setImageUploadBlocked(true);
        toast.error(`Wait ${hours}h ${minutes}m before uploading another image.`);
        return;
      }
    }

    try {
      const croppedBlob = await getCroppedImg(imagePreview, croppedAreaPixels);
      if (!croppedBlob) {
        toast.error('Failed to crop image.');
        return;
      }

      const key = `posts/${user.id}/${Date.now()}-cropped.jpg`;

      const form = new FormData();
      form.append('file', croppedBlob, key.split('/').pop());
      form.append('path', `posts/${user.id}`);

      const res = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload failed:', res.status, errorText);
        toast.error(`Upload failed: ${errorText.slice(0, 80)}...`);
        return;
      }

      const { url } = await res.json();
      if (!url) {
        toast.error('Upload success but no URL returned.');
        return;
      }

      const processedTags = tags
        .replace(/,/g, ' ')
        .split(' ')
        .map(tag => tag.startsWith('#') ? tag.slice(1) : tag)
        .map(tag => tag.trim())
        .filter(Boolean);

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        text: text.trim(),
        media_url: url,
        media_type: 'image',
        tags: processedTags,
        visibility,
        post_type: postType,
      });

      if (insertError) {
        console.error('Insert failed:', insertError);
        toast.error(`Post error: ${insertError.message}`);
        return;
      }

      toast.success('Posted!');
      navigate('/');
    } catch (err) {
      console.error('Unexpected upload error:', err);
      toast.error('Unexpected error.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-neutral-900 min-h-screen text-white">
      <h1 className="text-xl font-bold mb-4 text-white">Upload a Photo</h1>

      {imageUploadBlocked && (
        <div className="bg-red-600 text-white text-sm text-center p-3 rounded mb-4">
          Wait {hoursRemaining}h {minutesRemaining}m before posting again.
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 mb-3 text-white placeholder-neutral-500"
        placeholder="Write a caption..."
        rows={3}
      />

      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 mb-3 text-white placeholder-neutral-500"
        placeholder="Tags (e.g. #sunset #travel)"
      />

      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 border border-neutral-700 mb-3 text-white"
      >
        <option value="public">Public</option>
        <option value="friends">Friends</option>
        <option value="subscribers">Subscribers</option>
        <option value="close_friends">Close Friends</option>
      </select>

      <label htmlFor="file-upload" className="block w-full py-2 px-4 bg-neutral-700 text-white text-center rounded cursor-pointer hover:bg-neutral-600 transition mb-3">
        {file ? `Selected: ${file.name}` : 'Select Image'}
      </label>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {imagePreview && (
        <>
          <div className="relative w-full aspect-square bg-black mb-3 rounded overflow-hidden">
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

          <div className="mb-3 flex items-center">
            <label htmlFor="zoom-slider" className="mr-2 text-sm text-neutral-400">Zoom:</label>
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
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold disabled:opacity-50"
        disabled={!user || !file || mediaType !== 'image' || imageUploadBlocked}
      >
        Post
      </button>
    </div>
  );
}

import { useRef } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabaseClient';

const R2_PUBLIC = 'https://cdn.vibezcitizens.com';
const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
  onPhotoChange,
  onToggleQR,
  qrOpen = false,
  onEdit,
}) {
  const fileRef = useRef();

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      const key = `profile-pictures/${profile.id}.jpg`;
      const form = new FormData();
      form.append('file', compressed);
      form.append('key', key);

      const res = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) throw new Error('Upload failed');

      const photoUrl = `${R2_PUBLIC}/${key}`;
      const { error } = await supabase
        .from('profiles')
        .update({ photo_url: photoUrl })
        .eq('id', profile.id);

      if (error) throw new Error(error.message);
      toast.success('Photo updated!');
      onPhotoChange?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Upload failed.');
    }
  };

  return (
    <div className="bg-neutral-900 rounded-xl mx-4 mt-6 p-5 flex items-center justify-between shadow-md min-h-[140px]">
      {/* Left side: text */}
      <div className="flex flex-col justify-center space-y-1 text-left max-w-[70%]">
        <h1 className="text-xl font-semibold leading-tight">
          {profile.display_name || 'Unnamed'}
        </h1>
        <p className="text-sm text-gray-400 leading-snug">
          {profile.bio || 'No bio yet.'}
        </p>
        {typeof profile.subscriber_count === 'number' && (
          <p className="text-sm text-purple-400">
            {profile.subscriber_count} Subscriber
            {profile.subscriber_count !== 1 && 's'}
          </p>
        )}
        {isOwnProfile && (
          <div className="flex gap-4 mt-1">
            <button
              onClick={onToggleQR}
              className="text-xs text-purple-400 hover:underline"
            >
              {qrOpen ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            <button
              onClick={onEdit}
              className="text-xs text-purple-400 hover:underline"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Right side: image */}
      <div className="relative group w-24 h-24 shrink-0 ml-4">
        <img
          src={profile.photo_url || '/default-avatar.png'}
          alt={profile.display_name || 'User'}
          className="w-full h-full object-cover rounded-xl border border-neutral-700 shadow-sm"
        />
        {isOwnProfile && (
          <>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileRef}
              onChange={handlePhotoUpload}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition rounded-xl"
            >
              Change
            </button>
          </>
        )}
      </div>
    </div>
  );
}

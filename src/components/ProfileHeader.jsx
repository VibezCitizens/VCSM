import { useRef } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabaseClient';

const R2_PUBLIC = 'https://pub-47d41a9f87d148c9a7a41a636e23cb46.r2.dev';
const UPLOAD_ENDPOINT = 'https://upload-profile-worker.olivertrest3.workers.dev';

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
  onPhotoChange, // Callback for parent to re-fetch profile data
  onToggleQR,
  qrOpen = false,
  onEdit,
}) {
  const fileRef = useRef();

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      // Compress the image before uploading
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,           // Max size in MB (0.5 MB = 500 KB)
        maxWidthOrHeight: 600,    // Max width or height of the image
        useWebWorker: true,       // Use web worker for better performance
      });

      // Define the key for Cloudflare R2. This will overwrite previous images for the same profile.
      const key = `profile-pictures/${profile.id}.jpg`; // Using .jpg for consistency

      // Create FormData to send the file and key to the Cloudflare Worker
      const form = new FormData();
      form.append('file', compressed);
      form.append('key', key);

      // Upload to Cloudflare R2 via your worker
      const res = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errorText = await res.text(); // Get more detailed error from worker
        throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${errorText}`);
      }

      // Construct the public URL of the uploaded photo
      const photoUrl = `${R2_PUBLIC}/${key}`;

      // Update the photo_url in the Supabase 'profiles' table
      const { error } = await supabase
        .from('profiles')
        .update({ photo_url: photoUrl })
        .eq('id', profile.id); // Ensure you update the correct profile

      if (error) {
        throw new Error('Failed to update profile in database: ' + error.message);
      }

      toast.success('Photo updated successfully!');
      // Call the callback function passed from the parent to update its state
      onPhotoChange?.();

    } catch (err) {
      console.error('Error uploading photo:', err);
      toast.error(err.message || 'An unknown error occurred during photo upload.');
    }
  };

  return (
    <div className="bg-gradient-to-b from-neutral-900 to-black text-center p-4 rounded-b-3xl shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="relative group">
          {/* Display the profile photo or default avatar */}
          <img
            src={profile.photo_url || '/default-avatar.png'}
            alt={profile.display_name || 'User Avatar'} // Improved alt text
            className="w-36 h-24 rounded-xl object-cover border border-neutral-700 shadow-sm"
          />
          {/* Show "Change" button only if it's the user's own profile */}
          {isOwnProfile && (
            <>
              {/* Hidden file input, triggered by the button */}
              <input
                type="file"
                accept="image/*" // Accept only image files
                ref={fileRef}
                onChange={handlePhotoChange} // Attach the handler
                hidden
              />
              {/* Overlay button to trigger file input */}
              <button
                type="button"
                onClick={() => fileRef.current.click()} // Clicks the hidden input
                className="absolute inset-0 w-full h-full bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl" // Added flex for centering
              >
                Change
              </button>
            </>
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold">{profile.display_name || 'Unnamed'}</h1>
          <p className="text-sm text-gray-400 mt-1">{profile.bio || 'No bio yet.'}</p>
        </div>

        {isOwnProfile && (
          <div className="flex flex-col items-center mt-2 gap-1">
            <button
              onClick={onToggleQR}
              className="text-xs text-purple-300 hover:text-purple-400"
            >
              {qrOpen ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            <button
              onClick={onEdit}
              className="text-xs text-purple-300 hover:text-purple-400"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
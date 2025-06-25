export const uploadProfilePicture = async (file) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://upload-profile-worker.olivertrest3.workers.dev', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Upload failed');

  const data = await response.json();
  return data.url; // Cloudflare R2 public URL
};

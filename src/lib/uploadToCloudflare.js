export async function uploadToCloudflare(file, path) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path); // Your worker will use this to determine R2 key

  try {
    const res = await fetch('https://upload.vibezcitizens.com', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      return { url: null, error };
    }

    const { url } = await res.json();
    return { url, error: null };
  } catch (err) {
    return { url: null, error: err.message };
  }
}

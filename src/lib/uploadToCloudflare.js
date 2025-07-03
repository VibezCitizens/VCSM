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
      // Try to parse JSON error (Worker may send plain text)
      let errorText = '';
      try {
        errorText = await res.text();
      } catch (e) {
        errorText = `Unknown error (status ${res.status})`;
      }

      return {
        url: null,
        error: `Upload failed: ${res.status} ${errorText}`,
      };
    }

    const data = await res.json();
    if (!data.url) {
      return {
        url: null,
        error: `Upload succeeded but response missing 'url'`,
      };
    }

    return { url: data.url, error: null };
  } catch (err) {
    return {
      url: null,
      error: `Upload exception: ${err.message}`,
    };
  }
}

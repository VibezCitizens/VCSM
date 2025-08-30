import { useEffect, useState, useCallback } from 'react';

export function useFileSelection({
  accept = undefined,           // e.g. 'image/*,video/*'
  maxBytes = undefined,         // e.g. 25 * 1024 * 1024
  onInvalidFile = undefined,    // (reason: string) => void
} = {}) {
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');       // 'image' | 'video' | ''
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  // Revoke preview URL on unmount or when it changes
  useEffect(() => {
    return () => { if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl); };
  }, [filePreviewUrl]);

  const resetFile = useCallback(() => {
    setFile(null);
    setMediaType('');
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
  }, [filePreviewUrl]);

  const handleFileChange = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (!selected) return resetFile();

    // Optional early validation
    if (maxBytes && selected.size > maxBytes) {
      onInvalidFile?.(`File exceeds ${Math.round(maxBytes / (1024*1024))}MB.`);
      return resetFile();
    }
    if (accept && !selected.type) {
      // If browser didn't give a type, allow; your upload flow re-validates.
    }

    setFile(selected);

    const type =
      selected.type?.startsWith('image/')
        ? 'image'
        : selected.type?.startsWith('video/')
        ? 'video'
        : ''; // UI hint only; upload flow re-checks robustly.

    setMediaType(type);

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(URL.createObjectURL(selected));
  }, [filePreviewUrl, maxBytes, accept, onInvalidFile, resetFile]);

  return { file, mediaType, filePreviewUrl, handleFileChange, resetFile };
}

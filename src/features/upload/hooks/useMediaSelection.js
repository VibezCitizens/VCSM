// src/features/upload/hooks/useMediaSelection.js
import { useMemo, useRef, useState } from "react";
import { classifyFile } from "../lib/classifyFile";

const MAX_VIBES_PHOTOS = 10;

export function useMediaSelection({ mode }) {
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);       // File[]
  const [mediaTypes, setMediaTypes] = useState([]); // string[]
  const [fileUrls, setFileUrls] = useState([]); // string[]
  const [error, setError] = useState("");

  const isVibes = mode === "post";

  const remainingSlots = useMemo(() => {
    if (!isVibes) return 1;
    return Math.max(0, MAX_VIBES_PHOTOS - files.length);
  }, [isVibes, files.length]);

  function pick() {
    inputRef.current?.click();
  }

  function revokeUrls(urls) {
    (urls || []).forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
  }

  function clear() {
    revokeUrls(fileUrls);
    setFiles([]);
    setMediaTypes([]);
    setFileUrls([]);
  }

  function removeAt(idx) {
    const removedUrl = fileUrls[idx];
    if (removedUrl) {
      try {
        URL.revokeObjectURL(removedUrl);
      } catch {}
    }

    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setMediaTypes((prev) => prev.filter((_, i) => i !== idx));
    setFileUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleChosen(fileList) {
    const picked = Array.from(fileList || []);
    if (picked.length === 0) return;

    // reset so re-picking same images triggers change
    if (inputRef.current) inputRef.current.value = "";

    // ------------------------------------------------------------
    // NON-VIBES: SINGLE FILE
    // ------------------------------------------------------------
    if (!isVibes) {
      const f = picked[0];
      if (!f) return;

      const check = classifyFile(f);
      if (check.error) {
        setError(check.error);
        return;
      }

      setError("");
      clear();
      setFiles([f]);
      setMediaTypes([check.type]);
      setFileUrls([URL.createObjectURL(f)]);
      return;
    }

    // ------------------------------------------------------------
    // VIBES: IMAGES ONLY, HARD CAP 10 (UI never holds > 10)
    // ------------------------------------------------------------
    const pickedImages = picked.filter((f) =>
      String(f?.type || "").startsWith("image/")
    );

    if (pickedImages.length === 0) {
      setError("VIBES: please select images only (up to 10).");
      return;
    }

    if (remainingSlots <= 0) {
      setError(`You can upload up to ${MAX_VIBES_PHOTOS} photos at a time.`);
      return;
    }

    const willAdd = pickedImages.slice(0, remainingSlots);

    if (pickedImages.length > remainingSlots) {
      setError(
        `You can upload up to ${MAX_VIBES_PHOTOS} photos at a time. Extra selections were ignored.`
      );
    } else {
      setError("");
    }

    const nextFiles = [];
    const nextTypes = [];
    const nextUrls = [];

    for (const f of willAdd) {
      const check = classifyFile(f);
      if (check.error) {
        setError(check.error);
        revokeUrls(nextUrls);
        return;
      }
      if (check.type !== "image") {
        setError("VIBES: only images are allowed for multi-upload.");
        revokeUrls(nextUrls);
        return;
      }

      nextFiles.push(f);
      nextTypes.push(check.type);
      nextUrls.push(URL.createObjectURL(f));
    }

    setFiles((prev) => [...prev, ...nextFiles].slice(0, MAX_VIBES_PHOTOS));
    setMediaTypes((prev) => [...prev, ...nextTypes].slice(0, MAX_VIBES_PHOTOS));
    setFileUrls((prev) => [...prev, ...nextUrls].slice(0, MAX_VIBES_PHOTOS));
  }

  return {
    inputRef,
    isVibes,
    files,
    mediaTypes,
    fileUrls,
    error,
    setError,
    pick,
    clear,
    removeAt,
    handleChosen,
  };
}

export { MAX_VIBES_PHOTOS };

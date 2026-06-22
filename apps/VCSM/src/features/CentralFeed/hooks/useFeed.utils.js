const FEED_FETCH_TIMEOUT_MS = 15_000;
const FIRST_BATCH_MEDIA_PRELOAD_TIMEOUT_MS = 2_500;
const INITIAL_VISIBLE_TARGET = 3;

export function withTimeout(promise, ms = FEED_FETCH_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Feed fetch timeout")), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

function collectInitialImageUrls(posts, postLimit = INITIAL_VISIBLE_TARGET) {
  return (Array.isArray(posts) ? posts : [])
    .slice(0, postLimit)
    .map((post) => {
      const media = Array.isArray(post?.media) ? post.media : [];
      const firstImage = media.find((m) => m?.type === "image" && typeof m?.url === "string");
      return firstImage?.url ?? null;
    })
    .filter(Boolean);
}

function preloadImage(src, timeoutMs = FIRST_BATCH_MEDIA_PRELOAD_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(false);
      return;
    }

    const img = new Image();
    let settled = false;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };

    const timeoutId = setTimeout(() => finish(false), timeoutMs);

    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.decoding = "async";
    img.src = src;

    if (img.complete) {
      finish(true);
      return;
    }

    if (typeof img.decode === "function") {
      img.decode().then(() => finish(true)).catch(() => {});
    }
  });
}

export async function preloadInitialMedia(posts) {
  const urls = collectInitialImageUrls(posts);
  if (urls.length === 0) return;
  await Promise.allSettled(urls.map((src) => preloadImage(src)));
}

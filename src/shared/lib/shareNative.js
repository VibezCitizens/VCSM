// src/shared/lib/shareNative.js

export async function shareNative({ title = "", text = "", url = "" }) {
  const payload = { title, text, url };

  if (!("share" in navigator)) {
    return { ok: false, reason: "no-web-share" };
  }

  try {
    await navigator.share(payload);
    return { ok: true };
  } catch (err) {
    // user cancel is normal on iOS
    return { ok: false, reason: "share-failed", error: err };
  }
}

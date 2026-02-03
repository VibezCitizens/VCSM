export async function copyToClipboard(text) {
  const value = String(text ?? "");
  if (!value) return { ok: false, error: "Nothing to copy" };

  // Modern API (works on iOS Safari when triggered by a user click)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return { ok: true };
    }
  } catch (e) {
    // fall through
  }

  // Fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message ?? "Copy failed" };
  }
}

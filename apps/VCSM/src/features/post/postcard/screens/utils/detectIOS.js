export function detectIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIPhoneIPadIPod = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS13Plus =
    /Macintosh/.test(ua) &&
    typeof document !== "undefined" &&
    "ontouchend" in document;
  return isIPhoneIPadIPod || isIPadOS13Plus;
}

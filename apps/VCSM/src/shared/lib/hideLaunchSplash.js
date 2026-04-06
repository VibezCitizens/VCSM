export function hideLaunchSplash() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("vc:splash:hide"));
}


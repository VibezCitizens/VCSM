// src/app/platform/ios/ios.env.js
export const isIOS = () => {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export const isIOSPWA = () => {
  if (typeof window === 'undefined') return false
  return window.navigator.standalone === true
}

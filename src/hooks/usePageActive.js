// src/hooks/usePageActive.js
import { useEffect, useState } from 'react';

export function usePageActive() {
  const [active, setActive] = useState(!document.hidden);
  useEffect(() => {
    const onVis = () => setActive(!document.hidden);
    const onFocus = () => setActive(true);
    const onBlur  = () => setActive(false);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
  return active;
}

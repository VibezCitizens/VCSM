// src/components/InstallPromptButton.jsx
import { useEffect, useState } from 'react';

export default function InstallPromptButton() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    const prompt = window.deferredPrompt;
    if (prompt) {
      prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === 'accepted') {
        console.log('User accepted PWA install');
      } else {
        console.log('User dismissed PWA install');
      }
      window.deferredPrompt = null;
      setCanInstall(false);
    }
  };

  if (!canInstall) return null;

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-20 right-4 bg-purple-600 text-white px-4 py-2 rounded-xl shadow-xl z-50"
    >
      Install App
    </button>
  );
}

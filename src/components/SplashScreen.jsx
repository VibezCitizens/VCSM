// src/components/SplashScreen.jsx
import { useEffect, useState } from "react";

export default function SplashScreen({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for 2–3s OR until your app data is ready
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-black">
        <img
          src="/VCSM.jpg"
          alt="Vibez Citizens Splash"
          className="max-w-[80%] max-h-[80%] object-contain animate-fade"
        />
      </div>
    );
  }

  return children;
}

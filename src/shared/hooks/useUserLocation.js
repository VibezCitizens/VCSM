import { useState, useCallback } from "react";
import { supabase } from "@/services/supabase/supabaseClient";

const SESSION_KEY = "vc:lastLocationText";

export default function useUserLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cacheLocation = (value) => {
    try {
      if (value) sessionStorage.setItem(SESSION_KEY, value);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  };

  const getCachedLocation = () => {
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  };

  // ============================================================
  // 📍 GPS → City (primary)
  // ============================================================
  const resolveLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;

            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;

            if (!token) {
              setError("Not authenticated");
              resolve(null);
              return;
            }

            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reverse-geocode?lat=${latitude}&lon=${longitude}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!res.ok) {
              setError("Location lookup failed");
              resolve(null);
              return;
            }

            const json = await res.json();
            const location = json?.location ?? null;

            if (location) cacheLocation(location);
            resolve(location);
          } catch (err) {
            console.error("[useUserLocation]", err);
            setError("Failed to resolve location");
            resolve(null);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setError("Permission denied");
          } else {
            setError("Location unavailable");
          }
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        }
      );
    });
  }, []);

  // ============================================================
  // 🔍 Manual city search fallback
  // ============================================================
  const searchCity = useCallback(async (query) => {
    if (!query || query.length < 2) return [];

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return [];

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reverse-geocode?search=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return [];

      const json = await res.json();

      // expected: { results: string[] }
      return Array.isArray(json?.results) ? json.results : [];
    } catch (err) {
      console.error("[searchCity]", err);
      return [];
    }
  }, []);

  return {
    resolveLocation,
    searchCity,        // ✅ now exists
    loading,
    error,
    getCachedLocation,
    cacheLocation,
  };
}

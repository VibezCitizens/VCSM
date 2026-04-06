import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import MentionChips from "@/features/upload/ui/MentionChips";
import MentionTypeahead from "@/features/upload/ui/MentionTypeahead";
import { useMentionAutocomplete } from "@/features/upload/hooks/useMentionAutocomplete";
import useUserLocation from "@/shared/hooks/useUserLocation";

export default function CaptionCard({
  caption,
  setCaption,
  mentions,
  setMentions,
  onRemoveMention,
  locationText,
  setLocationText,
}) {
  const taRef = useRef(null);

  const {
    resolveLocation,
    searchCity,
    getCachedLocation,
    cacheLocation,
    loading: locating,
    error: locationError,
  } = useUserLocation();
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState([]);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);

  useEffect(() => {
    if (!locationText) {
      const cached = getCachedLocation();
      if (cached) setLocationText(cached);
    }
  }, [getCachedLocation, locationText, setLocationText]);

  const safeCaption = String(caption ?? "");
  const mentionAutocomplete = useMentionAutocomplete({
    value: safeCaption,
    inputRef: taRef,
  });
  const { open, items, loading, onCaretEvent, apply } = mentionAutocomplete;

  useEffect(() => {
    let alive = true;
    async function run() {
      const q = String(cityQuery || "").trim();
      if (q.length < 2) {
        setCityResults([]);
        return;
      }
      const results = await searchCity(q);
      if (!alive) return;
      setCityResults(Array.isArray(results) ? results.slice(0, 6) : []);
    }
    run();
    return () => {
      alive = false;
    };
  }, [cityQuery, searchCity]);

  function handlePick(item) {
    const handle = String(item?.handle || "").toLowerCase();
    if (!handle) return;
    const nextText = apply({ handle });
    if (typeof nextText !== "string") return;

    setCaption(nextText);
    setMentions?.((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.some((m) => m.handle === handle)) return list;
      return [
        ...list,
        {
          handle,
          actorId: item?.actor_id ?? item?.actorId ?? null,
          kind: item?.kind ?? null,
          displayName: item?.display_name ?? item?.displayName ?? null,
          avatarUrl: item?.photo_url ?? item?.avatarUrl ?? null,
          },
      ];
    });
  }

  async function applyResolvedLocation() {
    const loc = await resolveLocation();
    if (loc) {
      setLocationText(loc);
      setCityQuery("");
      setCityResults([]);
    }
  }

  async function getGeolocationPermissionState() {
    if (typeof navigator === "undefined") return "prompt";
    if (!navigator.permissions?.query) return "prompt";

    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      return status?.state ?? "prompt";
    } catch {
      return "prompt";
    }
  }

  async function handleUseMyLocation() {
    const permissionState = await getGeolocationPermissionState();
    if (permissionState === "granted") {
      await applyResolvedLocation();
      return;
    }

    setLocationPromptOpen(true);
  }

  async function handleConfirmLocationPrompt() {
    setLocationPromptOpen(false);
    await applyResolvedLocation();
  }

  function handlePickCity(city) {
    setLocationText(city);
    cacheLocation(city);
    setCityQuery("");
    setCityResults([]);
  }

  function handleRemoveLocation() {
    setLocationText("");
    cacheLocation(null);
    setCityQuery("");
    setCityResults([]);
  }

  return (
    <div className="upload-card module-modern-card mt-6 overflow-visible rounded-3xl">
      <textarea
        ref={taRef}
        value={safeCaption}
        onChange={(e) => setCaption(e.target.value)}
        onSelect={onCaretEvent}
        onKeyUp={onCaretEvent}
        rows={3}
        placeholder="Write a caption... (use @ to tag)"
        className="upload-caption-area w-full resize-none bg-transparent px-5 py-4 placeholder:text-slate-500 focus:outline-none"
      />

      <div className="px-5">
        <MentionTypeahead open={open} items={items} onPick={handlePick} />
        {loading && open ? <div className="py-2 text-xs text-slate-400">Searching...</div> : null}
      </div>

      <div className="px-5 pb-3">
        <MentionChips mentions={mentions} onRemove={onRemoveMention} />
      </div>

      <div className="upload-divider" />

      <div className="flex items-center gap-3 px-5 py-3">
        <div className="relative flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="text-slate-400 transition hover:text-slate-200"
            aria-label="Use my location"
          >
            {locating ? "..." : <MapPin size={17} />}
          </button>

          <input
            value={locationText}
            onChange={(e) => {
              setLocationText(e.target.value);
              setCityQuery(e.target.value);
            }}
            placeholder="Add location"
            className="min-w-0 flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />

          {locationText ? (
            <button
              type="button"
              onClick={handleRemoveLocation}
              className="text-slate-400 transition hover:text-slate-200"
              aria-label="Remove location"
            >
              x
            </button>
          ) : null}

          {cityResults.length > 0 ? (
            <div className="upload-typeahead absolute top-full z-20 mt-2 w-full overflow-hidden rounded-xl">
              {cityResults.map((city) => (
                <button
                  key={city}
                  onClick={() => handlePickCity(city)}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/10 transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {locationError ? (
        <div className="px-5 pb-3 text-xs text-rose-300">
          {locationError === "Permission denied"
            ? "Location permission was denied. You can still type a city manually."
            : locationError}
        </div>
      ) : null}

      <LocationPermissionPrompt
        open={locationPromptOpen}
        onCancel={() => setLocationPromptOpen(false)}
        onConfirm={handleConfirmLocationPrompt}
      />
    </div>
  );
}

function LocationPermissionPrompt({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-sky-300/20 bg-[linear-gradient(180deg,rgba(16,24,46,0.98),rgba(8,12,24,0.96))] shadow-[0_24px_42px_rgba(0,0,0,0.45),0_0_22px_rgba(99,137,255,0.25)]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-100">Use current location?</h2>
        </div>

        <div className="px-5 py-4 text-sm text-slate-300">
          We will ask your browser for location permission to fill your city automatically.
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-sky-300/30 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

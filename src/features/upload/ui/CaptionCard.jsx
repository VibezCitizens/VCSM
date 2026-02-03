// src/features/upload/ui/CaptionCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import MentionChips from "@/features/upload/ui/MentionChips";
import MentionTypeahead from "@/features/upload/ui/MentionTypeahead";
import { searchMentionSuggestions } from "../dal/searchMentionSuggestions";
import useUserLocation from "@/shared/hooks/useUserLocation";

// =====================
// @ MENTION HELPERS
// =====================
function getActiveMentionQuery(text, caretIndex) {
  const t = String(text ?? "");
  const caret = Number.isFinite(caretIndex) ? caretIndex : 0;

  const left = t.slice(0, caret);
  const at = left.lastIndexOf("@");
  if (at === -1) return null;

  const between = left.slice(at + 1);
  if (!between.length) return "";
  if (/\s/.test(between)) return null;
  if (!/^[a-zA-Z0-9_.-]{0,32}$/.test(between)) return null;

  return between.toLowerCase();
}

function replaceActiveMention(text, caretIndex, handle) {
  const t = String(text ?? "");
  const caret = Number.isFinite(caretIndex) ? caretIndex : 0;

  const left = t.slice(0, caret);
  const right = t.slice(caret);

  const at = left.lastIndexOf("@");
  if (at === -1) return { nextText: t, nextCaret: caret };

  const beforeAt = t.slice(0, at);
  const insertion = `${handle}`;
  const needsSpace = right.length === 0 || !/^\s/.test(right);
  const space = needsSpace ? " " : "";

  const nextText = `${beforeAt}${insertion}${space}${right}`;
  const nextCaret = (beforeAt + insertion + space).length;

  return { nextText, nextCaret };
}

export default function CaptionCard({
  caption,
  setCaption,
  mentions,
  setMentions,
  onRemoveMention,
  locationText,
  setLocationText,
  visibility,
  setVisibility,
}) {
  const taRef = useRef(null);

  const [caret, setCaret] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // =====================
  // LOCATION
  // =====================
  const {
    resolveLocation,
    searchCity,
    getCachedLocation,
    cacheLocation,
    loading: locating,
  } = useUserLocation();

  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState([]);

  // restore cached location on mount
  useEffect(() => {
    if (!locationText) {
      const cached = getCachedLocation();
      if (cached) setLocationText(cached);
    }
  }, []);

  // =====================
  // @ MENTION LOGIC
  // =====================
  const safeCaption = String(caption ?? "");

  const activeQuery = useMemo(
    () => getActiveMentionQuery(safeCaption, caret),
    [safeCaption, caret]
  );

  useEffect(() => {
    let alive = true;

    async function run() {
      if (activeQuery === null || activeQuery.length < 1) {
        setOpen(false);
        setItems([]);
        return;
      }

      setLoading(true);
      try {
        const res = await searchMentionSuggestions(activeQuery, { limit: 8 });
        if (!alive) return;

        setItems(Array.isArray(res) ? res : []);
        setOpen(true);
      } catch {
        if (!alive) return;
        setItems([]);
        setOpen(false);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [activeQuery]);

  function handlePick(item) {
    const handle = String(item?.handle || "").toLowerCase();
    if (!handle) return;

    const el = taRef.current;
    const pos = el?.selectionStart ?? caret;

    const { nextText, nextCaret } = replaceActiveMention(
      safeCaption,
      pos,
      handle
    );

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

    setOpen(false);
    setItems([]);

    requestAnimationFrame(() => {
      taRef.current?.focus();
      taRef.current?.setSelectionRange(nextCaret, nextCaret);
      setCaret(nextCaret);
    });
  }

  // =====================
  // LOCATION HANDLERS
  // =====================
  async function handleUseMyLocation() {
    const loc = await resolveLocation();
    if (loc) setLocationText(loc);
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

  // =====================
  // RENDER
  // =====================
  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
      {/* CAPTION INPUT */}
      <textarea
        ref={taRef}
        value={safeCaption}
        onChange={(e) => setCaption(e.target.value)}
        onSelect={(e) => setCaret(e.target.selectionStart ?? 0)}
        onKeyUp={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
        rows={3}
        placeholder="Write a caption… (use @ to tag)"
        className="w-full px-5 py-4 bg-transparent text-white placeholder:text-white/35 focus:outline-none resize-none"
      />

      <div className="px-5">
        <MentionTypeahead open={open} items={items} onPick={handlePick} />
        {loading && open && (
          <div className="py-2 text-xs text-white/40">Searching…</div>
        )}
      </div>

      <div className="px-5 pb-3">
        <MentionChips mentions={mentions} onRemove={onRemoveMention} />
      </div>

      <div className="h-px bg-white/10" />

      {/* LOCATION */}
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0 relative">
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="text-white/35 text-xl hover:text-white transition"
          >
            {locating ? "⏳" : "📍"}
          </button>

          <input
            value={locationText}
            onChange={(e) => {
              setLocationText(e.target.value);
              setCityQuery(e.target.value);
            }}
            placeholder="Add location"
            className="flex-1 bg-transparent text-white/75 placeholder:text-white/30 focus:outline-none"
          />

          {locationText && (
            <button
              type="button"
              onClick={handleRemoveLocation}
              className="text-white/40 hover:text-white transition"
            >
              ✕
            </button>
          )}

          {cityResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-neutral-900 border border-white/10 rounded-xl overflow-hidden z-20">
              {cityResults.map((c) => (
                <button
                  key={c}
                  onClick={() => handlePickCity(c)}
                  className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

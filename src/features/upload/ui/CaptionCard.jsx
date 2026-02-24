import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import MentionChips from "@/features/upload/ui/MentionChips";
import MentionTypeahead from "@/features/upload/ui/MentionTypeahead";
import { searchMentionSuggestions } from "../dal/searchMentionSuggestions";
import useUserLocation from "@/shared/hooks/useUserLocation";

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
}) {
  const taRef = useRef(null);

  const [caret, setCaret] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const { resolveLocation, searchCity, getCachedLocation, cacheLocation, loading: locating } = useUserLocation();
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState([]);

  useEffect(() => {
    if (!locationText) {
      const cached = getCachedLocation();
      if (cached) setLocationText(cached);
    }
  }, [getCachedLocation, locationText, setLocationText]);

  const safeCaption = String(caption ?? "");

  const activeQuery = useMemo(() => getActiveMentionQuery(safeCaption, caret), [safeCaption, caret]);

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
    const el = taRef.current;
    const pos = el?.selectionStart ?? caret;
    const { nextText, nextCaret } = replaceActiveMention(safeCaption, pos, handle);
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

  async function handleUseMyLocation() {
    const loc = await resolveLocation();
    if (loc) {
      setLocationText(loc);
      setCityQuery("");
      setCityResults([]);
    }
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
    <div className="module-modern-card mt-6 overflow-visible rounded-3xl">
      <textarea
        ref={taRef}
        value={safeCaption}
        onChange={(e) => setCaption(e.target.value)}
        onSelect={(e) => setCaret(e.target.selectionStart ?? 0)}
        onKeyUp={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
        rows={3}
        placeholder="Write a caption... (use @ to tag)"
        className="w-full resize-none bg-transparent px-5 py-4 text-slate-100 placeholder:text-slate-500 focus:outline-none"
      />

      <div className="px-5">
        <MentionTypeahead open={open} items={items} onPick={handlePick} />
        {loading && open ? <div className="py-2 text-xs text-slate-500">Searching...</div> : null}
      </div>

      <div className="px-5 pb-3">
        <MentionChips mentions={mentions} onRemove={onRemoveMention} />
      </div>

      <div className="h-px bg-slate-300/10" />

      <div className="flex items-center gap-3 px-5 py-3">
        <div className="relative flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="text-slate-500 transition hover:text-slate-200"
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
            className="min-w-0 flex-1 bg-transparent text-slate-300 placeholder:text-slate-500 focus:outline-none"
          />

          {locationText ? (
            <button
              type="button"
              onClick={handleRemoveLocation}
              className="text-slate-500 transition hover:text-slate-200"
              aria-label="Remove location"
            >
              x
            </button>
          ) : null}

          {cityResults.length > 0 ? (
            <div className="module-modern-shell absolute top-full z-20 mt-2 w-full overflow-hidden rounded-xl">
              {cityResults.map((city) => (
                <button
                  key={city}
                  onClick={() => handlePickCity(city)}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                >
                  {city}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

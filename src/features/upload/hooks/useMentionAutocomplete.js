// src/features/upload/hooks/useMentionAutocomplete.js
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { searchMentionSuggestions } from "../dal/searchMentionSuggestions";

/**
 * Autocomplete mentions like Instagram:
 * - Watches caption text + caret position
 * - If user is currently typing "@prefix", fetch suggestions
 * - Lets you "apply" a selection which replaces that token in the text
 */
export function useMentionAutocomplete({ value, inputRef }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [range, setRange] = useState(null); // { start, end }

  const debounceRef = useRef(null);

  const computeActiveMention = useCallback(() => {
    const el = inputRef?.current;
    const text = String(value || "");
    if (!el) return { open: false, query: "", range: null };

    const caret = typeof el.selectionStart === "number" ? el.selectionStart : text.length;
    const left = text.slice(0, caret);

    // Find the last "@"
    const at = left.lastIndexOf("@");
    if (at < 0) return { open: false, query: "", range: null };

    // Must be start or preceded by whitespace
    const prev = at === 0 ? " " : left[at - 1];
    if (prev && !/\s/.test(prev)) return { open: false, query: "", range: null };

    // Extract token after "@"
    const typed = left.slice(at + 1);
    // Stop if it contains whitespace
    if (/\s/.test(typed)) return { open: false, query: "", range: null };

    // Only allow handle chars
    if (!/^[a-zA-Z0-9_.-]{0,32}$/.test(typed)) return { open: false, query: "", range: null };

    // If empty typed, you can still show suggestions or not. We'll require >= 1.
    if (typed.length < 1) return { open: false, query: "", range: null };

    return { open: true, query: typed.toLowerCase(), range: { start: at, end: caret } };
  }, [value, inputRef]);

  // Recompute when value changes or caret changes (keyup/click triggers)
  const sync = useCallback(() => {
    const state = computeActiveMention();
    setOpen(state.open);
    setQuery(state.query);
    setRange(state.range);
  }, [computeActiveMention]);

  useEffect(() => {
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Public: call on keyup/click to refresh caret detection
  const onCaretEvent = useCallback(() => {
    sync();
  }, [sync]);

  // Fetch suggestions (debounced)
  useEffect(() => {
    if (!open || !query) {
      setItems([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchMentionSuggestions(query, { limit: 8 });
        setItems(res || []);
      } catch (e) {
        console.warn("[useMentionAutocomplete] search failed:", e);
        setItems([]);
      }
    }, 120);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query]);

  // Apply selection: replaces "@typed" with "@handle "
  const apply = useCallback(
    (picked) => {
      const el = inputRef?.current;
      const text = String(value || "");
      if (!picked?.handle || !range) return text;

      const before = text.slice(0, range.start);
      const after = text.slice(range.end);

      const next = `${before}@${picked.handle} ${after}`.replace(/\s{2,}/g, " ");

      // move caret after inserted handle + space
      requestAnimationFrame(() => {
        try {
          if (!el) return;
          const pos = (before + `@${picked.handle} `).length;
          el.focus();
          el.setSelectionRange(pos, pos);
        } catch {}
      });

      setOpen(false);
      setItems([]);
      setQuery("");
      setRange(null);

      return next;
    },
    [value, inputRef, range]
  );

  const state = useMemo(
    () => ({
      open,
      query,
      items,
    }),
    [open, query, items]
  );

  return {
    ...state,
    onCaretEvent,
    apply,
    close: () => {
      setOpen(false);
      setItems([]);
      setQuery("");
      setRange(null);
    },
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";

import {
  DEFAULT_VEX_SETTINGS,
  normalizeVexSettings,
} from "@/features/chat/inbox/model/vexSettings.model";

const STORAGE_KEY_BASE = "vc.vex_settings";
const SETTINGS_EVENT = "vc.vex_settings.changed";

function buildStorageKey(actorId) {
  if (!actorId) return STORAGE_KEY_BASE;
  return `${STORAGE_KEY_BASE}:${actorId}`;
}

function safeParse(json) {
  try {
    const value = JSON.parse(json);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function readSettingsFromStorage(storageKey) {
  if (typeof window === "undefined") return DEFAULT_VEX_SETTINGS;
  const rawStr = window.localStorage.getItem(storageKey);
  const parsed = rawStr ? safeParse(rawStr) : null;
  return normalizeVexSettings(parsed);
}

function writeSettingsToStorage(storageKey, settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(settings));
}

function emitSettingsChanged(storageKey, settings) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SETTINGS_EVENT, {
      detail: {
        key: storageKey,
        settings,
      },
    })
  );
}

function sameSettings(a, b) {
  return (
    a?.hideEmptyConversations === b?.hideEmptyConversations &&
    a?.showThreadPreview === b?.showThreadPreview
  );
}

export default function useVexSettings() {
  const { identity } = useIdentity();
  const actorId = identity?.actorId ?? null;
  const storageKey = useMemo(() => buildStorageKey(actorId), [actorId]);

  const [settings, setSettings] = useState(() => readSettingsFromStorage(storageKey));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scopedRaw = window.localStorage.getItem(storageKey);
    const hasScoped = typeof scopedRaw === "string" && scopedRaw.length > 0;

    // One-time migration: move legacy shared key into actor-scoped key.
    if (
      storageKey !== STORAGE_KEY_BASE &&
      !hasScoped
    ) {
      const legacyRaw = window.localStorage.getItem(STORAGE_KEY_BASE);
      const legacyParsed = legacyRaw ? safeParse(legacyRaw) : null;
      if (legacyParsed) {
        const migrated = normalizeVexSettings(legacyParsed);
        writeSettingsToStorage(storageKey, migrated);
      }
    }

    const normalized = readSettingsFromStorage(storageKey);
    setSettings((prev) => (sameSettings(prev, normalized) ? prev : normalized));
    writeSettingsToStorage(storageKey, normalized);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onStorage = (event) => {
      if (event.key !== storageKey) return;
      setSettings(readSettingsFromStorage(storageKey));
    };

    const onInternalChange = (event) => {
      if (event?.detail?.key !== storageKey) return;
      const next = normalizeVexSettings(event?.detail?.settings);
      setSettings((prev) => (sameSettings(prev, next) ? prev : next));
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(SETTINGS_EVENT, onInternalChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SETTINGS_EVENT, onInternalChange);
    };
  }, [storageKey]);

  const setHideEmptyConversations = useCallback((value) => {
    const base = readSettingsFromStorage(storageKey);
    const next = normalizeVexSettings({
      ...base,
      hideEmptyConversations: Boolean(value),
    });
    writeSettingsToStorage(storageKey, next);
    emitSettingsChanged(storageKey, next);
    setSettings(next);
  }, [storageKey]);

  const setShowThreadPreview = useCallback((value) => {
    const base = readSettingsFromStorage(storageKey);
    const next = normalizeVexSettings({
      ...base,
      showThreadPreview: Boolean(value),
    });
    writeSettingsToStorage(storageKey, next);
    emitSettingsChanged(storageKey, next);
    setSettings(next);
  }, [storageKey]);

  return useMemo(
    () => ({
      settings,
      setHideEmptyConversations,
      setShowThreadPreview,
    }),
    [settings, setHideEmptyConversations, setShowThreadPreview]
  );
}

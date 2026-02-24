import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_VEX_SETTINGS,
  normalizeVexSettings,
} from "@/features/chat/inbox/model/vexSettings.model";

const STORAGE_KEY = "vc.vex_settings";
const SETTINGS_EVENT = "vc.vex_settings.changed";

function safeParse(json) {
  try {
    const value = JSON.parse(json);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function readSettingsFromStorage() {
  if (typeof window === "undefined") return DEFAULT_VEX_SETTINGS;
  const rawStr = window.localStorage.getItem(STORAGE_KEY);
  const parsed = rawStr ? safeParse(rawStr) : null;
  return normalizeVexSettings(parsed);
}

function writeSettingsToStorage(settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function emitSettingsChanged(settings) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
}

function sameSettings(a, b) {
  return (
    a?.hideEmptyConversations === b?.hideEmptyConversations &&
    a?.showThreadPreview === b?.showThreadPreview
  );
}

export default function useVexSettings() {
  const [settings, setSettings] = useState(() => readSettingsFromStorage());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const normalized = readSettingsFromStorage();
    setSettings((prev) => (sameSettings(prev, normalized) ? prev : normalized));
    writeSettingsToStorage(normalized);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      setSettings(readSettingsFromStorage());
    };

    const onInternalChange = (event) => {
      const next = normalizeVexSettings(event?.detail);
      setSettings((prev) => (sameSettings(prev, next) ? prev : next));
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(SETTINGS_EVENT, onInternalChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SETTINGS_EVENT, onInternalChange);
    };
  }, []);

  const setHideEmptyConversations = useCallback((value) => {
    const base = readSettingsFromStorage();
    const next = normalizeVexSettings({
      ...base,
      hideEmptyConversations: Boolean(value),
    });
    writeSettingsToStorage(next);
    emitSettingsChanged(next);
    setSettings(next);
  }, []);

  const setShowThreadPreview = useCallback((value) => {
    const base = readSettingsFromStorage();
    const next = normalizeVexSettings({
      ...base,
      showThreadPreview: Boolean(value),
    });
    writeSettingsToStorage(next);
    emitSettingsChanged(next);
    setSettings(next);
  }, []);

  return useMemo(
    () => ({
      settings,
      setHideEmptyConversations,
      setShowThreadPreview,
    }),
    [settings, setHideEmptyConversations, setShowThreadPreview]
  );
}

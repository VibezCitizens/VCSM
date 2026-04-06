import { useCallback, useEffect, useMemo, useState } from "react";
import {
  archiveAdUseCase,
  createDraftUseCase,
  deleteAdUseCase,
  listAdsUseCase,
  pauseAdUseCase,
  publishAdUseCase,
  saveDraftUseCase,
} from "@/features/ads/usecases/adPipeline.usecase";

export function useVportAds(actorId) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!actorId) {
      setAds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listAdsUseCase(actorId);
      setAds(rows);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => {
    load();
  }, [load]);

  const createDraft = useCallback(() => {
    const draft = createDraftUseCase(actorId);
    setAds((prev) => [draft, ...prev]);
    return draft;
  }, [actorId]);

  const saveDraft = useCallback(async (ad) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveDraftUseCase(ad);
      setAds((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
      return saved;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const publish = useCallback(async (ad) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await publishAdUseCase(ad);
      setAds((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
      return saved;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const pause = useCallback(async (ad) => {
    const saved = await pauseAdUseCase(ad);
    setAds((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
  }, []);

  const archive = useCallback(async (ad) => {
    const saved = await archiveAdUseCase(ad);
    setAds((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
  }, []);

  const remove = useCallback(async (id) => {
    await deleteAdUseCase(id);
    setAds((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return useMemo(
    () => ({
      ads,
      loading,
      saving,
      error,
      reload: load,
      createDraft,
      saveDraft,
      publish,
      pause,
      archive,
      remove,
    }),
    [ads, loading, saving, error, load, createDraft, saveDraft, publish, pause, archive, remove]
  );
}

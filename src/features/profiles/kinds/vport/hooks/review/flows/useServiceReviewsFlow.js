// src/features/profiles/kinds/vport/hooks/review/flows/useServiceReviewsFlow.js
import { useMemo, useState } from "react";

import {
  listVportServicesController,
  listServiceReviewsController,
  getServiceReviewStatsController,
} from "@/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller";

import { useAsyncEffect } from "@/features/profiles/kinds/vport/hooks/review/_shared/useAsyncEffect";

export function useServiceReviewsFlow({
  targetActorId,
  viewerActorId,
  isServiceTab,
  setRating,
  setBody,
}) {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceId, setServiceId] = useState(null);

  const [serviceStats, setServiceStats] = useState({ count: 0, avg: null });
  const [serviceList, setServiceList] = useState([]);
  const [loadingServiceList, setLoadingServiceList] = useState(false);

  // Kept for compatibility with existing UI (myExists, etc)
  const [myServiceWeek, setMyServiceWeek] = useState(null);
  const [loadingMyServiceWeek, setLoadingMyServiceWeek] = useState(false);

  const selectedService = useMemo(() => {
    if (!isServiceTab) return null;
    return services.find((s) => s.id === serviceId) ?? null;
  }, [isServiceTab, services, serviceId]);

  // Load services when entering service tab
  useAsyncEffect(async (alive) => {
    if (!targetActorId) return;
    if (!isServiceTab) return;

    setLoadingServices(true);
    try {
      const rows = await listVportServicesController({ targetActorId, limit: 200 });
      if (!alive()) return;

      const safe = Array.isArray(rows) ? rows : [];
      setServices(safe);

      setServiceId((prev) => {
        if (prev && safe.some((x) => x.id === prev)) return prev;
        return safe?.[0]?.id ?? null;
      });
    } catch {
      if (!alive()) return;
      setServices([]);
      setServiceId(null);
    } finally {
      if (!alive()) return;
      setLoadingServices(false);
    }
  }, [targetActorId, isServiceTab]);

  // Stats for selected service
  useAsyncEffect(async (alive) => {
    if (!isServiceTab) return;
    if (!serviceId) return;

    try {
      const s = await getServiceReviewStatsController({ serviceId });
      if (!alive()) return;
      setServiceStats(s);
    } catch {
      if (!alive()) return;
      setServiceStats({ count: 0, avg: null });
    }
  }, [isServiceTab, serviceId]);

  // List reviews for selected service (ALL users)
  useAsyncEffect(async (alive) => {
    if (!isServiceTab) return;
    if (!serviceId) return;

    setLoadingServiceList(true);
    try {
      const rows = await listServiceReviewsController({ serviceId, limit: 50 });
      if (!alive()) return;
      setServiceList(rows);
    } catch {
      if (!alive()) return;
      setServiceList([]);
    } finally {
      if (!alive()) return;
      setLoadingServiceList(false);
    }
  }, [isServiceTab, serviceId]);

  // Unlimited system: no "my current week review".
  // We just reset composer defaults when service changes.
  useAsyncEffect(async (alive) => {
    if (!isServiceTab) return;
    if (!serviceId) return;

    setLoadingMyServiceWeek(true);
    try {
      // No preload. Just clear the "my review" state.
      if (!alive()) return;
      setMyServiceWeek(null);
      setRating(5);
      setBody("");
    } finally {
      if (!alive()) return;
      setLoadingMyServiceWeek(false);
    }
  }, [isServiceTab, viewerActorId, serviceId, setRating, setBody]);

  return {
    services,
    setServices,
    loadingServices,

    serviceId,
    setServiceId,
    selectedService,

    serviceStats,
    setServiceStats,

    serviceList,
    setServiceList,
    loadingServiceList,

    myServiceWeek,
    setMyServiceWeek,
    loadingMyServiceWeek,
  };
}

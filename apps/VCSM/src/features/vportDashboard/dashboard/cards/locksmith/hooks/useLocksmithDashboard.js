import { useCallback, useState } from "react";
import {
  useLocksmithProfile,
  useLocksmithOwner,
  usePublishLocksmithPost,
} from "@/features/profiles/kinds/vport/adapters/vportProfiles.adapter";

export function useLocksmithDashboard({ actorId }) {
  const { serviceAreas, serviceDetails, gapServices, loading, reload } =
    useLocksmithProfile(actorId, "locksmith");
  const owner = useLocksmithOwner(actorId, { onSuccess: reload });
  const { publishServiceAreaPost } = usePublishLocksmithPost({ actorId });

  const [showAddArea, setShowAddArea] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [deletingAreaId, setDeletingAreaId] = useState(null);

  const addArea = useCallback(
    async (area, { shareToFeed } = {}) => {
      try {
        await owner.addArea(area);
        setShowAddArea(false);
        if (shareToFeed) {
          try { await publishServiceAreaPost(area); } catch (_) {}
        }
      } catch (_) {}
    },
    [owner, publishServiceAreaPost]
  );

  const updateArea = useCallback(
    async (area, { shareToFeed } = {}) => {
      if (!editingArea?.id) return;
      try {
        await owner.updateArea(editingArea.id, area);
        setEditingArea(null);
        if (shareToFeed) {
          try { await publishServiceAreaPost(area); } catch (_) {}
        }
      } catch (_) {}
    },
    [owner, editingArea, publishServiceAreaPost]
  );

  const deleteArea = useCallback(
    async (areaId) => {
      setDeletingAreaId(areaId);
      try {
        await owner.deleteArea(areaId);
      } catch (_) {
      } finally {
        setDeletingAreaId(null);
      }
    },
    [owner]
  );

  return {
    serviceAreas,
    serviceDetails,
    gapServices,
    loading,
    showAddArea,
    setShowAddArea,
    editingArea,
    setEditingArea,
    deletingAreaId,
    saving: owner.saving,
    error: owner.error,
    addArea,
    updateArea,
    deleteArea,
  };
}

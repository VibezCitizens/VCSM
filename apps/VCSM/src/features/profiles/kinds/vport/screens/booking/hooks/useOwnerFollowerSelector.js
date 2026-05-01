import { useCallback, useEffect, useMemo } from "react";

export function useOwnerFollowerSelector({
  isOwner,
  ownerFollowerSearch,
  ownerCustomerName,
  ownerCustomerActorId,
  setOwnerCustomerName,
  setOwnerCustomerActorId,
}) {
  const ownerFollowerOptions = useMemo(() => {
    const rows = Array.isArray(ownerFollowerSearch.rows) ? ownerFollowerSearch.rows : [];
    const seenActorIds = new Set();
    return rows
      .map((row) => {
        const actorId = row?.actor_id ?? row?.id ?? null;
        if (!actorId || seenActorIds.has(actorId)) return null;
        seenActorIds.add(actorId);
        const displayName = String(row?.display_name || row?.username || "Citizen").trim();
        const username = String(row?.username || row?.slug || row?.vport_slug || "").trim() || null;
        return {
          actorId,
          displayName: displayName || "Citizen",
          username,
          avatar: row?.photo_url || "/avatar.jpg",
        };
      })
      .filter(Boolean);
  }, [ownerFollowerSearch.rows]);

  const selectedOwnerFollower = useMemo(
    () => ownerFollowerOptions.find((follower) => follower.actorId === ownerCustomerActorId) ?? null,
    [ownerFollowerOptions, ownerCustomerActorId]
  );

  const ownerFollowerMatches = useMemo(() => {
    if (!isOwner) return [];
    const query = String(ownerCustomerName || "").trim().toLowerCase();
    if (!query) return [];
    return ownerFollowerOptions
      .filter((follower) => {
        if (!follower) return false;
        if (ownerCustomerActorId && follower.actorId === ownerCustomerActorId) return false;
        const displayName = String(follower.displayName || "").toLowerCase();
        const username = String(follower.username || "").toLowerCase();
        const handle = username ? `@${username}` : "";
        return displayName.includes(query) || username.includes(query) || handle.includes(query);
      })
      .slice(0, 7);
  }, [isOwner, ownerCustomerName, ownerFollowerOptions, ownerCustomerActorId]);

  useEffect(() => {
    if (!ownerCustomerActorId) return;
    if (ownerFollowerOptions.some((follower) => follower.actorId === ownerCustomerActorId)) return;
    setOwnerCustomerActorId(null);
  }, [ownerCustomerActorId, ownerFollowerOptions]);

  const onOwnerCustomerNameChange = useCallback(
    (nextValue) => {
      const nextName = String(nextValue ?? "");
      setOwnerCustomerName(nextName);
      if (!ownerCustomerActorId) return;
      const normalized = nextName.trim().toLowerCase();
      if (!normalized) {
        setOwnerCustomerActorId(null);
        return;
      }
      const selectedFollower = ownerFollowerOptions.find(
        (follower) => follower.actorId === ownerCustomerActorId
      );
      if (!selectedFollower) {
        setOwnerCustomerActorId(null);
        return;
      }
      const normalizedName = String(selectedFollower.displayName || "").trim().toLowerCase();
      const normalizedUsername = String(selectedFollower.username || "").trim().toLowerCase();
      if (
        normalized !== normalizedName &&
        normalized !== normalizedUsername &&
        normalized !== (normalizedUsername ? `@${normalizedUsername}` : "")
      ) {
        setOwnerCustomerActorId(null);
      }
    },
    [ownerCustomerActorId, ownerFollowerOptions, setOwnerCustomerName, setOwnerCustomerActorId]
  );

  const onSelectOwnerFollower = useCallback((follower) => {
    if (!follower?.actorId) return;
    setOwnerCustomerActorId(follower.actorId);
    setOwnerCustomerName(String(follower.displayName || follower.username || ""));
  }, [setOwnerCustomerActorId, setOwnerCustomerName]);

  const onClearOwnerFollower = useCallback(() => {
    setOwnerCustomerActorId(null);
  }, [setOwnerCustomerActorId]);

  return {
    selectedOwnerFollower,
    ownerFollowerMatches,
    onOwnerCustomerNameChange,
    onSelectOwnerFollower,
    onClearOwnerFollower,
  };
}

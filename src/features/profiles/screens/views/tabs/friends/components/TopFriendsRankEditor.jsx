// ============================================================
//  FRIENDS SYSTEM — TOP FRIENDS RANK EDITOR (ACTOR-BASED)
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { supabase } from "@/services/supabase/supabaseClient";
import { fetchTopFriendActorIds } from "../dal/friends.read.dal";
import { hydrateActorsIntoStore } from "../helpers/hydrateActorsIntoStore";

import { useActorPresentation } from "@/state/actors/useActorPresentation";
import ActorLink from "@/shared/components/ActorLink";
import RankPickerModal from "./RankPickerModal";

export default function TopFriendsRankEditor() {
  const navigate = useNavigate();
  const { id } = useParams();          // 👈 ROUTE PARAM
  const ownerActorId = id;             // 👈 ACTOR SSOT

  const [actorIds, setActorIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  /* ============================================================
     LOAD CURRENT RANKS
     ============================================================ */
  useEffect(() => {
    if (!ownerActorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const ids = await fetchTopFriendActorIds(ownerActorId);
        await hydrateActorsIntoStore(ids);

        if (!cancelled) setActorIds(ids);
      } catch (err) {
        console.error("Failed to load top friends:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerActorId]);

  /* ============================================================
     REORDER HELPERS
     ============================================================ */
  const moveUp = useCallback((index) => {
    if (index === 0) return;

    setActorIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index) => {
    setActorIds((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  /* ============================================================
     SAVE RANKS
     ============================================================ */
  const saveRanks = async () => {
    if (!ownerActorId) return;

    setSaving(true);

    try {
      const payload = actorIds.map((friendActorId, i) => ({
        owner_actor_id: ownerActorId,
        friend_actor_id: friendActorId,
        rank: i + 1,
      }));

      await supabase
        .schema("vc")
        .from("friend_ranks")
        .delete()
        .eq("owner_actor_id", ownerActorId);

      const { error } = await supabase
        .schema("vc")
        .from("friend_ranks")
        .insert(payload);

      if (error) throw error;

      navigate(-1);
    } catch (err) {
      console.error("Failed to save top friends:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     UI STATES
     ============================================================ */
  if (loading) {
    return (
      <p className="text-center text-neutral-500 py-6">
        Loading top friends…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Edit Top Friends
      </h2>

      <div className="space-y-2">
        {actorIds.map((actorId, index) => (
          <RankRow
            key={actorId}
            actorId={actorId}
            index={index}
            total={actorIds.length}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
          />
        ))}
      </div>

      {actorIds.length < 10 && (
        <button
          onClick={() => setShowPicker(true)}
          className="text-sm px-3 py-1 rounded-lg
                     bg-neutral-800 border border-neutral-700"
        >
          Add Friend
        </button>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm rounded-lg
                     border border-neutral-700 text-neutral-300
                     hover:bg-neutral-800"
        >
          Cancel
        </button>

        <button
          disabled={saving}
          onClick={saveRanks}
          className="px-4 py-2 text-sm rounded-lg
                     bg-purple-600 text-white
                     hover:bg-purple-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {showPicker && (
        <RankPickerModal
          ownerActorId={ownerActorId}
          existingIds={actorIds}
          maxRanks={10}
          onSelect={(id) => {
            setActorIds((prev) => [...prev, id]);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

/* ============================================================
   RANK ROW
   ============================================================ */
function RankRow({ actorId, index, total, onMoveUp, onMoveDown }) {
  const actor = useActorPresentation(actorId);
  if (!actor) return null;

  return (
    <div className="flex items-center justify-between p-2 rounded-lg
                    bg-neutral-900 border border-neutral-800">
      <ActorLink
        actor={actor}
        avatarSize="w-9 h-9"
        avatarShape="rounded-md"
        showUsername
      />

      <div className="flex items-center gap-1">
        <button onClick={() => onMoveUp(index)} disabled={index === 0}>↑</button>
        <button onClick={() => onMoveDown(index)} disabled={index === total - 1}>↓</button>
      </div>
    </div>
  );
}

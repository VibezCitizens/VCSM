// src/features/vport/vprofile/tabs/VportPhotoGrid.jsx
import { useEffect, useState } from "react";
import supabase from '@/services/supabase/supabaseClient'; //transfer;

export default function VportPhotoGrid({ vport }) {
  const [photos, setPhotos] = useState([]);
  const [actorId, setActorId] = useState(null);
  const [loadingActor, setLoadingActor] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // 1) Resolve actorId for this vport (vc.actors.vport_id is UNIQUE)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!vport?.id) {
        console.warn("[VportPhotoGrid] Missing vport.id → cannot resolve actor");
        if (!cancelled) {
          setActorId(null);
          setLoadingActor(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .schema("vc")
          .from("actors")
          .select("id")
          .eq("vport_id", vport.id)
          .maybeSingle();

        if (error) {
          console.error("[VportPhotoGrid] error resolving actorId:", error);
          if (!cancelled) setActorId(null);
        } else if (!cancelled) {
          setActorId(data?.id ?? null);
        }
      } catch (err) {
        console.error("[VportPhotoGrid] exception resolving actorId:", err);
        if (!cancelled) setActorId(null);
      } finally {
        if (!cancelled) setLoadingActor(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vport?.id]);

  // 2) Load ONLY photo posts for this actor
  useEffect(() => {
    if (loadingActor) return;

    if (!actorId) {
      console.warn("[VportPhotoGrid] Missing actorId → cannot load photos");
      setPhotos([]);
      setLoadingPhotos(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingPhotos(true);

      const { data, error } = await supabase
        .schema("vc")
        .from("posts")
        .select("id, media_url, media_type")
        .eq("actor_id", actorId)
        .eq("media_type", "image") // only images based on type
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (error) {
          console.error("[VportPhotoGrid] Supabase error:", error);
          setPhotos([]);
        } else {
          // extra guard: only URLs that look like image files
          const filtered = (data || []).filter((p) =>
            /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(p.media_url || "")
          );
          setPhotos(filtered);
        }
        setLoadingPhotos(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorId, loadingActor]);

  if (loadingActor || loadingPhotos) {
    return (
      <p className="text-center text-neutral-500 py-10">
        Loading photos…
      </p>
    );
  }

  if (!actorId || !photos.length) {
    return (
      <p className="text-center text-neutral-500 py-10">
        No photos yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 px-1">
      {photos.map((p) => (
        <div key={p.id} className="w-full aspect-square">
          <img
            src={p.media_url}
            className="w-full h-full object-cover rounded-sm"
            alt=""
          />
        </div>
      ))}
    </div>
  );
}

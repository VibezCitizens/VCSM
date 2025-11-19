import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import supabase from "@/lib/supabaseClient";
import { useIdentity } from "@/state/identityContext";
import { getActorIdForUser } from "@/lib/actors/actors";
import VprofileHeader from "@/features/vport/vprofile/VprofileHeader.jsx";
import VportTabs from "./tabs/VportTabs";

const DBG = (...a) => console.log("%c[VportProfile]", "color:#3b82f6", ...a);
const DBGE = (...a) => console.log("%c[VportProfile!]", "color:#ef4444", ...a);

function useDebugFlag() {
  const [params] = useSearchParams();
  const fromQuery = params.get("debug");
  const [flag, setFlag] = useState(() => {
    if (fromQuery === "1") return true;
    const stored = localStorage.getItem("VIBEZ_DEBUG");
    return stored === "1";
  });

  useEffect(() => {
    if (fromQuery === "1") {
      localStorage.setItem("VIBEZ_DEBUG", "1");
      setFlag(true);
    } else if (fromQuery === "0") {
      localStorage.removeItem("VIBEZ_DEBUG");
      setFlag(false);
    }
  }, [fromQuery]);

  return flag;
}

function DebugPanel({ visible, blocks }) {
  if (!visible) return null;
  return (
    <div
      className="fixed bottom-16 right-3 z-[1000] max-w-[90vw] md:max-w-[480px] text-[11px] bg-black/75 text-emerald-200 border border-emerald-500/40 rounded-xl p-3 shadow-xl overflow-auto max-h-[60vh] backdrop-blur"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
    >
      <div className="text-emerald-300 font-semibold mb-2">
        VportProfileScreen ▸ debug
      </div>
      {blocks.map((b, i) => (
        <div key={i} className="mb-2">
          <div className="text-emerald-400/90">{b.title}</div>
          <pre className="whitespace-pre-wrap break-words text-emerald-200/90">
            {b.body}
          </pre>
        </div>
      ))}
      <div className="mt-2 text-emerald-300/70">
        tip: append <code>?debug=0</code> to hide. stored in{" "}
        <code>localStorage.VIBEZ_DEBUG</code>.
      </div>
    </div>
  );
}

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (s) => typeof s === "string" && UUID_RX.test(s);

export default function VportProfileScreen() {
  const t0 = useMemo(() => performance.now(), []);
  const debug = useDebugFlag();

  const { id: routeId, slug } = useParams();
  const vportId = routeId ?? null;
  const { identity } = useIdentity();

  const [vport, setVport] = useState(null);
  const [loadingVport, setLoadingVport] = useState(true);
  const [vportError, setVportError] = useState(null);

  const [actorId, setActorId] = useState(null);
  const [loadingActor, setLoadingActor] = useState(true);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserActorId, setCurrentUserActorId] = useState(null);
  const [myActorIds, setMyActorIds] = useState([]); // all viewer actors (user + vports)

  const [isOwner, setIsOwner] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // subscriber count state
  const [subscriberCount, setSubscriberCount] = useState(0);

  // 🔒 gate state
  const [blockChecked, setBlockChecked] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // AUTH + ACTOR (viewer)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data?.session?.user?.id ?? null;
        setCurrentUserId(uid);

        if (uid) {
          if (identity?.actorId) {
            setCurrentUserActorId(identity.actorId);
          } else {
            const resolved = await getActorIdForUser(uid);
            setCurrentUserActorId(resolved || null);
          }

          // collect ALL viewer actors
          const { data: owned, error: aoErr } = await supabase
            .schema("vc")
            .from("actor_owners")
            .select("actor_id")
            .eq("user_id", uid);
          if (!aoErr) setMyActorIds((owned || []).map((r) => r.actor_id));
        } else {
          setMyActorIds([]);
        }
      } catch (e) {
        DBGE("auth/actor resolve error:", e);
        setMyActorIds([]);
      }
    })();
  }, [identity?.actorId]);

  // LOAD VPORT
  const loadVport = useCallback(async () => {
    const base = supabase.schema("vc").from("vports").select("*").limit(1);
    let q = base;
    if (vportId) q = q.eq("id", vportId);
    else if (slug) q = isUuid(slug) ? q.eq("id", slug) : q.eq("slug", slug);
    const { data, error } = await q.maybeSingle();
    return { row: data ?? null, error };
  }, [vportId, slug]);

  useEffect(() => {
    (async () => {
      setLoadingVport(true);
      const { row, error } = await loadVport();
      setVport(row);
      setVportError(error);
      setLoadingVport(false);
    })();
  }, [loadVport]);

  // LOAD ACTOR for this vport
  useEffect(() => {
    if (!vport?.id) {
      setActorId(null);
      setLoadingActor(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .schema("vc")
        .from("actors")
        .select("id")
        .eq("vport_id", vport.id)
        .maybeSingle();
      if (!error && data?.id) setActorId(data.id);
      setLoadingActor(false);
    })();
  }, [vport?.id]);

  // OWNERSHIP
  useEffect(() => {
    if (!actorId || !currentUserId) return;
    (async () => {
      const { data } = await supabase
        .schema("vc")
        .from("actor_owners")
        .select("actor_id")
        .eq("actor_id", actorId)
        .eq("user_id", currentUserId)
        .maybeSingle();
      setIsOwner(!!data);
    })();
  }, [actorId, currentUserId]);

  // 🔒 BLOCK CHECK (either direction): viewer’s ANY actor vs vport actor
  useEffect(() => {
    let alive = true;
    (async () => {
      setBlockChecked(false);
      setIsBlocked(false);

      // if anonymous viewer → no block gate (let route-level BlockGate decide if you later want public gating)
      if (!currentUserId) {
        if (alive) {
          setBlockChecked(true);
          setIsBlocked(false);
        }
        return;
      }

      if (!actorId || myActorIds.length === 0) {
        if (alive) {
          setBlockChecked(true);
          setIsBlocked(false);
        }
        return;
      }

      try {
        const idsCSV = myActorIds.join(",");
        const { data: rows, error } = await supabase
          .schema("vc")
          .from("user_blocks")
          .select("blocker_actor_id,blocked_actor_id")
          .or(
            `and(blocker_actor_id.in.(${idsCSV}),blocked_actor_id.eq.${actorId}),` +
              `and(blocker_actor_id.eq.${actorId},blocked_actor_id.in.(${idsCSV}))`
          );

        if (error) {
          DBGE("block check error:", error);
          if (alive) {
            setBlockChecked(true);
            setIsBlocked(false);
          }
          return;
        }

        const any = (rows?.length ?? 0) > 0;
        if (alive) {
          setIsBlocked(any);
          setBlockChecked(true);
        }
      } catch (e) {
        DBGE("block check catch:", e);
        if (alive) {
          setBlockChecked(true);
          setIsBlocked(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [currentUserId, myActorIds, actorId]);

  // FOLLOW STATE (am I subscribed?)
  useEffect(() => {
    if (!actorId || !currentUserActorId) return;
    (async () => {
      const { data } = await supabase
        .schema("vc")
        .from("actor_follows")
        .select("follower_actor_id")
        .eq("follower_actor_id", currentUserActorId)
        .eq("followed_actor_id", actorId)
        .eq("is_active", true)
        .maybeSingle();
      setIsSubscribed(!!data);
    })();
  }, [actorId, currentUserActorId]);

  // LOAD SUBSCRIBER COUNT (active followers only) — skip if blocked and not owner
  useEffect(() => {
    if (!actorId) return;
    if (!isOwner && isBlocked) return; // 🔒 gate
    (async () => {
      try {
        const { count, error } = await supabase
          .schema("vc")
          .from("actor_follows")
          .select("*", { count: "exact" })
          .eq("followed_actor_id", actorId)
          .eq("is_active", true);

        if (error) {
          DBGE("load subscriber count error:", error);
          return;
        }
        setSubscriberCount(typeof count === "number" ? count : 0);
      } catch (err) {
        DBGE("load subscriber count error (catch):", err);
      }
    })();
  }, [actorId, isOwner, isBlocked]);

  // posts/tabs don’t load here; VportTabs handles its own data by vport

  const handleSubscribeToggle = useCallback((nextIsSubscribed) => {
    setIsSubscribed(!!nextIsSubscribed);
    setSubscriberCount((prev) => {
      if (typeof prev !== "number") return prev;
      const delta = nextIsSubscribed ? 1 : -1;
      const next = prev + delta;
      return next < 0 ? 0 : next;
    });
  }, []);

  const debugBlocks = useMemo(() => {
    return [
      { title: "vport", body: JSON.stringify(vport, null, 2) },
      { title: "actorId", body: String(actorId) },
      { title: "identity", body: JSON.stringify(identity, null, 2) },
      { title: "myActorIds", body: JSON.stringify(myActorIds) },
      { title: "subscriberCount", body: String(subscriberCount) },
      { title: "isSubscribed", body: String(isSubscribed) },
      { title: "isOwner", body: String(isOwner) },
      { title: "blockChecked", body: String(blockChecked) },
      { title: "isBlocked", body: String(isBlocked) },
    ];
  }, [
    vport,
    actorId,
    identity,
    myActorIds,
    subscriberCount,
    isSubscribed,
    isOwner,
    blockChecked,
    isBlocked,
  ]);

  // ---------------------------------------
  // RENDER GATES
  // ---------------------------------------
  if (loadingVport || loadingActor || !blockChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh] text-white">
        Loading…
      </div>
    );
  }

  if (!vport) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh] text-neutral-400">
        VPort not found
      </div>
    );
  }

  // If blocked (and not owner), render nothing (or a minimal blocked notice if you prefer)
  if (!isOwner && isBlocked) {
    return null;
  }

  return (
    <>
      <div className="pb-20">
        <VprofileHeader
          profile={vport}
          isOwnProfile={isOwner}
          metricLabel="Subscribers"
          metricCount={subscriberCount ?? 0}
          initialSubscribed={isSubscribed}
          onSubscribeToggle={handleSubscribeToggle}
        />
        <div className="mt-6">
          <VportTabs vport={vport} />
        </div>
      </div>
      <DebugPanel visible={debug} blocks={debugBlocks} />
    </>
  );
}

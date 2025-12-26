// C:\Users\vibez\OneDrive\Desktop\no src\src\lib\actors\components\RequireVport.jsx
// src/lib/actors/components/RequireVport.jsx
import React from "react";
import { getActor, onActorChange } from "@/lib/actors/actor";

/**
 * RequireVport
 * Gates children so they render only when the current actor is a VPORT.
 * - Reads from the actors store (getActor/onActorChange)
 * - Waits for a short hydration/grace window to avoid the "Switch to a VPORT..." flash on refresh
 *
 * Props:
 *  - title?: string    (heading shown on fallback; default "VPORT")
 *  - fallback?: ReactNode (custom content while hydrating; optional)
 *  - children: ReactNode
 */
export default function RequireVport({ children, fallback = null, title = "VPORT" }) {
  // Seed from current store snapshot
  const [actor, setActor] = React.useState(() => {
    try {
      return getActor();
    } catch {
      return null;
    }
  });

  // Tracks whether we received at least one snapshot (store hydrated)
  const [hydrated, setHydrated] = React.useState(!!actor);

  // Small grace window to avoid flicker on very fast mounts (200ms)
  const [grace, setGrace] = React.useState(true);

  React.useEffect(() => {
    // Subscribe to changes from the actors store (same-tab + cross-tab)
    const unsub = onActorChange((a) => {
      setActor(a);
      if (!hydrated) setHydrated(true);
    });

    // If initial snapshot was null, try one more pull immediately
    if (!actor) {
      try {
        const a = getActor();
        if (a) {
          setActor(a);
          setHydrated(true);
        }
      } catch {
        /* ignore */
      }
    }

    // End grace period after 200ms
    const t = setTimeout(() => setGrace(false), 200);

    return () => {
      unsub?.();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While hydrating (or during grace), show lightweight loader/fallback
  if (!hydrated || grace) {
    return (
      fallback ?? (
        <div className="max-w-xl mx-auto px-4 py-8 text-neutral-400">Loading…</div>
      )
    );
  }

  // Require VPORT mode
  if (!actor || actor.kind !== "vport") {
    return (
      <div className="max-w-xl mx-auto px-4 py-4 text-white">
        <h1 className="text-xl font-semibold mb-4">{title} Notifications</h1>
        <p className="text-neutral-400">Switch to a VPORT to view this page.</p>
      </div>
    );
  }

  // Good to render
  return children;
}

// src/lib/actors/components/ActorToggleInline.jsx
import React from "react";
import { getActor, setProfileMode, setVportMode, onActorChange } from "@/lib/actors/actor";

/**
 * Inline toggle to switch between "Me" (profile) and owned VPORTs.
 * Props:
 *  - vports: Array<{ id: string, name: string, avatar_url?: string }>
 */
export default function ActorToggleInline({ vports = [] }) {
  const [actor, setActorState] = React.useState(getActor());

  React.useEffect(() => {
    const unsub = onActorChange(setActorState);
    return () => unsub?.();
  }, []);

  return (
    <div className="flex gap-2 items-center">
      <button
        className={`px-3 py-1 rounded-full border transition ${
          actor.kind === "profile"
            ? "bg-purple-600 text-white border-purple-600"
            : "bg-zinc-800 text-zinc-100 border-zinc-700"
        }`}
        onClick={() => setActorState(setProfileMode())}
      >
        Me
      </button>

      {vports.map((v) => (
        <button
          key={v.id}
          title={v.name}
          className={`px-3 py-1 rounded-full border transition ${
            actor.kind === "vport" && actor.id === v.id
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-zinc-800 text-zinc-100 border-zinc-700"
          }`}
          onClick={() => setActorState(setVportMode(v.id))}
        >
          {v.name}
        </button>
      ))}
    </div>
  );
}

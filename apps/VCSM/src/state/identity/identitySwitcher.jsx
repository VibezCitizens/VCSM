import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { loadOwnedActorChoices } from "@/state/identity/identity.controller";
import { useIdentity } from "@/state/identity/identityContext";

export default function IdentitySwitcher() {
  const { user } = useAuth() || {};
  const { switchActor } = useIdentity();
  const [actors, setActors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.id) {
        setActors([]);
        return;
      }

      try {
        const rows = await loadOwnedActorChoices(user.id);
        if (!cancelled) {
          setActors(rows ?? []);
        }
      } catch {
        if (!cancelled) {
          setActors([]);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (actors.length <= 1) return null;

  return (
    <div className="fixed bottom-20 right-4 rounded-lg border border-neutral-700 bg-black p-2 shadow">
      {actors.map((row) => (
        <button
          key={row.actor_id}
          onClick={() => switchActor(row.actor_id, 'IdentitySwitcher')}
          className="block w-full rounded px-3 py-2 text-left text-white hover:bg-white/6"
        >
          {row.actor?.kind ?? "actor"}
        </button>
      ))}
    </div>
  );
}

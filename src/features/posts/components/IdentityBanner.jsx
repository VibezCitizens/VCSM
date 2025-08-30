// src/components/IdentityBanner.jsx
/**
 * @fileoverview IdentityBanner
 * Shows who you're acting as.
 * - If acting as VPORT → shows the VPORT name.
 * - Otherwise → shows your profile display_name (fallback to username/email).
 *
 * Props:
 *  - isActingAsVPort: boolean
 *  - actorVportId?: string | null
 *  - vportName?: string        // optional override to skip DB fetch
 *  - personalName?: string     // optional override to skip DB fetch
 *
 * Notes:
 *  - All DB access goes through @/data/db.
 */

import { useEffect, useState } from 'react';
import { db } from '@/data/data';

export default function IdentityBanner({
  isActingAsVPort,
  actorVportId = null,
  vportName: vportNameProp,
  personalName: personalNameProp,
}) {
  const [label, setLabel] = useState(isActingAsVPort ? 'VPORT' : 'Personal');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Acting as VPORT
      if (isActingAsVPort) {
        // If caller provided the name, just use it
        if (vportNameProp) {
          if (!cancelled) setLabel(`VPORT — ${vportNameProp}`);
          return;
        }

        // If we don't have an id, we can't fetch
        if (!actorVportId) {
          if (!cancelled) setLabel('VPORT');
          return;
        }

        try {
          const v = await db.profiles.vports.getById(actorVportId);
          if (!cancelled) {
            setLabel(`VPORT — ${v?.name || `#${actorVportId}`}`);
          }
        } catch {
          if (!cancelled) setLabel(`VPORT #${actorVportId}`);
        }
        return;
      }

      // Personal (user) mode
      if (personalNameProp) {
        if (!cancelled) setLabel(`Personal — ${personalNameProp}`);
        return;
      }

      try {
        const user = await db.auth.getAuthUser();
        const uid = user?.id;
        if (!uid) {
          if (!cancelled) setLabel('Personal');
          return;
        }

        const profile = await db.profiles.users.getById(uid);
        const name =
          profile?.display_name ||
          profile?.username ||
          profile?.email ||
          'Personal';

        if (!cancelled) setLabel(`Personal — ${name}`);
      } catch {
        if (!cancelled) setLabel('Personal');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isActingAsVPort, actorVportId, vportNameProp, personalNameProp]);

  return (
    <div className="mb-4 w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-300">
      Acting as: <span className="font-semibold">{label}</span>
    </div>
  );
}

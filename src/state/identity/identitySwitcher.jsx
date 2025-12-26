// src/state/identity/identitySwitcher.jsx

import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase/supabaseClient'
import { useIdentity } from './identityContext'

export default function IdentitySwitcher() {
  const { identity, switchActor } = useIdentity()
  const [actors, setActors] = useState([])

  useEffect(() => {
    if (!identity) return

    supabase
      .from('vc.actor_owners')
      .select('actor_id, vc_actors:actor_id (id, kind, profile_id, vport_id)')
      .eq('user_id', identity?.profileId)
      .then(({ data }) => setActors(data || []))
  }, [identity?.profileId])

  if (actors.length <= 1) return null

  return (
    <div className="fixed bottom-20 right-4 bg-black p-2 rounded-lg shadow border border-neutral-700">
      {actors.map((row) => (
        <button
          key={row.actor_id}
          onClick={() => switchActor(row.actor_id)}
          className="block w-full text-left px-3 py-2 text-white hover:bg-neutral-800 rounded"
        >
          {row.vc_actors?.kind}
        </button>
      ))}
    </div>
  )
}

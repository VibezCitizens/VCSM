import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getActor, setActor, onActorChange } from '@/lib/actor';

/**
 * useActor()
 *  - actor: { kind: 'profile', id: <userId|null> } | { kind: 'vport', id: <vportId> }
 *  - switchToProfile()
 *  - switchToVport(vportId)
 */
export function useActor() {
  const { user } = useAuth() || {};

  const toState = (raw) => {
    if (raw?.kind === 'vport' && raw.id) return { kind: 'vport', id: String(raw.id) };
    return { kind: 'profile', id: user?.id || null };
  };

  const [actor, setActorState] = useState(() => toState(getActor()));

  useEffect(() => {
    setActorState(toState(getActor()));
    const off = onActorChange((a) => setActorState(toState(a)));
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const switchToProfile = () => {
    const next = { kind: 'profile', id: user?.id || null };
    setActor(next);
    setActorState(next);
  };

  const switchToVport = (vportId) => {
    const next = { kind: 'vport', id: String(vportId) };
    setActor(next);
    setActorState(next);
  };

  return { actor, switchToProfile, switchToVport };
}

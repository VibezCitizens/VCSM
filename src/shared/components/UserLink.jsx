// src/shared/components/UserLink.jsx
// ============================================================
// LEGACY COMPATIBILITY WRAPPER
// - Adapts old `user` props to ActorLink
// - DO NOT add new logic here
// - New code should use ActorLink directly
// ============================================================

import ActorLink from './ActorLink';
import { useActorSummary } from '@/state/actors/useActorSummary';

/*
  ⚠️ DEPRECATED:
  This component exists ONLY to avoid breaking old screens.
  New code MUST use <ActorLink /> + useActorSummary().
*/

export default function UserLink({
  user,
  avatarSize,
  avatarShape,
  textSize,
  showUsername,
  showTimestamp,
  timestamp,
  className,
  toOverride, // legacy escape hatch
}) {
  const actorUI = useActorSummary(
    user
      ? {
          id: user.id ?? user.actor_id ?? user.user_id,
          displayName: user.displayName ?? user.display_name ?? user.name ?? 'User',
          username: user.username ?? null,
          slug: user.slug ?? user.vport_slug ?? null,
          avatar: user.avatar ?? user.avatarUrl ?? user.photo_url ?? user.avatar_url ?? '/avatar.jpg',
        }
      : null
  );

  if (!user || !actorUI?.actorId) return null;

  // Legacy override still respected
  const actor = {
    id: actorUI.actorId,
    displayName: actorUI.displayName,
    username: actorUI.username,
    avatar: actorUI.avatar,
    route: actorUI.route,
  };

  if (toOverride) {
    actor.route = toOverride;
  }

  return (
    <ActorLink
      actor={actor}
      avatarSize={avatarSize}
      avatarShape={avatarShape}
      textSize={textSize}
      showUsername={showUsername}
      showTimestamp={showTimestamp}
      timestamp={timestamp}
      className={className}
    />
  );
}

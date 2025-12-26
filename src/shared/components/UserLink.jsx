// src/shared/components/UserLink.jsx
// ============================================================
// LEGACY COMPATIBILITY WRAPPER
// - Adapts old `user` props to ActorLink
// - DO NOT add new logic here
// - New code should use ActorLink directly
// ============================================================

import ActorLink from './ActorLink';
import { useActorPresentation } from '@/state/actors/useActorPresentation';

/*
  ⚠️ DEPRECATED:
  This component exists ONLY to avoid breaking old screens.
  New code MUST use <ActorLink /> + useActorPresentation().
*/

export default function UserLink({
  user,
  authorType,
  avatarSize,
  avatarShape,
  textSize,
  showUsername,
  showTimestamp,
  timestamp,
  className,
  toOverride, // legacy escape hatch
}) {
  if (!user) return null;

  /**
   * Minimal legacy → actor adaptation
   * No guessing, no fallbacks beyond what already exists
   */
  const legacyActor = {
    id: user.id ?? user.actor_id ?? user.user_id,
    kind:
      authorType ??
      user.kind ??
      user.actor_kind ??
      (user.slug || user.vport_slug ? 'vport' : 'user'),

    // normalized fields expected by useActorPresentation
    displayName:
      user.displayName ??
      user.display_name ??
      user.name ??
      'User',

    username: user.username ?? null,
    slug: user.slug ?? user.vport_slug ?? null,

    avatar:
      user.avatar ??
      user.avatarUrl ??
      user.photo_url ??
      user.avatar_url ??
      '/avatar.jpg',
  };

  const actorUI = useActorPresentation(legacyActor);

  if (!actorUI) return null;

  // Legacy override still respected
  if (toOverride) {
    actorUI.route = toOverride;
  }

  return (
    <ActorLink
      actor={actorUI}
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

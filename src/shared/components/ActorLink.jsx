// src/shared/components/ActorLink.jsx

import { Link } from "react-router-dom";

/*
  actor (presentation-safe) = {
    id,
    kind,
    displayName,
    username,
    avatar,
    route
  }
*/

export default function ActorLink({
  actor,
  avatarSize = "w-11 h-11",
  avatarShape = "rounded-xl",
  textSize = "text-sm",
  showUsername = false,
  showTimestamp = false,
  timestamp = "",
  className = "",
  showAvatar = true,
  showText = true,
}) {
  if (!actor) return null;

  return (
    <Link
      to={actor.route}
      className={`flex items-center ${showAvatar && showText ? "gap-2" : "gap-0"} no-underline hover:no-underline ${className}`}
      aria-label={`${actor.displayName} profile`}
    >
      {showAvatar ? (
        <img
          src={actor.avatar}
          alt={actor.displayName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/avatar.jpg";
          }}
          className={`${avatarSize} ${avatarShape} object-cover border border-neutral-700`}
        />
      ) : null}

      {showText ? (
        <div className="flex flex-col leading-tight">
          <span className={`${textSize} text-slate-100 font-semibold`}>
            {actor.displayName}
          </span>

          {showUsername && actor.username && (
            <span className="text-xs text-slate-400">@{actor.username}</span>
          )}

          {showTimestamp && timestamp && (
            <span className="text-[11px] text-neutral-400">{timestamp}</span>
          )}
        </div>
      ) : null}
    </Link>
  );
}

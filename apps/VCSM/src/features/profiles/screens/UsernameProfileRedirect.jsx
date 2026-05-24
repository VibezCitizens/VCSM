import { Navigate, useParams } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
// UsernameProfileRedirect — thin pass-through
//
// Routes /u/:username → /profile/:username
//
// ActorProfileScreen handles ALL resolution:
//   - slug       → useResolveActorBySlug → render
//   - UUID       → useActorCanonicalSlug → redirect to canonical slug
//   - "self"     → identity.actorId → redirect to canonical slug
//
// SECURITY: we must NOT resolve username → actorId and then navigate to
// /profile/{UUID} — that would expose raw actor UUIDs in the address bar,
// violating the platform no-raw-IDs-in-public-URLs rule.
// ─────────────────────────────────────────────────────────────

export default function UsernameProfileRedirect() {
  const { username } = useParams();
  return <Navigate to={`/profile/${username ?? ""}`} replace />;
}

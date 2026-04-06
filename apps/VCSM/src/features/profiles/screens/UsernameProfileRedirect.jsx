import { Navigate, useParams } from "react-router-dom";
import { useUsernameProfileRedirect } from "@/features/profiles/hooks/useUsernameProfileRedirect";

const UUID_REGEX = /^[0-9a-f-]{36}$/i;

export default function UsernameProfileRedirect() {
  const { username } = useParams();
  const usernameValue = username ?? "";

  // Keep hook order stable.
  const { actorId, loading } = useUsernameProfileRedirect(usernameValue);

  if (UUID_REGEX.test(usernameValue)) {
    return <Navigate to={`/profile/${usernameValue}`} replace />;
  }

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!actorId) {
    return <div className="p-10 text-center">Profile not found.</div>;
  }

  return <Navigate to={`/profile/${actorId}`} replace />;
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { wentrexCanAccess } from "@/features/identity/wentrexAccess.js";
import { useWentrexIdentity } from "@/features/identity/WentrexIdentityContext";

/**
 * Route guard that checks if the current user can access a specific dashboard.
 * Reads from WentrexIdentityContext (already resolved by WentrexIdentityProvider)
 * rather than making its own resolveAuthenticatedContext call.
 *
 * Usage:
 *   <RequireRole allow="admin"><AdminDashboard /></RequireRole>
 *   <RequireRole allow="teacher"><TeacherDashboard /></RequireRole>
 *   <RequireRole allow="parent"><ParentDashboard /></RequireRole>
 *   <RequireRole allow="student"><StudentDashboard /></RequireRole>
 */
export default function RequireRole({ allow, children }) {
  const navigate = useNavigate();
  const { loading, context, error } = useWentrexIdentity();

  useEffect(() => {
    if (loading) return;

    if (!context?.activeActor) {
      // NO_SESSION or no context — route to login.
      // Other provisioning errors (APP_NOT_FOUND, NO_LEARNING_ACTOR) go to unauthorized.
      const destination = (!error || error.code === "NO_SESSION") ? "/login" : "/unauthorized";
      navigate(destination, { replace: true });
      return;
    }

    if (context.isSuspended) {
      navigate("/suspended", { replace: true });
      return;
    }

    if (!wentrexCanAccess(allow, context.roleKeys)) {
      navigate(context.defaultDestination ?? "/unauthorized", { replace: true });
    }
  }, [loading, context, error, allow, navigate]);

  if (loading) return null;
  if (!context?.activeActor) return null;
  if (!wentrexCanAccess(allow, context?.roleKeys ?? [])) return null;
  return children;
}

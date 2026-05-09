import { supabase } from "@/services/supabase/supabaseClient";

const TRIPOINT_DASHBOARD_OWNER_USER_ID = "3b7ddb68-af16-445b-9bba-656e952b7802";

function isMissingSessionError(error) {
  const message = error?.message?.toLowerCase?.() ?? "";
  return error?.name === "AuthSessionMissingError" || message.includes("auth session missing");
}

export async function readTripointDashboardAccess() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if (isMissingSessionError(userError)) {
      return { status: "signed-out", user: null };
    }

    throw userError;
  }

  if (!user) {
    return { status: "signed-out", user: null };
  }

  if (user.id !== TRIPOINT_DASHBOARD_OWNER_USER_ID) {
    return { status: "denied", user };
  }

  const { data: hasPlatformGrant, error: grantError } = await supabase
    .schema("learning")
    .rpc("is_platform_owner", { p_user_id: user.id });

  if (grantError) {
    throw grantError;
  }

  return {
    status: hasPlatformGrant === true ? "allowed" : "denied",
    user,
  };
}

export async function signOutTripointDashboard() {
  return supabase.auth.signOut();
}

export function subscribeToTripointDashboardAuth(onChange) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    onChange();
  });

  return () => subscription?.unsubscribe?.();
}

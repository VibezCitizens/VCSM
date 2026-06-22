import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { resolveLearningRealm } from "@/learning/adapters/realm.adapter";
import "@/learning/styles/learning.css";
import { resetLearningTheme, setLearningTheme } from "@/learning/utils/setLearningTheme";
import { logRealmDebug } from "@/learning/utils/realmDebug";
import { supabase } from "@/services/supabase/supabaseClient";
import { useIdentity } from "@/features/identity/identityContext";
import { useActiveActorState } from "@/features/identity/adapters/identity.adapter";

const INITIAL_STATE = {
  realm: null,
  realmId: null,
  error: null,
  resolving: false,
};

export default function LearningLayout() {
  const { user, loading: authLoading } = useAuth();
  const { identity, identityLoading } = useIdentity();
  const { realmId: vcRealmId } = useActiveActorState();
  const [state, setState] = useState(INITIAL_STATE);

  const actorId = identity?.actorId ?? null;

  const reload = useCallback(async () => {
    logRealmDebug("LearningLayout", "reload:start", {
      authLoading,
      identityLoading,
      hasUser: Boolean(user?.id),
      actorId,
      vcRealmId,
    });

    if (authLoading || identityLoading) {
      logRealmDebug("LearningLayout", "reload:blocked_loading", {
        authLoading,
        identityLoading,
      });
      return;
    }

    if (!actorId) {
      logRealmDebug("LearningLayout", "reload:missing_actor", {
        identity,
      });
      setState({
        realm: null,
        realmId: null,
        resolving: false,
        error: {
          code: "ACTOR_REQUIRED",
          message: "Learning requires an active actor identity.",
        },
      });
      return;
    }

    if (!vcRealmId) {
      logRealmDebug("LearningLayout", "reload:missing_vc_realm", {
        identity,
      });
      setState({
        realm: null,
        realmId: null,
        resolving: false,
        error: {
          code: "VC_REALM_REQUIRED",
          message: "Learning requires an active realm on the current identity.",
        },
      });
      return;
    }

    setState((current) => ({
      ...current,
      resolving: true,
      error: null,
    }));

    logRealmDebug("LearningLayout", "reload:resolve_requested", {
      actorId,
      vcRealmId,
      fallbackToDefault: true,
    });

    try {
      const result = await resolveLearningRealm({
        vcRealmId,
        fallbackToDefault: true,
      });

      if (!result?.ok) {
        logRealmDebug("LearningLayout", "reload:resolve_failed", {
          actorId,
          vcRealmId,
          result,
        });
        setState({
          realm: null,
          realmId: null,
          resolving: false,
          error: result?.error ?? {
            code: "LEARNING_REALM_NOT_FOUND",
            message: "Unable to resolve the learning realm.",
          },
        });
        return;
      }

      logRealmDebug("LearningLayout", "reload:resolve_succeeded", {
        actorId,
        vcRealmId,
        realmId: result.data.realmId,
        realm: result.data.realm,
      });

      setState({
        realm: result.data.realm,
        realmId: result.data.realmId,
        resolving: false,
        error: null,
      });
    } catch (error) {
      setState({
        realm: null,
        realmId: null,
        resolving: false,
        error: {
          code: "LEARNING_REALM_ERROR",
          message: error?.message ?? "Unable to resolve the learning realm.",
        },
      });

      logRealmDebug("LearningLayout", "reload:exception", {
        actorId,
        vcRealmId,
        error,
      });
    }
  }, [actorId, authLoading, identity, identityLoading, user?.id, vcRealmId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    setLearningTheme({
      primaryColor: "#111827",
      primaryForeground: "#ffffff",
      backgroundColor: "#ffffff",
      textColor: "#111827",
    });

    return () => {
      resetLearningTheme();
    };
  }, []);

  const contextValue = {
    supabase,
    user,
    identity,
    actorId,
    vcRealmId,
    realm: state.realm,
    realmId: state.realmId,
    isLoading: authLoading || identityLoading || state.resolving,
    isReady: Boolean(actorId && state.realmId),
    error: state.error,
    reload,
  };

  return (
    <div
      className="learning-theme"
      style={{
        minHeight: "100%",
        background: "var(--learning-bg)",
        color: "var(--learning-text)",
      }}
    >
      <Outlet context={contextValue} />
    </div>
  );
}

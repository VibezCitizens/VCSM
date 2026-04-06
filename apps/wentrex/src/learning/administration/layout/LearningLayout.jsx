import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { signOut } from "@/auth/controllers/login.controller";
import { resolveLearningActor } from "@/learning/administration/adapters/actor.adapter";
import { resolveLearningRealm } from "@/learning/administration/adapters/realm.adapter";
import "@/learning/styles/learning.css";
import { resetLearningTheme, setLearningTheme } from "@/learning/administration/utils/setLearningTheme";
import { supabase } from "@/services/supabase/supabaseClient";
import {
  pickFirstString,
  readStorageValue,
  writeStorageValue,
  removeStorageValue,
} from "./components/realmHints";
import LearningShellHeader from "./components/LearningShellHeader";

const RESERVED_LEARNING_ROUTES = new Set(["admin", "student", "parent", "teacher", "settings", "profile"]);

const INITIAL_STATE = {
  user: null,
  actorId: null,
  identityRealmId: null,
  realm: null,
  realmId: null,
  error: null,
  resolving: false,
};

export default function LearningLayout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { realmSlug } = useParams();
  const [authState, setAuthState] = useState({
    user: null,
    loading: true,
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const [state, setState] = useState(INITIAL_STATE);

  const searchKey = searchParams.toString();

  const configHints = useMemo(() => {
    const actorId = pickFirstString(
      searchParams.get("actorId"),
      readStorageValue("learning:actorId"),
      import.meta.env.VITE_LEARNING_ACTOR_ID,
    );

    return { actorId };
  }, [searchKey]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAuthUser() {
      if (!supabase?.auth) {
        if (!cancelled) {
          setAuthState({ user: null, loading: false });
        }
        return;
      }

      try {
        const result = await supabase.auth.getUser();

        if (!cancelled) {
          setAuthState({
            user: result?.data?.user ?? null,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setAuthState({
            user: null,
            loading: false,
          });
        }
      }
    }

    hydrateAuthUser();

    const authSubscription = supabase?.auth?.onAuthStateChange?.((_event, session) => {
      if (cancelled) return;
      if (_event !== "SIGNED_IN" && _event !== "SIGNED_OUT") return;
      setAuthState({
        user: session?.user ?? null,
        loading: false,
      });
    });

    return () => {
      cancelled = true;
      authSubscription?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  const reload = useCallback(async () => {
    const authLoading = authState.loading;

    if (authLoading) return;

    setState((current) => ({ ...current, resolving: true, error: null }));

    try {
      const actorResult = await resolveLearningActor({
        supabase,
        user: authState.user,
        actorId: configHints.actorId,
      });

      const resolvedActorId = actorResult?.ok ? actorResult.data.actorId : null;
      const resolvedUser = actorResult?.ok
        ? actorResult.data.user ?? authState.user ?? null
        : authState.user ?? null;

      const isReservedSegment = RESERVED_LEARNING_ROUTES.has(realmSlug);
      const lookupSlug = isReservedSegment ? null : realmSlug;

      const result = await resolveLearningRealm({
        supabase,
        slug: lookupSlug,
        fallbackToDefault: isReservedSegment,
      });

      if (!result?.ok) {
        setState({
          user: resolvedUser,
          actorId: resolvedActorId,
          identityRealmId: null,
          realm: null,
          realmId: null,
          resolving: false,
          error: result?.error ?? {
            code: "LEARNING_REALM_NOT_FOUND",
            message: `Tenant "${realmSlug}" not found.`,
          },
        });
        return;
      }

      if (!resolvedActorId) {
        setState({
          user: resolvedUser,
          actorId: null,
          identityRealmId: result.data.realm.sourceRealmId ?? null,
          realm: result.data.realm,
          realmId: result.data.realmId,
          resolving: false,
          error: {
            code: "ACTOR_REQUIRED",
            message: "A signed-in user is required to access this workspace.",
          },
        });
        return;
      }

      setState({
        user: resolvedUser,
        actorId: resolvedActorId,
        identityRealmId: result.data.realm.sourceRealmId ?? null,
        realm: result.data.realm,
        realmId: result.data.realmId,
        resolving: false,
        error: null,
      });
    } catch (error) {
      console.error("[LearningLayout] reload exception:", error);
      setState({
        user: authState.user ?? null,
        actorId: null,
        identityRealmId: null,
        realm: null,
        realmId: null,
        resolving: false,
        error: {
          code: "LEARNING_REALM_ERROR",
          message: error?.message ?? "Unable to resolve the learning realm.",
        },
      });
    }
  }, [authState.loading, authState.user?.id ?? null, configHints, realmSlug]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    writeStorageValue("learning:actorId", configHints.actorId);
  }, [configHints.actorId]);

  useEffect(() => {
    setLearningTheme({
      primaryColor: "#0f4a72",
      primaryForeground: "#ffffff",
      backgroundColor: "#eef5fb",
      textColor: "#08111b",
    });

    return () => {
      resetLearningTheme();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    setLoggingOut(true);

    try {
      removeStorageValue("learning:actorId");
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: {
          code: "LEARNING_SIGN_OUT_FAILED",
          message: error?.message ?? "Unable to sign out right now.",
        },
      }));
    } finally {
      setLoggingOut(false);
    }
  }, [navigate]);

  const identity = useMemo(
    () => ({
      actorId: state.actorId,
      realmId: state.identityRealmId,
      learningRealmId: state.realmId,
      sourceRealmId: state.identityRealmId,
    }),
    [state.actorId, state.identityRealmId, state.realmId],
  );

  const contextValue = {
    supabase,
    user: state.user ?? authState.user ?? null,
    identity,
    actorId: state.actorId,
    identityRealmId: state.identityRealmId,
    realm: state.realm,
    realmId: state.realmId,
    realmSlug: realmSlug ?? null,
    isLoading: authState.loading || state.resolving,
    isReady: Boolean(state.actorId && state.realmId),
    error: state.error,
    reload,
  };

  const connectionLabel = state.actorId ? "Profile connected" : "Setup required";

  return (
    <div className="learning-theme learning-shell">
      <LearningShellHeader
        realmName={state.realm?.name}
        connectionLabel={connectionLabel}
        error={state.error}
        loggingOut={loggingOut}
        onSignOut={handleSignOut}
      />

      <main className="learning-shell-content">
        <Outlet context={contextValue} />
      </main>
    </div>
  );
}

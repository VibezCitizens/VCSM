import { useCallback, useEffect, useRef, useState } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import {
  loadInviteForJoin,
  checkJoinAuthState,
  signUpForBarbershopInvite,
  loginForInvite,
  autoResumeInviteOnboarding,
  createBarberVportAndAccept,
  useExistingBarberVportAndAccept,
} from "@/features/join/controllers/joinBarbershopAccount.controller";
import { useIdentityOps } from "@/features/identity/adapters/identity.adapter";
import { useAuthOps } from "@/features/auth/adapters/auth.adapter";
import { useVportCoreOps } from "@/features/vport/adapters/vport.public.adapter";
import {
  loadQrJoin,
  findCurrentUserBarberVport,
  acceptQrJoin,
  createBarberVportAndAcceptQr,
} from "@/features/join/controllers/joinBarbershopQr.controller";
import { loginForInvite as loginController } from "@/features/join/controllers/joinBarbershopAccount.controller";

export const VIEWS = {
  LOADING: "loading",
  ERROR: "error",
  // Invite flow
  SIGNUP: "signup",
  LOGIN: "login",
  CHECK_EMAIL: "check_email",
  RESUMING: "resuming",
  USE_EXISTING: "use_existing",
  CREATE_VPORT: "create_vport",
  ACCEPTED: "accepted",
  // QR flow
  QR_LOGIN: "qr_login",
  QR_CONFIRM: "qr_confirm",
  QR_CREATE_VPORT: "qr_create_vport",
};

export function useJoinBarbershop(token) {
  const { identity, identityLoading } = useIdentity();
  const { refreshVcActorDirectory, ensureVcsmPlatformBootstrap } = useIdentityOps();
  const { readCurrentAuthUserDAL, signInWithPassword } = useAuthOps();
  const { createVport } = useVportCoreOps();
  const [view, setView] = useState(VIEWS.LOADING);
  const [flowType, setFlowType] = useState(null); // 'qr' | 'invite'
  const [resource, setResource] = useState(null);
  const [barbershopName, setBarbershopName] = useState(null);
  const [barberVport, setBarberVport] = useState(null);
  const [existingVport, setExistingVport] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const authChecked = useRef(false);

  // Step 1: detect token type and load resource
  useEffect(() => {
    if (!token) {
      setError("Invalid invite link.");
      setView(VIEWS.ERROR);
      return;
    }

    loadQrJoin(token)
      .then((qrResource) => {
        if (qrResource) {
          setResource(qrResource);
          setBarbershopName(qrResource.barbershop?.name ?? null);
          setFlowType("qr");
        } else {
          return loadInviteForJoin(token).then((invResource) => {
            if (!invResource || invResource.meta?.invite_status !== "pending") {
              setError("This invite is no longer valid.");
              setView(VIEWS.ERROR);
            } else {
              setResource(invResource);
              setFlowType("invite");
            }
          });
        }
      })
      .catch((e) => {
        setError(e?.message || "Failed to load invite.");
        setView(VIEWS.ERROR);
      });
  }, [token]);

  // Step 2: once resource + identity are ready, determine view
  useEffect(() => {
    if (!resource || !flowType || identityLoading || authChecked.current) return;
    authChecked.current = true;

    if (flowType === "qr") {
      // Check token validity
      const meta = resource.meta || {};
      if (meta.status !== "pending_onboarding" || meta.join_token_used_at || resource.member_actor_id) {
        setError("This QR code has already been used.");
        setView(VIEWS.ERROR);
        return;
      }
      if (meta.join_expires_at && Date.now() > new Date(meta.join_expires_at).getTime()) {
        setError("This QR code has expired.");
        setView(VIEWS.ERROR);
        return;
      }

      if (!identity) {
        setView(VIEWS.QR_LOGIN);
        return;
      }

      // Logged in — find barber VPORT
      findCurrentUserBarberVport({ readCurrentAuthUserDAL })
        .then((vport) => {
          if (vport) {
            setBarberVport(vport);
            setView(VIEWS.QR_CONFIRM);
          } else {
            setView(VIEWS.QR_CREATE_VPORT);
          }
        })
        .catch(() => setView(VIEWS.QR_CREATE_VPORT));
      return;
    }

    // Invite flow
    checkJoinAuthState(token, { readCurrentAuthUserDAL })
      .then(({ action, vport }) => {
        if (action === "signup") {
          setView(VIEWS.SIGNUP);
        } else if (action === "auto_resume") {
          setView(VIEWS.RESUMING);
          autoResumeInviteOnboarding(token, { ensureVcsmPlatformBootstrap, refreshActorFn: refreshVcActorDirectory, readCurrentAuthUserDAL, createVport })
            .then(() => setView(VIEWS.ACCEPTED))
            .catch((e) => {
              setError(e?.message || "Setup failed.");
              setView(VIEWS.CREATE_VPORT);
            });
        } else if (action === "use_existing") {
          setExistingVport(vport);
          setView(VIEWS.USE_EXISTING);
        } else {
          setView(VIEWS.CREATE_VPORT);
        }
      })
      .catch(() => setView(VIEWS.SIGNUP));
  }, [resource, flowType, identityLoading, identity, token]);

  // ── After login (identity becomes non-null), recheck QR state ──────────
  const prevIdentity = useRef(null);
  useEffect(() => {
    if (flowType !== "qr" || !resource) return;
    if (!identity || prevIdentity.current === identity) return;
    prevIdentity.current = identity;
    if (view !== VIEWS.QR_LOGIN) return;

    findCurrentUserBarberVport({ readCurrentAuthUserDAL })
      .then((vport) => {
        if (vport) {
          setBarberVport(vport);
          setView(VIEWS.QR_CONFIRM);
        } else {
          setView(VIEWS.QR_CREATE_VPORT);
        }
      })
      .catch(() => setView(VIEWS.QR_CREATE_VPORT));
  }, [identity, flowType, resource, view, readCurrentAuthUserDAL]);

  // ── Actions ───────────────────────────────────────────────────────────

  const acceptQr = useCallback(async () => {
    if (!barberVport?.actor_id) return;
    const callerActorId = identity?.actorId ?? null;
    if (!callerActorId) return;
    setWorking(true);
    setError("");
    try {
      await acceptQrJoin(token, barberVport.actor_id, callerActorId);
      setView(VIEWS.ACCEPTED);
    } catch (e) {
      setError(e?.message || "Failed to accept invite.");
    } finally {
      setWorking(false);
    }
  }, [token, barberVport, identity]);

  const createVportAndAcceptQr = useCallback(async (vportName) => {
    setWorking(true);
    setError("");
    try {
      await createBarberVportAndAcceptQr(token, vportName, { createVport });
      setView(VIEWS.ACCEPTED);
    } catch (e) {
      setError(e?.message || "Failed to create Barber VPORT.");
    } finally {
      setWorking(false);
    }
  }, [token, createVport]);

  const signup = useCallback(async ({ name, username, email, password, vportName }) => {
    setWorking(true);
    setError("");
    try {
      const result = await signUpForBarbershopInvite(token, { name, username, email, password, vportName });
      setView(result.requiresEmailConfirm ? VIEWS.CHECK_EMAIL : VIEWS.LOADING);
      if (!result.requiresEmailConfirm) authChecked.current = false;
    } catch (e) {
      setError(e?.message || "Sign up failed.");
    } finally {
      setWorking(false);
    }
  }, [token]);

  const login = useCallback(async ({ email, password }) => {
    setWorking(true);
    setError("");
    try {
      await loginController(email, password, { signInWithPassword });
      authChecked.current = false;
      setView(VIEWS.LOADING);
    } catch (e) {
      setError(e?.message || "Sign in failed.");
    } finally {
      setWorking(false);
    }
  }, [signInWithPassword]);

  const createVportInvite = useCallback(async (vportName) => {
    setWorking(true);
    setError("");
    try {
      await createBarberVportAndAccept(token, vportName, { readCurrentAuthUserDAL, createVport });
      setView(VIEWS.ACCEPTED);
    } catch (e) {
      setError(e?.message || "Failed to create Barber VPORT.");
    } finally {
      setWorking(false);
    }
  }, [token, readCurrentAuthUserDAL, createVport]);

  const acceptWithExisting = useCallback(async () => {
    if (!existingVport?.actor_id) return;
    const callerActorId = identity?.actorId ?? null;
    if (!callerActorId) return;
    setWorking(true);
    setError("");
    try {
      await useExistingBarberVportAndAccept(token, existingVport.actor_id, { readCurrentAuthUserDAL, callerActorId });
      setView(VIEWS.ACCEPTED);
    } catch (e) {
      setError(e?.message || "Failed to accept invite.");
    } finally {
      setWorking(false);
    }
  }, [token, existingVport, identity, readCurrentAuthUserDAL]);

  return {
    view,
    flowType,
    resource,
    barbershopName,
    barberVport,
    existingVport,
    working,
    error,
    setView,
    setError,
    // QR actions
    acceptQr,
    createVportAndAcceptQr,
    // Invite actions
    signup,
    login,
    createVportInvite,
    acceptWithExisting,
    VIEWS,
  };
}

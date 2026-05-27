import { signUpForInviteDAL } from "@/features/join/dal/joinAuth.dal";
import { readBarberVportByOwnerUserIdDAL } from "@/features/join/dal/barberVport.read.dal";
import { fetchJoinResourceByIdDAL, acceptJoinResourceDAL } from "@/features/join/dal/joinInvite.dal";
import { recordSignupConsent } from "@/features/legal/adapters/legal.adapter";
import { bootstrapJoinOnboardingController } from "@/features/auth/adapters/auth.adapter";

const BARBER_CATEGORY = "barber";

export async function loadInviteForJoin(token) {
  if (!token) return null;
  return fetchJoinResourceByIdDAL(token);
}

export async function signUpForBarbershopInvite(token, { name, username, email, password, vportName }) {
  const emailRedirectTo = `${window.location.origin}/join/barbershop/${token}`;

  const data = await signUpForInviteDAL({
    email,
    password,
    emailRedirectTo,
    metadata: {
      pending_invite_token: token,
      display_name: name,
      desired_username: username,
      vport_name: vportName,
      category_key: BARBER_CATEGORY,
    },
  });

  const session = data?.session ?? null;

  // Record consent immediately when session is available (no email confirm required).
  // If email confirm is required, the ProtectedRoute gate will record consent on first entry.
  if (session?.user?.id) {
    await recordSignupConsent({ userId: session.user.id }).catch((err) => {
      // Consent recording must not block account creation.
      // The gate will self-heal at next ProtectedRoute entry.
      if (import.meta.env.DEV) console.warn('[joinBarbershop] recordSignupConsent failed:', err)
    });
  }

  return { requiresEmailConfirm: !session };
}

export async function loginForInvite(email, password, { signInWithPassword } = {}) {
  const result = await signInWithPassword?.({ email, password });
  if (result?.error) throw result.error;
  return result;
}

export async function checkJoinAuthState(token, { readCurrentAuthUserDAL } = {}) {
  const user = await readCurrentAuthUserDAL?.().catch(() => null);
  if (!user) return { action: "signup" };
  const meta = user.user_metadata || {};

  if (meta.pending_invite_token === token) {
    return { action: "auto_resume" };
  }

  const barberVport = await getExistingBarberVport(user.id, { readCurrentAuthUserDAL });
  if (barberVport) return { action: "use_existing", vport: barberVport };

  return { action: "create_vport" };
}

export async function getExistingBarberVport(userId, { readCurrentAuthUserDAL } = {}) {
  const uid = userId ?? (await readCurrentAuthUserDAL?.().catch(() => null))?.id;
  if (!uid) return null;
  return readBarberVportByOwnerUserIdDAL(uid);
}

export async function autoResumeInviteOnboarding(token, {
  ensureVcsmPlatformBootstrap,
  refreshActorFn,
  readCurrentAuthUserDAL,
  createVport,
} = {}) {
  const user = await readCurrentAuthUserDAL?.();
  if (!user) throw new Error("Not signed in.");
  const meta = user.user_metadata || {};
  const displayName = String(meta.display_name || "").trim();
  const desiredUsername = String(meta.desired_username || displayName).trim();
  const vportName = String(meta.vport_name || displayName).trim();

  if (!displayName) throw new Error("Missing account details. Please sign up again.");

  // Session ownership verified inside bootstrapJoinOnboardingController
  await bootstrapJoinOnboardingController({
    userId: user.id,
    displayName,
    desiredUsername,
    refreshActorFn,
    ensureVcsmPlatformBootstrap,
  });

  const vportResult = await createVport?.({
    name: vportName,
    vportType: BARBER_CATEGORY,
    directoryVisible: true,
  });

  await acceptJoinResourceDAL(token, vportResult.actorId);

  return { barberVportActorId: vportResult.actorId };
}

export async function createBarberVportAndAccept(token, vportName, { readCurrentAuthUserDAL, createVport } = {}) {
  const user = await readCurrentAuthUserDAL?.();
  if (!user) throw new Error("Not signed in.");

  const vportResult = await createVport?.({
    name: vportName,
    vportType: BARBER_CATEGORY,
    directoryVisible: true,
  });

  await acceptJoinResourceDAL(token, vportResult.actorId);

  return { barberVportActorId: vportResult.actorId };
}

export async function useExistingBarberVportAndAccept(token, vportActorId, { readCurrentAuthUserDAL } = {}) {
  const user = await readCurrentAuthUserDAL?.();
  if (!user) throw new Error("Not signed in.");

  const existingVport = await readBarberVportByOwnerUserIdDAL(user.id);
  if (!existingVport || String(existingVport.actor_id) !== String(vportActorId)) {
    throw new Error("Caller does not own this barber vport.");
  }

  await acceptJoinResourceDAL(token, vportActorId);
  return { barberVportActorId: vportActorId };
}

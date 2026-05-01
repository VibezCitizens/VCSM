import { signUpForInviteDAL } from "@/features/join/dal/joinAuth.dal";
import { readBarberVportByOwnerUserIdDAL } from "@/features/join/dal/barberVport.read.dal";
import { fetchJoinResourceByIdDAL, acceptJoinResourceDAL } from "@/features/join/dal/joinInvite.dal";

const BARBER_CATEGORY = "barber";

function syntheticAdultBirthdate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

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

async function buildAndBootstrapUserActor(user, displayName, desiredUsername, {
  ensureVcsmPlatformBootstrap,
  refreshActorFn,
  generateUsernameDAL,
  upsertCompletedOnboardingProfileDAL,
  createUserActorForProfile,
} = {}) {
  const username = await generateUsernameDAL?.({
    displayName,
    usernameBase: desiredUsername,
  });

  await upsertCompletedOnboardingProfileDAL?.({
    profileId: user.id,
    displayName,
    username,
    birthdate: syntheticAdultBirthdate(),
    age: 18,
    isAdult: true,
    sex: null,
    updatedAt: new Date().toISOString(),
  });

  const actor = await createUserActorForProfile?.({
    profileId: user.id,
    userId: user.id,
    refreshActorFn,
  });

  if (actor?.id) {
    await ensureVcsmPlatformBootstrap?.({
      userId: user.id,
      actorId: actor.id,
    }).catch(() => {});
  }

  return actor;
}

export async function autoResumeInviteOnboarding(token, {
  ensureVcsmPlatformBootstrap,
  refreshActorFn,
  readCurrentAuthUserDAL,
  generateUsernameDAL,
  upsertCompletedOnboardingProfileDAL,
  createUserActorForProfile,
  createVport,
} = {}) {
  const user = await readCurrentAuthUserDAL?.();
  if (!user) throw new Error("Not signed in.");
  const meta = user.user_metadata || {};
  const displayName = String(meta.display_name || "").trim();
  const desiredUsername = String(meta.desired_username || displayName).trim();
  const vportName = String(meta.vport_name || displayName).trim();

  if (!displayName) throw new Error("Missing account details. Please sign up again.");

  await buildAndBootstrapUserActor(user, displayName, desiredUsername, {
    ensureVcsmPlatformBootstrap,
    refreshActorFn,
    generateUsernameDAL,
    upsertCompletedOnboardingProfileDAL,
    createUserActorForProfile,
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

export async function useExistingBarberVportAndAccept(token, vportActorId) {
  await acceptJoinResourceDAL(token, vportActorId);
  return { barberVportActorId: vportActorId };
}

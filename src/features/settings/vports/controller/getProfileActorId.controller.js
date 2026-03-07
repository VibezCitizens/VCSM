import { readActorOwnersByUserDAL } from "@/features/settings/vports/dal/actorOwners.read.dal";

export async function ctrlGetProfileActorId({ userId }) {
  if (!userId) return null;

  const rows = await readActorOwnersByUserDAL({ userId });
  const userActor = rows
    .map((row) => row?.actor)
    .find((actor) => actor?.kind === "user");

  return userActor?.id ?? null;
}

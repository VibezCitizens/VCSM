import { readAuthedUserDAL } from "@/features/settings/vports/dal/auth.read.dal";

export async function ctrlGetAuthedUserId() {
  const user = await readAuthedUserDAL();
  if (!user?.id) throw new Error("Not authenticated");
  return user.id;
}

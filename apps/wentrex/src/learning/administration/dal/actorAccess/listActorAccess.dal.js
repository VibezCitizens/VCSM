import { ACTOR_ACCESS_COLUMNS } from "@/learning/administration/dal/actorAccess/getActorAccess.dal";

export async function listActorAccessDal({ supabase }) {
  if (!supabase) {
    throw new Error("listActorAccessDal requires supabase");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("actor_access")
    .select(ACTOR_ACCESS_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listActorAccessDal;

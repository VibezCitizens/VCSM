// src/features/profiles/kinds/vport/dal/content/createVportContentPage.dal.js

import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";

export async function readContentPageSlugsByPrefixDAL({ actorId, slugPrefix }) {
  const { data } = await vportSchema
    .from("content_pages")
    .select("slug")
    .eq("actor_id", actorId)
    .like("slug", `${slugPrefix}%`);

  return (data ?? []).map((r) => r.slug);
}

const CONTENT_SELECT =
  "id,actor_id,profile_id,title,slug,excerpt,body,category,service_keys,is_published,is_indexable,published_at,created_at,updated_at";

export async function createVportContentPageDAL({
  actorId,
  title,
  slug,
  excerpt = null,
  body = null,
  category = null,
  serviceKeys = [],
} = {}) {
  if (!actorId) throw new Error("createVportContentPageDAL: actorId is required");

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) throw new Error("createVportContentPageDAL: vport profile not found for actor");

  const { data, error } = await vportSchema
    .from("content_pages")
    .insert([
      {
        actor_id: actorId,
        profile_id: profileId,
        title,
        slug,
        excerpt,
        body,
        category,
        service_keys: Array.isArray(serviceKeys) ? serviceKeys : [],
        is_published: false,
        is_indexable: false,
      },
    ])
    .select(CONTENT_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export default createVportContentPageDAL;

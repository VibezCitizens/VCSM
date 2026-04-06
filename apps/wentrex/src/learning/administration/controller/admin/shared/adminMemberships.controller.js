import { VISIBLE_MEMBERSHIP_STATUSES } from "@/learning/administration/controller/admin/shared/adminRoles.controller";

const COURSE_MEMBERSHIP_COLUMNS = `
  id,
  course_id,
  actor_id,
  role,
  status,
  created_by_actor_id,
  created_at
`;

const ORGANIZATION_MEMBERSHIP_COLUMNS = `
  id,
  organization_id,
  actor_id,
  role,
  status,
  created_by_actor_id,
  created_at
`;

export async function getOrganizationMembershipRow({
  supabase,
  organizationId,
  actorId,
}) {
  const { data, error } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .select(ORGANIZATION_MEMBERSHIP_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("actor_id", actorId)
    .in("status", VISIBLE_MEMBERSHIP_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      return null;
    }

    throw error;
  }

  return data ?? null;
}

export async function listOrganizationMembershipRows({
  supabase,
  organizationId,
}) {
  const { data, error } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .select(ORGANIZATION_MEMBERSHIP_COLUMNS)
    .eq("organization_id", organizationId)
    .in("status", VISIBLE_MEMBERSHIP_STATUSES)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "42P01") {
      return [];
    }

    throw error;
  }

  return data ?? [];
}

export async function listOrganizationMembershipRowsForActor({
  supabase,
  organizationId,
  actorId,
}) {
  const { data, error } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .select(ORGANIZATION_MEMBERSHIP_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("actor_id", actorId)
    .in("status", VISIBLE_MEMBERSHIP_STATUSES)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      return [];
    }

    throw error;
  }

  return data ?? [];
}

export async function saveCourseMembership({
  supabase,
  existingMembershipRow,
  courseId,
  memberActorId,
  role,
  status,
  createdByActorId,
}) {
  if (existingMembershipRow?.id) {
    const { data, error } = await supabase
      .schema("learning")
      .from("course_memberships")
      .update({
        role,
        status,
      })
      .eq("id", existingMembershipRow.id)
      .select(COURSE_MEMBERSHIP_COLUMNS)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ?? null;
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("course_memberships")
    .insert({
      course_id: courseId,
      actor_id: memberActorId,
      role,
      status,
      created_by_actor_id: createdByActorId,
    })
    .select(COURSE_MEMBERSHIP_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function saveOrganizationMembership({
  supabase,
  existingMembershipRow,
  organizationId,
  memberActorId,
  role,
  status,
  createdByActorId,
}) {
  if (existingMembershipRow?.id) {
    const { data, error } = await supabase
      .schema("learning")
      .from("organization_memberships")
      .update({
        role,
        status,
      })
      .eq("id", existingMembershipRow.id)
      .select(ORGANIZATION_MEMBERSHIP_COLUMNS)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ?? null;
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("organization_memberships")
    .insert({
      organization_id: organizationId,
      actor_id: memberActorId,
      role,
      status,
      created_by_actor_id: createdByActorId,
    })
    .select(ORGANIZATION_MEMBERSHIP_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

import {
  listRawMembershipsByActorDal,
  listActiveMembershipsByActorDal,
  listAdminRoleMembershipsByActorDal,
  listVisibleOrganizationsDal,
  listVisibleRealmsDal,
  listLearningActorsForUserDal,
  getActorAccessDiagnosticDal,
} from "@/learning/administration/dal/diagnostics/adminDiagnostics.dal";

export async function runAdminDiagnosticsController({ supabase, actorId }) {
  const results = {};

  try {
    results.memberships_raw = await listRawMembershipsByActorDal({
      supabase,
      actorId,
    });
  } catch (e) {
    results.memberships_raw = { data: [], error: e?.message ?? String(e) };
  }

  try {
    results.memberships_active_only = await listActiveMembershipsByActorDal({
      supabase,
      actorId,
    });
  } catch (e) {
    results.memberships_active_only = {
      data: [],
      error: e?.message ?? String(e),
    };
  }

  try {
    results.memberships_admin_roles = await listAdminRoleMembershipsByActorDal({
      supabase,
      actorId,
    });
  } catch (e) {
    results.memberships_admin_roles = {
      data: [],
      error: e?.message ?? String(e),
    };
  }

  try {
    results.organizations_visible = await listVisibleOrganizationsDal({
      supabase,
    });
  } catch (e) {
    results.organizations_visible = {
      data: [],
      error: e?.message ?? String(e),
    };
  }

  try {
    results.realms_visible = await listVisibleRealmsDal({ supabase });
  } catch (e) {
    results.realms_visible = { data: [], error: e?.message ?? String(e) };
  }

  try {
    results.learning_actors_for_user = await listLearningActorsForUserDal({
      supabase,
    });
  } catch (e) {
    results.learning_actors_for_user = {
      data: [],
      error: e?.message ?? String(e),
    };
  }

  try {
    results.actor_access = await getActorAccessDiagnosticDal({
      supabase,
      actorId,
    });
  } catch (e) {
    results.actor_access = { data: null, error: e?.message ?? String(e) };
  }

  return results;
}

export default runAdminDiagnosticsController;

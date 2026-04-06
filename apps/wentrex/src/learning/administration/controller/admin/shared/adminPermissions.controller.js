import { hasActiveAdminRole } from "@/learning/administration/controller/admin/shared/adminRoles.controller";

export function canManageOrganization({
  actorId,
  organizationRow,
  organizationMembershipRow,
  isPlatformAdminActor = false,
}) {
  if (!actorId || !organizationRow) {
    return false;
  }

  if (isPlatformAdminActor) {
    return true;
  }

  if (organizationRow.owner_actor_id === actorId) {
    return true;
  }

  return hasActiveAdminRole(organizationMembershipRow);
}

export function canManageCourse({
  actorId,
  courseRow,
  courseMembershipRow,
  organizationRow,
  organizationMembershipRow,
  isPlatformAdminActor = false,
}) {
  if (!actorId || !courseRow) {
    return false;
  }

  if (isPlatformAdminActor) {
    return true;
  }

  if (courseRow.created_by_actor_id === actorId) {
    return true;
  }

  if (hasActiveAdminRole(courseMembershipRow)) {
    return true;
  }

  if (organizationRow?.owner_actor_id === actorId) {
    return true;
  }

  return hasActiveAdminRole(organizationMembershipRow);
}

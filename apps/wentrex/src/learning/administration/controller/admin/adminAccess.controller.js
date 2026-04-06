/**
 * Barrel re-export for adminAccess responsibilities.
 *
 * The original monolithic adminAccess.js has been split into focused files:
 *   - shared/adminRoles.controller.js       (role constants and normalizers)
 *   - shared/adminAuth.controller.js         (platform admin / authorization checks)
 *   - shared/adminMemberships.controller.js  (membership CRUD)
 *   - shared/adminPermissions.controller.js  (canManageOrganization, canManageCourse)
 */
export {
  ADMIN_ROLES,
  TEACHING_ROLES,
  OBSERVER_ROLES,
  ORGANIZATION_MEMBER_ROLES,
  VISIBLE_MEMBERSHIP_STATUSES,
  MUTABLE_MEMBERSHIP_STATUSES,
  hasVisibleMembership,
  hasActiveAdminRole,
  normalizeTeacherRole,
  normalizeObserverRole,
  normalizeOrganizationRole,
  normalizeMembershipStatus,
} from "@/learning/administration/controller/admin/shared/adminRoles.controller";

export {
  isPlatformAdmin,
  isAdminAuthorized,
} from "@/learning/administration/controller/admin/shared/adminAuth.controller";

export {
  getOrganizationMembershipRow,
  listOrganizationMembershipRows,
  listOrganizationMembershipRowsForActor,
  saveCourseMembership,
  saveOrganizationMembership,
} from "@/learning/administration/controller/admin/shared/adminMemberships.controller";

export {
  canManageOrganization,
  canManageCourse,
} from "@/learning/administration/controller/admin/shared/adminPermissions.controller";

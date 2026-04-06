/**
 * @deprecated Import from "@/learning/administration/controller/admin/adminAccess.controller" instead.
 *
 * This file is a backwards-compatible re-export from the original monolithic
 * adminAccess.js. All exports have been moved to focused controller files
 * under shared/.
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
  isPlatformAdmin,
  isAdminAuthorized,
  getOrganizationMembershipRow,
  listOrganizationMembershipRows,
  listOrganizationMembershipRowsForActor,
  saveCourseMembership,
  saveOrganizationMembership,
  canManageOrganization,
  canManageCourse,
} from "@/learning/administration/controller/admin/adminAccess.controller";

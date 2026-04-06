export const ADMIN_ROLES = new Set(["admin", "owner", "staff"]);
export const TEACHING_ROLES = new Set(["teacher", "instructor", "ta", "grader"]);
export const OBSERVER_ROLES = new Set(["parent", "observer"]);
export const ORGANIZATION_MEMBER_ROLES = new Set(["admin", "owner", "staff"]);
export const VISIBLE_MEMBERSHIP_STATUSES = [
  "invited",
  "active",
  "completed",
  "dropped",
  "removed",
];
export const MUTABLE_MEMBERSHIP_STATUSES = new Set(VISIBLE_MEMBERSHIP_STATUSES);

export function hasVisibleMembership(membershipRow) {
  return Boolean(
    membershipRow &&
      membershipRow.status &&
      VISIBLE_MEMBERSHIP_STATUSES.includes(membershipRow.status),
  );
}

export function hasActiveAdminRole(membershipRow) {
  return Boolean(
    hasVisibleMembership(membershipRow) &&
      membershipRow.status !== "removed" &&
      ADMIN_ROLES.has(membershipRow.role),
  );
}

export function normalizeTeacherRole(role) {
  if (TEACHING_ROLES.has(role)) {
    return role;
  }

  return "teacher";
}

export function normalizeObserverRole(role) {
  if (OBSERVER_ROLES.has(role)) {
    return role;
  }

  return "parent";
}

export function normalizeOrganizationRole(role) {
  if (ORGANIZATION_MEMBER_ROLES.has(role)) {
    return role;
  }

  return "staff";
}

export function normalizeMembershipStatus(status) {
  if (MUTABLE_MEMBERSHIP_STATUSES.has(status)) {
    return status;
  }

  return "active";
}

import { getVportProfileIdByActorDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import {
  listVportResourcesByProfileIdDAL,
  listVportResourcesByOwnerActorIdDAL,
} from "@/features/vportDashboard/dal/read/vportResource.read.dal";
import { listValidMemberActorIdsDAL } from "@/features/vportDashboard/dal/read/actorValidity.read.dal";
import { listVportAvailabilityRulesByResourceIdsDAL } from "@/features/vportDashboard/dal/read/vportAvailabilityRules.read.dal";
import { listVportBookingsForProfileDayDAL } from "@/features/vportDashboard/dal/read/listVportBookingsForProfileDay.read.dal";
import { listVportServicesByProfileIdDAL } from "@/features/vportDashboard/dal/read/vportServices.read.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

export async function loadDayScheduleController({ actorId, dateKey, callerActorId }) {
  try {
    if (!actorId || !dateKey) throw new Error("actorId and dateKey are required");
    if (!callerActorId) throw new Error("loadDayScheduleController: callerActorId is required");

    // Ownership gate — prevents any authenticated actor from reading another VPORT's
    // schedule (which includes customer names and notes). VPD-V-022.
    // Session-derived (IDENTITY-BOUNDARY-006 / ELEK-004): the active actor here is the
    // VPORT itself, so ownership is resolved from the auth session via actor_owners
    // rather than trusting the UI-passed caller actor id.
    await assertSessionOwnsActorController({ targetActorId: actorId });

    const profileId = await getVportProfileIdByActorDAL({ actorId });
    if (!profileId) throw new Error("Vport profile not found.");

    // Merge profile-based resources (legacy staff) + actor-based resources (engine calendar resource)
    const [profileResources, actorResources] = await Promise.all([
      listVportResourcesByProfileIdDAL({ profileId }),
      listVportResourcesByOwnerActorIdDAL({ ownerActorId: actorId }),
    ]);
    const seen = new Set();
    const mergedResources = [...profileResources, ...actorResources].filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    // Exclude resources whose linked team member actor has been deleted, voided,
    // or removed. Without this filter a deleted team member's still-active staff
    // resource renders as a ghost "User / No schedule set" lane. Resources with
    // no member_actor_id (the VPORT's own primary lane, rooms, chairs, etc.) are
    // always kept.
    const memberActorIds = mergedResources.map((r) => r.member_actor_id).filter(Boolean);
    const validMemberActorIds = await listValidMemberActorIdsDAL({ actorIds: memberActorIds });
    const validStaff = mergedResources.filter(
      (r) => !r.member_actor_id || validMemberActorIds.has(r.member_actor_id)
    );

    // Hide the auto-created primary "Default calendar" resource (member_actor_id
    // is null) from the team schedule when the shop has at least one staff/barber
    // lane. It is not a team member and would otherwise render as a ghost
    // "User / No schedule set" lane next to the real barbers. A vport with no
    // staff keeps its single primary lane so solo booking is unchanged.
    const hasStaffLane = validStaff.some((r) => r.resource_type === "staff");
    const staff = hasStaffLane
      ? validStaff.filter((r) => r.resource_type !== "primary")
      : validStaff;

    const [year, month, day] = dateKey.split("-").map(Number);
    const dateObj    = new Date(year, month - 1, day);
    const weekdayInt = dateObj.getDay();

    const allRulesFlat = await listVportAvailabilityRulesByResourceIdsDAL({ resourceIds: staff.map((m) => m.id) });
    const rulesMap = {};
    for (const rule of allRulesFlat) {
      if (!rulesMap[rule.resource_id]) rulesMap[rule.resource_id] = [];
      rulesMap[rule.resource_id].push(rule);
    }

    const rangeStart = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
    const rangeEnd   = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
    const allBookings = await listVportBookingsForProfileDayDAL({
      resourceIds: staff.map((m) => m.id),
      rangeStart,
      rangeEnd,
    });

    const services = await listVportServicesByProfileIdDAL({ profileId }).catch(() => []);

    const lanes = staff.map((member) => {
      const allRules = rulesMap[member.id] ?? [];
      const dayRules = allRules.filter((r) => Number(r.weekday) === weekdayInt);
      const bookings = allBookings.filter((b) => b.resource_id === member.id);
      return {
        resource:     member,
        dayRules,
        bookings,
        hasRules:     allRules.length > 0,
        isWorking:    dayRules.length > 0,
        bookingCount: bookings.length,
      };
    });

    return {
      actorId,
      profileId,
      dateKey,
      weekdayInt,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lanes,
      services,
    };
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'schedule.loadDaySchedule.controller', severity: 'error', message: `loadDayScheduleController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'loadDaySchedule', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

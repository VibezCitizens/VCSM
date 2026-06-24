import { getVportProfileIdByActorDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import {
  listVportResourcesByProfileIdDAL,
  listVportResourcesByOwnerActorIdDAL,
} from "@/features/vportDashboard/dal/read/vportResource.read.dal";
import { listVportAvailabilityRulesByResourceIdsDAL } from "@/features/vportDashboard/dal/read/vportAvailabilityRules.read.dal";
import { listVportBookingsInRangeDAL } from "@/features/vportDashboard/dal/read/vportBookingsInRange.read.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";

// Read-only loader for the Bookings "Team available today" section.
//
// Mirrors the resource + availability_rules + weekday-filter shape of the schedule
// card's loadDayScheduleController, but uses the SESSION-derived ownership gate
// (assertSessionOwnsActorController) instead of the actor-to-actor gate. The
// vport dashboard runs in "self" mode — the active/caller actor is the VPORT itself —
// so the actor-to-actor gate's user-kind requirement cannot be satisfied here. The
// session gate derives the owner from the Supabase auth session via actor_owners
// (no profiles.user_id, no owner_user_id). It also skips the bookings/services fetch
// this widget does not need.
export async function loadTeamAvailabilityDayController({ actorId, dateKey }) {
  try {
    if (!actorId || !dateKey) throw new Error("actorId and dateKey are required");

    // Session-derived ownership gate — verifies the authenticated user owns this VPORT.
    await assertSessionOwnsActorController({ targetActorId: actorId });

    const profileId = await getVportProfileIdByActorDAL({ actorId });
    if (!profileId) throw new Error("Vport profile not found.");

    // Active resources only (both DALs default to is_active = true). Merge profile-based
    // (legacy staff) and actor-based (engine calendar) resources, de-duped by id.
    const [profileResources, actorResources] = await Promise.all([
      listVportResourcesByProfileIdDAL({ profileId }),
      listVportResourcesByOwnerActorIdDAL({ ownerActorId: actorId }),
    ]);
    const seen = new Set();
    const staff = [...profileResources, ...actorResources].filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    if (staff.length === 0) return { actorId, dateKey, lanes: [] };

    const [year, month, day] = dateKey.split("-").map(Number);
    const weekdayInt = new Date(year, month - 1, day).getDay();

    const allRulesFlat = await listVportAvailabilityRulesByResourceIdsDAL({
      resourceIds: staff.map((m) => m.id),
    });
    const rulesByResource = {};
    for (const rule of allRulesFlat) {
      (rulesByResource[rule.resource_id] ??= []).push(rule);
    }

    // Occupied bookings for the day, per resource. Reuses the existing range reader,
    // which already excludes cancelled/no_show. Status-based slot blocking is applied
    // downstream in the model (pending/confirmed/hold only).
    const rangeStart = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
    const rangeEnd = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
    const bookingsByResource = {};
    await Promise.all(
      staff.map(async (member) => {
        bookingsByResource[member.id] = await listVportBookingsInRangeDAL({
          resourceId: member.id,
          rangeStart,
          rangeEnd,
        });
      })
    );

    const lanes = staff.map((member) => {
      const dayRules = (rulesByResource[member.id] ?? []).filter(
        (r) => Number(r.weekday) === weekdayInt
      );
      return {
        resource: member,
        dayRules,
        bookings: bookingsByResource[member.id] ?? [],
      };
    });

    return { actorId, dateKey, weekdayInt, lanes };
  } catch (error) {
    captureVcsmError({
      feature: "vportDashboard",
      module: "bookings.loadTeamAvailabilityDay.controller",
      severity: "error",
      message: `loadTeamAvailabilityDayController: ${error?.message ?? "unknown"}`,
      error_name: error?.name,
      operation: "loadTeamAvailabilityDay",
      is_handled: true,
      context: { dbErrorCode: error?.code ?? null },
    });
    throw error;
  }
}

export default loadTeamAvailabilityDayController;

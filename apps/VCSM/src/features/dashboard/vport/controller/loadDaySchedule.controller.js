import { getVportProfileIdByActorDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import {
  listVportResourcesByProfileIdDAL,
  listVportResourcesByOwnerActorIdDAL,
} from "@/features/dashboard/vport/dal/read/vportResource.read.dal";
import { listVportAvailabilityRulesByResourceIdsDAL } from "@/features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal";
import { listVportBookingsForProfileDayDAL } from "@/features/dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal";
import { listVportServicesByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportServices.read.dal";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

export async function loadDayScheduleController({ actorId, dateKey, callerActorId }) {
  if (!actorId || !dateKey) throw new Error("actorId and dateKey are required");
  if (!callerActorId) throw new Error("loadDayScheduleController: callerActorId is required");

  // Ownership gate — prevents any authenticated actor from reading another VPORT's
  // schedule (which includes customer names and notes). VPD-V-022.
  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });

  const profileId = await getVportProfileIdByActorDAL({ actorId });
  if (!profileId) throw new Error("Vport profile not found.");

  // Merge profile-based resources (legacy staff) + actor-based resources (engine calendar resource)
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
}

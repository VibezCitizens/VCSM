import { getVportProfileIdByActorDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { listVportResourcesByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportResource.read.dal";
import { listVportAvailabilityRulesByResourceIdDAL } from "@/features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal";
import { listVportBookingsForProfileDayDAL } from "@/features/dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal";
import { listVportServicesByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportServices.read.dal";

export async function loadDayScheduleController({ actorId, dateKey }) {
  if (!actorId || !dateKey) throw new Error("actorId and dateKey are required");

  const profileId = await getVportProfileIdByActorDAL({ actorId });
  if (!profileId) throw new Error("Vport profile not found.");

  const staff = await listVportResourcesByProfileIdDAL({ profileId });

  const [year, month, day] = dateKey.split("-").map(Number);
  const dateObj    = new Date(year, month - 1, day);
  const weekdayInt = dateObj.getDay();

  const rulesResults = await Promise.all(
    staff.map((m) =>
      listVportAvailabilityRulesByResourceIdDAL({ resourceId: m.id })
        .then((rules) => [m.id, rules])
        .catch(() => [m.id, []])
    )
  );
  const rulesMap = Object.fromEntries(rulesResults);

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

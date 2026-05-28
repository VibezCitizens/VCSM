import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { fetchTeamMembersByProfileId } from "@/features/dashboard/vport/dashboard/cards/team/dal/vportTeam.read.dal";
import { listVportBookingsForProfileDayDAL } from "@/features/dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal";
import { listVportResourcesByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportResource.read.dal";

function todayRange() {
  const d = new Date();
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  return {
    start: new Date(y, m, day, 0, 0, 0, 0).toISOString(),
    end:   new Date(y, m, day, 23, 59, 59, 999).toISOString(),
  };
}

function upcomingRange() {
  const d = new Date();
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  return {
    start: new Date(y, m, day + 1, 0, 0, 0, 0).toISOString(),
    end:   new Date(y, m, day + 8, 0, 0, 0, 0).toISOString(),
  };
}

export async function loadOwnerQuickStatsController({ actorId }) {
  if (!actorId) throw new Error("actorId is required");

  const profile = await readVportProfileByActorIdDAL({ actorId });
  if (!profile?.id) throw new Error("Could not resolve vport profile.");
  const profileId = profile.id;

  const today    = todayRange();
  const upcoming = upcomingRange();

  const [members, resources] = await Promise.all([
    fetchTeamMembersByProfileId(profileId),
    listVportResourcesByProfileIdDAL({ profileId }),
  ]);

  const resourceIds = (resources ?? []).map((r) => r.id);

  const [todayBookings, upcomingBookings] = await Promise.all([
    resourceIds.length > 0
      ? listVportBookingsForProfileDayDAL({ resourceIds, rangeStart: today.start,    rangeEnd: today.end    })
      : Promise.resolve([]),
    resourceIds.length > 0
      ? listVportBookingsForProfileDayDAL({ resourceIds, rangeStart: upcoming.start, rangeEnd: upcoming.end })
      : Promise.resolve([]),
  ]);

  const activeBarbers = (members ?? []).filter(
    (m) => m.resource_type === "staff" && m.is_active !== false && m.meta?.status === "linked"
  ).length;

  return {
    todayCount:    todayBookings.length,
    upcomingCount: upcomingBookings.length,
    activeBarbers,
  };
}

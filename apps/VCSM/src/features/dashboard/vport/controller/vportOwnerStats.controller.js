import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { fetchTeamMembersByProfileId } from "@/features/dashboard/vport/dal/read/vportTeam.read.dal";
import { listVportBookingsForProfileDayDAL } from "@/features/dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal";

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

  const [members, todayBookings, upcomingBookings] = await Promise.all([
    fetchTeamMembersByProfileId(profileId),
    listVportBookingsForProfileDayDAL({ profileId, rangeStart: today.start,    rangeEnd: today.end    }),
    listVportBookingsForProfileDayDAL({ profileId, rangeStart: upcoming.start, rangeEnd: upcoming.end }),
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

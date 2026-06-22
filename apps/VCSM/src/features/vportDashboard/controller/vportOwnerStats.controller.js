import { readVportProfileByActorIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import { listVportBookingsForProfileDayDAL } from "@/features/vportDashboard/dal/read/listVportBookingsForProfileDay.read.dal";
import {
  listVportResourcesByProfileIdDAL,
  listVportStaffResourcesByProfileIdDAL,
} from "@/features/vportDashboard/dal/read/vportResource.read.dal";
import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

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

export async function loadOwnerQuickStatsController({ actorId, callerActorId } = {}) {
  if (!actorId) throw new Error("actorId is required");
  if (!callerActorId) throw new Error("callerActorId is required");

  try {
    // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): the active actor
    // reaching this dashboard is the VPORT itself, so the actor gate's user-kind
    // requirement cannot be satisfied. The session gate verifies the authenticated
    // user owns this vport via actor_owners, without trusting any UI-passed actor id.
    await assertSessionOwnsVportActorController({ targetActorId: actorId });

    const profile = await readVportProfileByActorIdDAL({ actorId });
    if (!profile?.id) throw new Error("Could not resolve vport profile.");
    if (!profile.is_active || profile.is_deleted) throw new Error("VPORT profile is not available.");
    const profileId = profile.id;

    const today    = todayRange();
    const upcoming = upcomingRange();

    const [staffRows, resources] = await Promise.all([
      listVportStaffResourcesByProfileIdDAL({ profileId }),
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

    const activeBarbers = staffRows.filter(
      (m) => m.is_active !== false && m.meta?.status === "linked"
    ).length;

    return {
      todayCount:    todayBookings.length,
      upcomingCount: upcomingBookings.length,
      activeBarbers,
    };
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'vportOwnerStats.controller', severity: 'error', message: `loadOwnerQuickStatsController: failed — ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'loadOwnerQuickStats', is_handled: false, context: { actorId: actorId ?? null } })
    throw error
  }
}

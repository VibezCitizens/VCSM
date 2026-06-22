import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import setResourceSlotDurationController from "@/features/booking/controllers/setResourceSlotDuration.controller";
import {
  isMissingColumn,
  isMissingRelation,
  isPermissionDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { getBookingsState } from "@/dev/diagnostics/groups/bookings.group.helpers";

const GROUP_ID = "bookings";

export const createServiceProfileTest = {
  id: buildTestId(GROUP_ID, "create_service_profile"),
  name: "create booking service profile (if applicable)",
  run: async ({ shared: localShared }) => {
    const state = getBookingsState(localShared);
    if (!state.ownerActorId || !state.resourceId) {
      return makeSkipped("Booking seed not prepared before service profile test.", {
        ownerActorId: state.ownerActorId ?? null,
        resourceId: state.resourceId ?? null,
      });
    }

    try {
      const { actorId: requestActorId } = await ensureActorContext(localShared);
      const result = await setResourceSlotDurationController({
        requestActorId,
        resourceId: state.resourceId,
        durationMinutes: 30,
      });

      const serviceIds = Array.isArray(result?.serviceIds) ? result.serviceIds : [];
      if (!serviceIds.length) {
        return makeSkipped("No service ids returned by setResourceSlotDuration controller", {
          ownerActorId: state.ownerActorId,
          resourceId: state.resourceId,
          result,
        });
      }

      state.serviceId = serviceIds[0] ?? null;
      return {
        requestActorId,
        ownerActorId: state.ownerActorId,
        resourceId: state.resourceId,
        serviceId: state.serviceId,
        serviceIds,
        serviceProfiles: result?.serviceProfiles ?? [],
        durationMinutes: result?.durationMinutes ?? 30,
        source: "setResourceSlotDurationController",
      };
    } catch (error) {
      if (String(error?.message || "").includes("No enabled services found yet")) {
        return makeSkipped("No enabled vport services available for booking service profile path", {
          ownerActorId: state.ownerActorId,
          resourceId: state.resourceId,
          error,
        });
      }
      if (isMissingRelation(error) || isMissingColumn(error)) {
        return makeSkipped("Booking service profile tables/columns unavailable", {
          ownerActorId: state.ownerActorId,
          error,
        });
      }
      if (isPermissionDenied(error)) {
        return makeSkipped("Booking service profile write denied by policy", {
          ownerActorId: state.ownerActorId,
          error,
        });
      }
      throw error;
    }
  },
};

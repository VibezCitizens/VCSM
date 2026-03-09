import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicBookingObjects } from "@/dev/diagnostics/helpers/ensureSeedData";
import {
  isPermissionDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { buildBookingWindow } from "@/dev/diagnostics/groups/bookings.group.helpers";
import ensureOwnerBookingResourceController from "@/features/booking/controller/ensureOwnerBookingResource.controller";
import listOwnerBookingResourcesController from "@/features/booking/controller/listOwnerBookingResources.controller";
import setResourceSlotDurationController from "@/features/booking/controller/setResourceSlotDuration.controller";
import setAvailabilityRuleController from "@/features/booking/controller/setAvailabilityRule.controller";
import setAvailabilityExceptionController from "@/features/booking/controller/setAvailabilityException.controller";
import createBookingController from "@/features/booking/controller/createBooking.controller";
import getResourceAvailabilityController from "@/features/booking/controller/getResourceAvailability.controller";
import confirmBookingController from "@/features/booking/controller/confirmBooking.controller";
import cancelBookingController from "@/features/booking/controller/cancelBooking.controller";

export const GROUP_ID = "bookingFeature";
export const GROUP_LABEL = "Booking Feature";

const TESTS = [
  { key: "ensure_owner_resource", name: "ensure owner booking resource via controller" },
  { key: "list_owner_resources", name: "list owner booking resources via controller" },
  { key: "set_slot_duration", name: "set resource slot duration via controller" },
  { key: "set_availability_rule", name: "set availability rule via controller" },
  { key: "set_availability_exception", name: "set availability exception via controller" },
  { key: "create_booking_owner", name: "create booking via controller (owner source)" },
  { key: "get_availability", name: "get resource availability via controller" },
  { key: "confirm_cancel_booking", name: "confirm + cancel booking via controllers" },
];

export function getBookingFeatureTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

function getState(shared) {
  if (!shared.cache.bookingFeatureState) {
    shared.cache.bookingFeatureState = {};
  }
  return shared.cache.bookingFeatureState;
}

async function ensureContext(shared) {
  const state = getState(shared);
  if (state.requestActorId && state.ownerActorId && state.resourceId) {
    return {
      requestActorId: state.requestActorId,
      ownerActorId: state.ownerActorId,
      resourceId: state.resourceId,
      seed: state.seed ?? null,
    };
  }

  const { actorId } = await ensureActorContext(shared);
  const seed = await ensureBasicBookingObjects(shared);

  state.requestActorId = actorId;
  state.ownerActorId = seed.ownerActorId;
  state.resourceId = seed.resourceId;
  state.seed = seed;

  return {
    requestActorId: actorId,
    ownerActorId: seed.ownerActorId,
    resourceId: seed.resourceId,
    seed,
  };
}

function bookingErrorToSkip(error, reason, extra = null) {
  if (!isPermissionDenied(error)) {
    throw error;
  }

  return makeSkipped(reason, {
    ...extra,
    error,
  });
}

export async function runBookingFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "ensure_owner_resource"),
      name: "ensure owner booking resource via controller",
      run: async ({ shared: localShared }) => {
        let context;
        try {
          context = await ensureContext(localShared);
        } catch (error) {
          return bookingErrorToSkip(error, "Owner booking resource seed blocked by RLS/policy");
        }

        try {
          const resource = await ensureOwnerBookingResourceController({
            requestActorId: context.requestActorId,
            ownerActorId: context.ownerActorId,
            timezone: "UTC",
          });

          getState(localShared).resourceId = resource?.id ?? context.resourceId;
          return { ...context, resource };
        } catch (error) {
          return bookingErrorToSkip(error, "ensureOwnerBookingResource controller blocked by policy", {
            context,
          });
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "list_owner_resources"),
      name: "list owner booking resources via controller",
      run: async ({ shared: localShared }) => {
        let context;
        try {
          context = await ensureContext(localShared);
          const resources = await listOwnerBookingResourcesController({
            ownerActorId: context.ownerActorId,
            includeInactive: true,
          });

          return {
            ownerActorId: context.ownerActorId,
            count: Array.isArray(resources) ? resources.length : 0,
            resources: resources ?? [],
          };
        } catch (error) {
          return bookingErrorToSkip(error, "listOwnerBookingResources controller blocked by policy", {
            context,
          });
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "set_slot_duration"),
      name: "set resource slot duration via controller",
      run: async ({ shared: localShared }) => {
        let context;
        try {
          context = await ensureContext(localShared);
          const data = await setResourceSlotDurationController({
            requestActorId: context.requestActorId,
            resourceId: context.resourceId,
            durationMinutes: 30,
          });

          const serviceIds = Array.isArray(data?.serviceIds) ? data.serviceIds : [];
          getState(localShared).serviceId = serviceIds[0] ?? null;

          return {
            requestActorId: context.requestActorId,
            ownerActorId: context.ownerActorId,
            resourceId: context.resourceId,
            serviceId: getState(localShared).serviceId,
            data,
          };
        } catch (error) {
          if (String(error?.message || "").includes("No enabled services found yet")) {
            return makeSkipped("No enabled services available for setResourceSlotDuration controller", {
              context,
              error,
            });
          }
          return bookingErrorToSkip(error, "setResourceSlotDuration controller blocked by policy", {
            context,
          });
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "set_availability_rule"),
      name: "set availability rule via controller",
      run: async ({ shared: localShared }) => {
        let context;
        try {
          context = await ensureContext(localShared);
          const weekday = new Date().getUTCDay();
          const rule = await setAvailabilityRuleController({
            requestActorId: context.requestActorId,
            resourceId: context.resourceId,
            ruleType: "weekly",
            weekday,
            startTime: "09:00:00",
            endTime: "17:00:00",
            isActive: true,
          });

          getState(localShared).ruleId = rule?.id ?? null;
          return { ...context, rule };
        } catch (error) {
          return bookingErrorToSkip(error, "setAvailabilityRule controller blocked by policy", {
            context,
          });
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "set_availability_exception"),
      name: "set availability exception via controller",
      run: async ({ shared: localShared }) => {
        let context;
        try {
          context = await ensureContext(localShared);
          const starts = new Date(Date.now() + 2 * 60 * 60 * 1000);
          const ends = new Date(starts.getTime() + 45 * 60 * 1000);

          const exception = await setAvailabilityExceptionController({
            requestActorId: context.requestActorId,
            resourceId: context.resourceId,
            exceptionType: "blocked",
            startsAt: starts.toISOString(),
            endsAt: ends.toISOString(),
            note: "Diagnostics exception via controller",
          });

          getState(localShared).exceptionId = exception?.id ?? null;
          return { ...context, exception };
        } catch (error) {
          return bookingErrorToSkip(error, "setAvailabilityException controller blocked by policy", {
            context,
          });
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_booking_owner"),
      name: "create booking via controller (owner source)",
      run: async ({ shared: localShared }) => {
        let context;
        try {
          context = await ensureContext(localShared);
          const window = await buildBookingWindow({
            resourceId: context.resourceId,
            durationMinutes: 30,
            minLeadMinutes: 60,
            gapMinutes: 5,
          });

          const booking = await createBookingController({
            requestActorId: context.requestActorId,
            resourceId: context.resourceId,
            serviceId: getState(localShared).serviceId ?? null,
            customerActorId: context.requestActorId,
            source: "owner",
            status: "pending",
            startsAt: window.startsAt,
            endsAt: window.endsAt,
            timezone: "UTC",
            serviceLabelSnapshot: "Diagnostics Owner Booking",
            durationMinutes: 30,
            customerName: "Diagnostics Owner",
            customerNote: "Booking feature controller smoke test",
          });

          getState(localShared).bookingId = booking?.id ?? null;
          return { ...context, window, booking };
        } catch (error) {
          return bookingErrorToSkip(error, "createBooking controller blocked by policy", {
            context,
          });
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "get_availability"),
      name: "get resource availability via controller",
      run: async ({ shared: localShared }) => {
        let context;
        try {
          context = await ensureContext(localShared);
          const rangeStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const rangeEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          const availability = await getResourceAvailabilityController({
            resourceId: context.resourceId,
            rangeStart,
            rangeEnd,
          });

          return { ...context, rangeStart, rangeEnd, availability };
        } catch (error) {
          return bookingErrorToSkip(error, "getResourceAvailability controller blocked by policy", {
            context,
          });
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "confirm_cancel_booking"),
      name: "confirm + cancel booking via controllers",
      run: async ({ shared: localShared }) => {
        let context;
        try {
          context = await ensureContext(localShared);
          const bookingId = getState(localShared).bookingId;
          if (!bookingId) {
            return makeSkipped("Booking must be created before confirm/cancel test.");
          }

          const confirmed = await confirmBookingController({
            bookingId,
            requestActorId: context.requestActorId,
            internalNote: "Diagnostics confirm by owner",
          });

          const cancelled = await cancelBookingController({
            bookingId,
            requestActorId: context.requestActorId,
            cancelNote: "Diagnostics cancel by owner",
          });

          return { ...context, bookingId, confirmed, cancelled };
        } catch (error) {
          return bookingErrorToSkip(error, "confirm/cancel booking controllers blocked by policy", {
            context,
          });
        }
      },
    },
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}

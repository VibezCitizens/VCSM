import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicBookingObjects } from "@/dev/diagnostics/helpers/ensureSeedData";
import { isPermissionDenied, makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";

const GROUP_ID = "bookingFeature";

export const TESTS = [
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

export function getBookingFeatureState(shared) {
  if (!shared.cache.bookingFeatureState) {
    shared.cache.bookingFeatureState = {};
  }
  return shared.cache.bookingFeatureState;
}

export async function ensureBookingFeatureContext(shared) {
  const state = getBookingFeatureState(shared);
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

export function bookingErrorToSkip(error, reason, extra = null) {
  if (!isPermissionDenied(error)) {
    throw error;
  }

  return makeSkipped(reason, {
    ...extra,
    error,
  });
}

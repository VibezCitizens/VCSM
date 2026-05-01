import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicBookingObjects } from "@/dev/diagnostics/helpers/ensureSeedData";
import {
  isPermissionDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  buildBookingWindow,
  getBookingsState,
} from "@/dev/diagnostics/groups/bookings.group.helpers";
import { createServiceProfileTest } from "@/dev/diagnostics/groups/bookings.group.tests2";
export { getBookingsTests } from "@/dev/diagnostics/groups/bookings.group.helpers";

export const GROUP_ID = "bookings";
export const GROUP_LABEL = "Booking";

export async function runBookingsGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "create_resource"),
      name: "create booking resource",
      run: async ({ shared: localShared }) => {
        const state = getBookingsState(localShared);
        let seed = null;

        try {
          seed = await ensureBasicBookingObjects(localShared);
        } catch (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("booking_resources seed blocked by RLS/policy", { error });
          }
          throw error;
        }

        if (seed?.error) {
          if (isPermissionDenied(seed.error)) {
            return makeSkipped("booking_resources seed blocked by RLS/policy", { error: seed.error });
          }
          throw seed.error;
        }

        state.ownerActorId = seed.ownerActorId;
        state.resourceId = seed.resourceId;
        state.seedSource = seed.source ?? null;

        const { data, error } = await supabase
          .schema("vc")
          .from("booking_resources")
          .select("id,owner_actor_id,resource_type,name,is_active,timezone,created_at,updated_at")
          .eq("id", seed.resourceId)
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("booking_resources read blocked by RLS/policy", { error });
          }
          throw error;
        }
        return { resource: data, seed };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_rule"),
      name: "create booking availability rule",
      run: async ({ shared: localShared }) => {
        const state = getBookingsState(localShared);
        if (!state.resourceId) {
          return makeSkipped("Resource not prepared before create_rule test.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("booking_availability_rules")
          .insert({
            resource_id: state.resourceId,
            rule_type: "weekly",
            weekday: 1,
            start_time: "09:00:00",
            end_time: "17:00:00",
            is_active: true,
          })
          .select(
            "id,resource_id,rule_type,weekday,start_time,end_time,valid_from,valid_until,is_active,created_at,updated_at"
          )
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("booking_availability_rules write blocked by RLS/policy", { error });
          }
          throw error;
        }
        state.ruleId = data?.id ?? null;

        return { rule: data };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_exception"),
      name: "create booking exception",
      run: async ({ shared: localShared }) => {
        const state = getBookingsState(localShared);
        const { actorId } = await ensureActorContext(localShared);
        if (!state.resourceId) {
          return makeSkipped("Resource not prepared before create_exception test.");
        }

        const starts = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const ends = new Date(starts.getTime() + 45 * 60 * 1000);

        const { data, error } = await supabase
          .schema("vc")
          .from("booking_availability_exceptions")
          .insert({
            resource_id: state.resourceId,
            exception_type: "blocked",
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
            note: "Diagnostics block",
            created_by_actor_id: actorId,
          })
          .select(
            "id,resource_id,exception_type,starts_at,ends_at,note,created_by_actor_id,created_at,updated_at"
          )
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("booking_availability_exceptions write blocked by RLS/policy", { error });
          }
          throw error;
        }
        state.exceptionId = data?.id ?? null;

        return { exception: data };
      },
    },
    createServiceProfileTest,
    {
      id: buildTestId(GROUP_ID, "create_booking"),
      name: "create booking",
      run: async ({ shared: localShared }) => {
        const state = getBookingsState(localShared);
        const { actorId } = await ensureActorContext(localShared);
        if (!state.resourceId) {
          return makeSkipped("Resource not prepared before create_booking test.");
        }

        const window = await buildBookingWindow({
          resourceId: state.resourceId,
          durationMinutes: 30,
          minLeadMinutes: 60,
          gapMinutes: 5,
        });
        const { startsAt, endsAt } = window;

        const { data, error } = await supabase
          .schema("vc")
          .from("bookings")
          .insert({
            resource_id: state.resourceId,
            service_id: state.serviceId ?? null,
            customer_actor_id: actorId,
            customer_profile_id: null,
            status: "pending",
            source: "owner",
            starts_at: startsAt,
            ends_at: endsAt,
            timezone: "UTC",
            service_label_snapshot: "Diagnostics Service",
            duration_minutes: 30,
            customer_name: "Diagnostics Customer",
            customer_note: "Smoke test booking",
            created_by_actor_id: state.ownerActorId ?? actorId,
          })
          .select(
            "id,resource_id,service_id,customer_actor_id,status,source,starts_at,ends_at,timezone,service_label_snapshot,duration_minutes,created_by_actor_id,created_at,updated_at"
          )
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("bookings write blocked by RLS/policy", { error });
          }
          throw error;
        }
        state.bookingId = data?.id ?? null;

        return { booking: data, window };
      },
    },
    {
      id: buildTestId(GROUP_ID, "read_booking"),
      name: "verify booking readback",
      run: async ({ shared: localShared }) => {
        const state = getBookingsState(localShared);
        if (!state.bookingId) {
          return makeSkipped("Booking not created before read_booking test.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("bookings")
          .select(
            "id,resource_id,service_id,customer_actor_id,status,source,starts_at,ends_at,timezone,service_label_snapshot,duration_minutes,created_by_actor_id,created_at,updated_at"
          )
          .eq("id", state.bookingId)
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("bookings read blocked by RLS/policy", { error });
          }
          throw error;
        }

        return { bookingId: state.bookingId, booking: data };
      },
    },
    {
      id: buildTestId(GROUP_ID, "verify_owner_access"),
      name: "verify actor ownership access",
      run: async ({ shared: localShared }) => {
        const state = getBookingsState(localShared);
        if (!state.ownerActorId) {
          return makeSkipped("Owner actor missing before ownership access test.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("booking_resources")
          .select("id,owner_actor_id,resource_type,name,is_active,timezone,created_at")
          .eq("owner_actor_id", state.ownerActorId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("booking_resources owner read blocked by RLS/policy", { error });
          }
          throw error;
        }

        return {
          ownerActorId: state.ownerActorId,
          count: Array.isArray(data) ? data.length : 0,
          resources: data ?? [],
        };
      },
    },
  ];

  return runDiagnosticsTests({ group: GROUP_ID, tests, onTestUpdate, shared });
}

import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureSeedData";
import {
  isMissingColumn,
  isMissingRelation,
  isMissingRpc,
  isPermissionDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

export const GROUP_ID = "vports";
export const GROUP_LABEL = "Vports";

const TESTS = [
  { key: "create_vport_rpc", name: "call create_vport RPC if present" },
  { key: "verify_vport_row", name: "verify vport row exists" },
  { key: "verify_vport_actor", name: "verify vport actor linkage" },
  { key: "verify_vport_ownership", name: "verify actor ownership linkage" },
  { key: "vport_public_details_rw", name: "verify vport public details read/write" },
  { key: "vport_access_probes", name: "verify station/services/rates access where applicable" },
];

export function getVportsTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

function getState(shared) {
  if (!shared.cache.vportsState) {
    shared.cache.vportsState = {};
  }
  return shared.cache.vportsState;
}

async function getOrEnsureVport(shared) {
  const state = getState(shared);
  if (state.vport?.actorId && state.vport?.vportId) {
    return state.vport;
  }

  const ensured = await ensureBasicVport(shared);
  state.vport = ensured;
  return ensured;
}

export async function runVportsGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "create_vport_rpc"),
      name: "call create_vport RPC if present",
      run: async ({ shared: localShared }) => {
        const { userId } = await ensureActorContext(localShared);
        const state = getState(localShared);

        const name = `Diagnostics Vport ${Date.now()}`;
        const slugBase = `diag-${String(userId).replace(/-/g, "").slice(0, 10)}-${Date.now()}`.slice(0, 28);

        const { data, error } = await supabase
          .schema("vc")
          .rpc("create_vport", {
            p_name: name,
            p_slug: slugBase,
            p_avatar_url: null,
            p_bio: "Diagnostics create_vport smoke test",
            p_banner_url: null,
            p_vport_type: "other",
          });

        if (error) {
          if (isMissingRpc(error)) {
            const existing = await getOrEnsureVport(localShared);
            return makeSkipped("create_vport RPC missing; using existing owned vport", {
              existing,
            });
          }

          if (isPermissionDenied(error)) {
            return makeSkipped("create_vport RPC denied by policy", {
              error,
            });
          }

          throw error;
        }

        const created = {
          actorId: data?.actor_id ?? null,
          vportId: data?.vport_id ?? null,
          slug: data?.slug ?? null,
          raw: data,
        };

        if (created.actorId && created.vportId) {
          state.vport = created;
        }

        return {
          created,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "verify_vport_row"),
      name: "verify vport row exists",
      run: async ({ shared: localShared }) => {
        const vport = await getOrEnsureVport(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("vports")
          .select("id,owner_user_id,name,slug,avatar_url,bio,is_active,created_at,updated_at,vport_type")
          .eq("id", vport.vportId)
          .maybeSingle();

        if (error) throw error;

        return {
          vportId: vport.vportId,
          row: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "verify_vport_actor"),
      name: "verify vport actor linkage",
      run: async ({ shared: localShared }) => {
        const vport = await getOrEnsureVport(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("actors")
          .select("id,kind,vport_id,profile_id,is_void")
          .eq("id", vport.actorId)
          .maybeSingle();

        if (error) throw error;

        return {
          actorId: vport.actorId,
          expectedVportId: vport.vportId,
          actor: data,
          linkageOk: data?.vport_id === vport.vportId,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "verify_vport_ownership"),
      name: "verify actor ownership linkage",
      run: async ({ shared: localShared }) => {
        const { userId } = await ensureActorContext(localShared);
        const vport = await getOrEnsureVport(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("actor_owners")
          .select("actor_id,user_id,is_primary,created_at")
          .eq("actor_id", vport.actorId)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        return {
          actorId: vport.actorId,
          userId,
          ownerRow: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "vport_public_details_rw"),
      name: "verify vport public details read/write",
      run: async ({ shared: localShared }) => {
        const vport = await getOrEnsureVport(localShared);

        const patch = {
          vport_id: vport.vportId,
          website_url: "https://diagnostics.local",
          phone_public: "+1-000-000-0000",
          location_text: "Diagnostics Lane",
          hours: {
            mon: { open: "09:00", close: "17:00", closed: false },
          },
          updated_at: new Date().toISOString(),
        };

        const { data: writeRow, error: writeError } = await supabase
          .schema("vc")
          .from("vport_public_details")
          .upsert(patch, { onConflict: "vport_id" })
          .select("vport_id,website_url,phone_public,location_text,hours,updated_at")
          .maybeSingle();

        if (writeError) throw writeError;

        const { data: readRow, error: readError } = await supabase
          .schema("vc")
          .from("vport_public_details")
          .select("vport_id,website_url,phone_public,location_text,hours,updated_at")
          .eq("vport_id", vport.vportId)
          .maybeSingle();

        if (readError) throw readError;

        return {
          vportId: vport.vportId,
          writeRow,
          readRow,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "vport_access_probes"),
      name: "verify station/services/rates access where applicable",
      run: async ({ shared: localShared }) => {
        const vport = await getOrEnsureVport(localShared);

        const probes = [];

        const pushProbe = (name, payload) => {
          probes.push({ name, ...payload });
        };

        // Services read probe
        try {
          const { data, error } = await supabase
            .schema("vc")
            .from("vport_services")
            .select("id,actor_id,key,label,category,enabled,created_at,updated_at")
            .eq("actor_id", vport.actorId)
            .limit(20);

          if (error) throw error;
          pushProbe("services_read", { ok: true, count: Array.isArray(data) ? data.length : 0, data });
        } catch (error) {
          if (isMissingRelation(error) || isMissingColumn(error)) {
            pushProbe("services_read", { ok: false, skipped: true, reason: "table/columns unavailable", error });
          } else {
            throw error;
          }
        }

        // Rates write/read probe
        try {
          const { data: insertedRate, error: insertError } = await supabase
            .schema("vc")
            .from("vport_rates")
            .insert({
              actor_id: vport.actorId,
              rate_type: "fx",
              base_currency: "USD",
              quote_currency: "EUR",
              buy_rate: 1,
              sell_rate: 1,
              meta: { source: "diagnostics" },
            })
            .select(
              "id,actor_id,rate_type,base_currency,quote_currency,buy_rate,sell_rate,meta,updated_at,created_at"
            )
            .maybeSingle();

          if (insertError) throw insertError;

          const { data, error: readError } = await supabase
            .schema("vc")
            .from("vport_rates")
            .select(
              "id,actor_id,rate_type,base_currency,quote_currency,buy_rate,sell_rate,meta,updated_at,created_at"
            )
            .eq("actor_id", vport.actorId)
            .eq("rate_type", "fx")
            .limit(10);

          if (readError) throw readError;
          pushProbe("rates_write_read", {
            ok: true,
            insertedRate,
            count: Array.isArray(data) ? data.length : 0,
            data,
          });
        } catch (error) {
          if (isPermissionDenied(error)) {
            pushProbe("rates_write_read", { ok: false, skipped: true, reason: "RLS/permission denied", error });
          } else if (isMissingRelation(error) || isMissingColumn(error)) {
            pushProbe("rates_write_read", { ok: false, skipped: true, reason: "table/columns unavailable", error });
          } else {
            throw error;
          }
        }

        // Station settings read probe
        try {
          const { data, error } = await supabase
            .schema("vc")
            .from("vport_station_price_settings")
            .select(
              "target_actor_id,show_community_suggestion,require_sanity_for_suggestion,min_price,max_price,max_delta_abs,max_delta_pct,updated_at"
            )
            .eq("target_actor_id", vport.actorId)
            .maybeSingle();

          if (error) throw error;
          pushProbe("station_settings_read", { ok: true, data: data ?? null });
        } catch (error) {
          if (isMissingRelation(error) || isMissingColumn(error)) {
            pushProbe("station_settings_read", { ok: false, skipped: true, reason: "table/columns unavailable", error });
          } else {
            throw error;
          }
        }

        const successful = probes.filter((probe) => probe.ok).length;
        if (!successful) {
          return makeSkipped("No vport access probes were executable in this environment", {
            probes,
          });
        }

        return {
          actorId: vport.actorId,
          vportId: vport.vportId,
          probes,
        };
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

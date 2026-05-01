import vportSchema from "@/services/supabase/vportClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureSeedData";

const GROUP_ID = "vports";

export const TESTS = [
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

export function getVportsState(shared) {
  if (!shared.cache.vportsState) {
    shared.cache.vportsState = {};
  }
  return shared.cache.vportsState;
}

export async function getOrEnsureVport(shared) {
  const state = getVportsState(shared);
  if (state.vport?.actorId && state.vport?.vportId) {
    return state.vport;
  }

  const ensured = await ensureBasicVport(shared);
  state.vport = ensured;
  return ensured;
}

export const verifyVportRowTest = {
  id: buildTestId(GROUP_ID, "verify_vport_row"),
  name: "verify vport row exists",
  run: async ({ shared: localShared }) => {
    const vport = await getOrEnsureVport(localShared);

    const { data, error } = await vportSchema
      .from("profiles")
      .select("id,owner_user_id,name,slug,avatar_url,bio,is_active,created_at,updated_at")
      .eq("id", vport.vportId)
      .maybeSingle();

    if (error) throw error;

    return {
      vportId: vport.vportId,
      row: data,
    };
  },
};

import { supabase } from "@/services/supabase/supabaseClient";
import { createSeedMissingError } from "@/dev/diagnostics/helpers/supabaseAssert";

const REQUIRED_REALM_NAME = "public";

export async function ensureRealm(shared) {
  if (shared?.cache?.realmContext) {
    return shared.cache.realmContext;
  }
  if (shared?.cache?.realmContextError) {
    throw shared.cache.realmContextError;
  }

  const { data: realm, error: readError } = await supabase
    .schema("vc")
    .from("realms")
    .select("id,name,is_void,created_at")
    .eq("name", REQUIRED_REALM_NAME)
    .maybeSingle();

  if (readError) throw readError;

  if (!realm?.id) {
    const error = createSeedMissingError(
      "Required vc.realms seed row 'public' is missing or not readable to this client context. Diagnostics will not create realms.",
      {
        schema: "vc",
        table: "realms",
        requiredName: REQUIRED_REALM_NAME,
      }
    );
    if (shared?.cache) {
      shared.cache.realmContextError = error;
    }
    throw error;
  }

  const realmContext = {
    realm,
    realmId: realm.id,
    created: false,
    source: "seeded",
  };

  if (shared?.cache) {
    shared.cache.realmContext = realmContext;
  }

  return realmContext;
}

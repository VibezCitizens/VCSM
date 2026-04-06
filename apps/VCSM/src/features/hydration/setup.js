import { configureHydrationEngine } from "@hydration";
import { hydrateVcsmActor } from "./vcsmActorHydrator";
import { supabase } from "@/services/supabase/supabaseClient";

let _configured = false;

export function setupVcsmHydration() {
  if (_configured) return;
  _configured = true;

  configureHydrationEngine({
    supabaseClient: supabase,
    hydrators: {
      vcsm: {
        vc: hydrateVcsmActor,
      },
    },
  });
}

export default setupVcsmHydration;

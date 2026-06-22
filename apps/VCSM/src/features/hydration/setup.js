import { configureHydrationEngine } from "@hydration";
import { hydrateVcsmActor } from "./vcsmActorHydrator";
import { supabase } from "@/services/supabase/supabaseClient";

// STUB: Engine setup — configures the hydration engine once at app startup; injects supabase client + vcsm actor hydrator
// STATUS: engine setup — single consumer: main.jsx; has idempotency guard (_configured)
// PLANNED FATE: move to app/setup/hydration.setup.js (ARCH-ENGINESETUP-001); vcsmActorHydrator.js evaluated separately (merge into identity/ or delete)

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

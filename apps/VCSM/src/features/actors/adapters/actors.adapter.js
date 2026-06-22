import { searchActors } from "@/features/actors/controllers/searchActors.controller";

// STUB: Adapter surface for actor search — wraps searchActors.controller inside features/actors/
// STATUS: active adapter — 2 consumers: settings/privacy/controller/Blocks.controller (block user lookup) + dashboard/vport/team/controller/vportTeamAccess.controller (team member search)
// PLANNED FATE: stay here; evaluate merge into identity/ if actors/ feature consolidates into the identity domain (see ARCH-ENGINESETUP-001)

export function searchActorsAdapter(params) {
  return searchActors(params);
}

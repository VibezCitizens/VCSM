// src/adapters/index.js
// ============================================================
// Identity Engine — Public API
// ------------------------------------------------------------
// Apps must import ONLY from engines/identity/index.js.
// This file defines what is public. DAL, models, and internal
// controllers are NOT re-exported from here.
// ============================================================

// Configuration
export { configureIdentityEngine } from '../config.js'

// Primary use-cases
export { resolveAuthenticatedContext }  from '../controller/resolveAuthenticatedContext.controller.js'
export { switchActiveActor }            from '../controller/switchActiveActor.controller.js'
export { logoutCleanup }                from '../controller/logoutCleanup.controller.js'

// Granular resolution (for partial use-cases)
export { resolveSessionUser }          from '../services/sessionService.js'
export { resolveUserAppAccess }        from '../services/accessService.js'
export { resolveUserAppAccount }       from '../services/accountService.js'
export { resolveAvailableActors, resolveActiveActor } from '../services/actorService.js'
export { resolveRoleKeys }             from '../services/roleService.js'
export { resolveCapabilityKeys }       from '../services/capabilityService.js'
export { resolveDefaultDestination }   from '../services/destinationService.js'

// Platform state finalization (for self-heal/bootstrap)
export { dalFinalizeAccountState as finalizeAccountState } from '../dal/state.write.dal.js'

// Auth state subscription
export { dalOnAuthStateChange as onAuthStateChange } from '../dal/session.read.dal.js'

// App-specific resolvers: injected via config by each app.
// Wentrex resolver: apps/wentrex/features/identity/resolvers/
// VCSM resolver: apps/VCSM/features/identity/resolvers/

// Events
export { EVENTS, on as onIdentityEvent } from '../events.js'

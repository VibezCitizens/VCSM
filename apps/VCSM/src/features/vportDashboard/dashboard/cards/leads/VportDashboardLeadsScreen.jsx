/**
 * Route compatibility wrapper.
 *
 * app.routes.jsx and lazyApp.jsx import VportDashboardLeadsScreen by name.
 * This file preserves that import surface while delegating all logic to the
 * properly layered Final Screen.
 *
 * Do not add logic here — this file is intentionally a pass-through.
 */
export { default } from "./VportDashboardLeadsFinalScreen";

import { portfolioTraceStore } from "@/features/portfolio/setup";

// STUB: Dev-only trace adapter — exposes the portfolioTraceStore subscription API from portfolio/setup.js
// STATUS: active adapter (dev/debug only) — 2 consumers: dashboard/portfolio/hooks/useVportPortfolioProbe.js + portfolio.spiderman.test.js; trace store only populates in DEV mode (debugReporter is null in prod)
// PLANNED FATE: import path updates required when portfolio/setup.js moves to app/setup/ (ARCH-ENGINESETUP-001); adapter itself stays as long as dashboard/portfolio probe exists

export function subscribeToPortfolioTrace(listener) {
  return portfolioTraceStore.subscribe(listener);
}

export function getPortfolioTraceEvents() {
  return portfolioTraceStore.events;
}

export function clearPortfolioTraceEvents() {
  portfolioTraceStore.clear();
}

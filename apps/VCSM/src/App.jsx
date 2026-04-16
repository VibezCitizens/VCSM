import AppRoutes from "@/app/routes";
import { IdentityDebugPanel } from "@debuggers/identity";
import { ActorSwitchDebugPanel } from "@debuggers/actor-switch";
import { GlobalDebugPanel } from "@debuggers/global";
import { PerfOverlay } from "@debuggers/performance";
import { FeedProfilerOverlay } from "@debuggers/feed";

// DEV-ONLY: Initialize fetch proxy and client metrics (Supabase proxy is installed in supabaseClient.js)
if (import.meta.env.DEV) {
  import("@debuggers/performance").then(({ installFetchProxy, installClientMetrics }) => {
    installFetchProxy();
    installClientMetrics();
  });
}

export default function App() {
  return (
    <div className="citizens-theme profiles-modern h-full min-h-0 flex flex-col">
      <AppRoutes />
      {import.meta.env.DEV && <GlobalDebugPanel />}
      {import.meta.env.DEV && <IdentityDebugPanel />}
      {import.meta.env.DEV && <ActorSwitchDebugPanel />}
      {import.meta.env.DEV && <PerfOverlay />}
      {import.meta.env.DEV && <FeedProfilerOverlay />}
    </div>
  );
}

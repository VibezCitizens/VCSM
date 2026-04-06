import AppRoutes from "@/app/routes";
import { IdentityDebugPanel } from "@debuggers/identity";
import { ActorSwitchDebugPanel } from "@debuggers/actor-switch";
import { GlobalDebugPanel } from "@debuggers/global";

export default function App() {
  return (
    <div className="citizens-theme profiles-modern h-full min-h-0 flex flex-col">
      <AppRoutes />
      {import.meta.env.DEV && <GlobalDebugPanel />}
      {import.meta.env.DEV && <IdentityDebugPanel />}
      {import.meta.env.DEV && <ActorSwitchDebugPanel />}
    </div>
  );
}

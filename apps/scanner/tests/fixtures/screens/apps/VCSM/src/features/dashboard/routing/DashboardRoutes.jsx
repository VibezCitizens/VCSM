import { VportDashboardLeadsScreen } from "../screens/VportDashboardLeadsScreen.jsx";
import { VportDashboardSimpleScreen } from "../screens/VportDashboardSimpleScreen.jsx";

export function DashboardRoutes() {
  return (
    <>
      <Route path="/dashboard/leads" element={<VportDashboardLeadsScreen />} />
      <Route path="/dashboard/simple" element={<ProtectedRoute><VportDashboardSimpleScreen /></ProtectedRoute>} />
    </>
  );
}

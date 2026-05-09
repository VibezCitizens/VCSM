import { Navigate, useRoutes } from "react-router-dom";
import LoginScreen from "@/auth/screens/LoginScreen";
import ResetPasswordScreen from "@/auth/screens/ResetPasswordScreen";
import UpdatePasswordScreen from "@/auth/screens/UpdatePasswordScreen";
import TripointDashboardGate from "@/features/dashboard/screens/TripointDashboardGate";

const APP_ROUTES = [
  { path: "/", element: <TripointDashboardGate /> },
  { path: "/dashboard/*", element: <TripointDashboardGate /> },
  { path: "/login", element: <LoginScreen /> },
  { path: "/forgot-password", element: <ResetPasswordScreen /> },
  { path: "/reset-password", element: <UpdatePasswordScreen /> },
  { path: "/reset", element: <UpdatePasswordScreen /> },

  { path: "*", element: <Navigate to="/" replace /> },
];

export default function App() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {useRoutes(APP_ROUTES)}
    </div>
  );
}

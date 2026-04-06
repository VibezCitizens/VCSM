import { useEffect, useState } from "react";
import { Navigate, useLocation, useRoutes } from "react-router-dom";

function UnauthorizedScreen() {
  const location = useLocation();
  const reason = location.state?.reason;

  let message;
  if (reason === "no_learning_actor") {
    message = "Your account is not linked to the learning platform. Contact your school administrator to be enrolled.";
  } else if (reason === "access_revoked") {
    message = "Your access to this platform has been revoked. Contact your school administrator.";
  } else if (reason === "access_not_granted") {
    message = "Your account doesn't have platform access yet. Contact your school administrator.";
  } else {
    message = "Your account is not linked to any role yet. Contact your school administrator.";
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ textAlign: "center", padding: 32, maxWidth: 440 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ margin: "0 0 8px", color: "#0f172a" }}>No Access</h2>
        <p style={{ color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>{message}</p>
        <a href="/" style={{ color: "#0f4a72", fontWeight: 600 }}>Back to home</a>
      </div>
    </div>
  );
}
import LandingPage from "@/learning/screens/LandingPage";
import LoginScreen from "@/auth/screens/LoginScreen";
import ResetPasswordScreen from "@/auth/screens/ResetPasswordScreen";
import UpdatePasswordScreen from "@/auth/screens/UpdatePasswordScreen";
import DashboardScreen from "@/learning/administration/screens/DashboardScreen";
import SetupGuideScreen from "@/learning/administration/screens/SetupGuideScreen";
import RegisterStudentScreen from "@/learning/administration/screens/RegisterStudentScreen";
import { InboxScreen as CommunicationInboxScreen, ConversationScreen } from "@/features/communication";
import LinkParentScreen from "@/learning/administration/screens/LinkParentScreen";
import ParentsScreen from "@/learning/administration/screens/ParentsScreen";
import CoursesScreen from "@/learning/administration/screens/CoursesScreen";
import StaffScreen from "@/learning/administration/screens/StaffScreen";
import StudentsScreen from "@/learning/administration/screens/StudentsScreen";
import StudentDetailScreen from "@/learning/administration/screens/StudentDetailScreen";
import CourseDetailScreen from "@/learning/administration/screens/CourseDetailScreen";
import TeacherDashboardScreen from "@/learning/staff/screens/TeacherDashboardScreen";
import TeacherCourseScreen from "@/learning/staff/screens/TeacherCourseScreen";
import CreateAssignmentScreen from "@/learning/staff/screens/CreateAssignmentScreen";
import ParentDashboardScreen from "@/learning/parent/screens/ParentDashboardScreen";
import ParentStudentScreen from "@/learning/parent/screens/ParentStudentScreen";
import ParentSettingsScreen from "@/learning/parent/screens/ParentSettingsScreen";
import ParentClassScreen from "@/learning/parent/screens/ParentClassScreen";
import StudentLoginScreen from "@/learning/screens/StudentLoginScreen";
import ChangePasswordScreen from "@/learning/screens/ChangePasswordScreen";
import StudentDashboardScreen from "@/learning/student/screens/StudentDashboardScreen";
import StudentCourseScreen from "@/learning/student/screens/StudentCourseScreen";
import StudentAssignmentScreen from "@/learning/student/screens/StudentAssignmentScreen";
import { supabase } from "@/services/supabase/supabaseClient";
import RequireRole from "@/learning/components/RequireRole";
import { WentrexIdentityProvider } from "@/features/identity/WentrexIdentityContext";

function RequireAuth({ children }) {
  const location = useLocation();
  const [state, setState] = useState({ checked: false, session: null });

  // Re-check session on every route change (covers browser forward/back)
  useEffect(() => {
    let cancelled = false;
    setState(prev => ({ ...prev, checked: false }));

    supabase.auth.getSession().then(({ data }) => {
      // [BUGSBUNNY require-auth] Session check on route change
      if (import.meta.env.DEV) {
        console.log('[BUGSBUNNY require-auth] getSession on route:', location.pathname, '→ session:', !!data?.session);
      }
      if (!cancelled) setState({ checked: true, session: data?.session ?? null });
    });

    return () => { cancelled = true; };
  }, [location.pathname]);

  // Listen for auth state changes (sign out, token refresh, etc.)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // [BUGSBUNNY require-auth] Auth state change
      if (import.meta.env.DEV) {
        console.log('[BUGSBUNNY require-auth] onAuthStateChange:', event, '→ session:', !!session, '→ path:', location.pathname);
      }
      setState({ checked: true, session });
    });

    return () => { listener?.subscription?.unsubscribe?.(); };
  }, []);

  if (!state.checked) return null;

  if (!state.session) {
    // [BUGSBUNNY require-auth] Redirect trigger
    if (import.meta.env.DEV) {
      console.warn('[BUGSBUNNY require-auth] NO SESSION — redirecting to /login from:', location.pathname);
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

// ============================================================
// APP ROUTES
// ------------------------------------------------------------
// Canonical target: /learning/:realmSlug/* (multi-tenant, realm-scoped)
// Legacy routes below are marked [LEGACY] and will be replaced
// by their /learning/:realmSlug/* equivalents once feature parity
// is reached. Do not invest in legacy routes — fix-only if blocking.
// ============================================================

const APP_ROUTES = [
  // --- Public routes ---
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/student-login",
    element: <StudentLoginScreen />,
  },
  {
    path: "/change-password",
    element: <ChangePasswordScreen />,
  },
  {
    path: "/forgot-password",
    element: <ResetPasswordScreen />,
  },
  {
    path: "/reset-password",
    element: <UpdatePasswordScreen />,
  },
  {
    path: "/reset",
    element: <UpdatePasswordScreen />,
  },

  // --- [LEGACY] Admin routes — no realm scoping, direct Supabase screens ---
  // Canonical target: /learning/:realmSlug/admin/*
  {
    path: "/dashboard",
    element: <RequireAuth><RequireRole allow="admin"><DashboardScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/setup-guide",
    element: <RequireAuth><RequireRole allow="admin"><SetupGuideScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/register-student",
    element: <RequireAuth><RequireRole allow="admin"><RegisterStudentScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/courses",
    element: <RequireAuth><RequireRole allow="admin"><CoursesScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/courses/:courseId",
    element: <RequireAuth><RequireRole allow="admin"><CourseDetailScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/staff",
    element: <RequireAuth><RequireRole allow="admin"><StaffScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/students",
    element: <RequireAuth><RequireRole allow="admin"><StudentsScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/students/:actorId",
    element: <RequireAuth><RequireRole allow="admin"><StudentDetailScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/parents",
    element: <RequireAuth><RequireRole allow="admin"><ParentsScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/link-parent",
    element: <RequireAuth><RequireRole allow="admin"><LinkParentScreen /></RequireRole></RequireAuth>,
  },

  // --- Communication (shared, not legacy) ---
  {
    path: "/inbox",
    element: <RequireAuth><CommunicationInboxScreen /></RequireAuth>,
  },
  {
    path: "/messages",
    element: <RequireAuth><CommunicationInboxScreen /></RequireAuth>,
  },
  {
    path: "/messages/:conversationId",
    element: <RequireAuth><ConversationScreen /></RequireAuth>,
  },

  // --- [LEGACY] Teacher routes — no realm scoping, direct Supabase screens ---
  // Canonical target: /learning/:realmSlug/teacher/*
  {
    path: "/teacher",
    element: <RequireAuth><RequireRole allow="teacher"><TeacherDashboardScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/teacher/course/:courseId",
    element: <RequireAuth><RequireRole allow="teacher"><TeacherCourseScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/teacher/course/:courseId/create-assignment",
    element: <RequireAuth><RequireRole allow="teacher"><CreateAssignmentScreen /></RequireRole></RequireAuth>,
  },

  // --- [LEGACY] Parent routes — no realm scoping, direct Supabase screens ---
  // Canonical target: /learning/:realmSlug/parent/*
  {
    path: "/parent",
    element: <RequireAuth><RequireRole allow="parent"><ParentDashboardScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/parent/student/:studentActorId",
    element: <RequireAuth><RequireRole allow="parent"><ParentStudentScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/parent/student/:studentActorId/course/:courseId",
    element: <RequireAuth><RequireRole allow="parent"><ParentClassScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/parent/settings",
    element: <RequireAuth><RequireRole allow="parent"><ParentSettingsScreen /></RequireRole></RequireAuth>,
  },

  // --- [LEGACY] Student routes — no realm scoping, has .select('*') violations ---
  // Canonical target: /learning/:realmSlug/student/*
  {
    path: "/student",
    element: <RequireAuth><RequireRole allow="student"><StudentDashboardScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/student/course/:courseId",
    element: <RequireAuth><RequireRole allow="student"><StudentCourseScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/student/course/:courseId/assignment/:assignmentId",
    element: <RequireAuth><RequireRole allow="student"><StudentAssignmentScreen /></RequireRole></RequireAuth>,
  },
  {
    path: "/suspended",
    element: (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", padding: 32, maxWidth: 440 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ margin: "0 0 8px", color: "#0f172a" }}>Access Suspended</h2>
          <p style={{ color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
            Your access to the learning platform has been suspended. Please contact your school administrator to restore access.
          </p>
          <a href="/" style={{ color: "#0f4a72", fontWeight: 600 }}>Back to home</a>
        </div>
      </div>
    ),
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedScreen />,
  },
  {
    path: "*",
    element: <LandingPage />,
  },
];

export default function App() {
  const routes = useRoutes(APP_ROUTES);
  return (
    <WentrexIdentityProvider>
      <div style={{ minHeight: "100vh" }}>{routes}</div>
    </WentrexIdentityProvider>
  );
}

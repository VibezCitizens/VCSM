export function authPublicRoutes({
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
  OnboardingScreen,
}) {
  return [
    { path: "/login", element: <LoginScreen /> },
    { path: "/register", element: <RegisterScreen /> },
    { path: "/reset", element: <ResetPasswordScreen /> },
    { path: "/onboarding", element: <OnboardingScreen /> },
  ];
}
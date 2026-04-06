import AuthPublicRoute from '@/app/routes/public/AuthPublicRoute'

export function authPublicRoutes({
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
  OnboardingScreen,
}) {
  return [
    {
      path: '/login',
      element: (
        <AuthPublicRoute>
          <LoginScreen />
        </AuthPublicRoute>
      ),
    },
    {
      path: '/register',
      element: (
        <AuthPublicRoute>
          <RegisterScreen />
        </AuthPublicRoute>
      ),
    },
    {
      path: '/reset',
      element: (
        <AuthPublicRoute>
          <ResetPasswordScreen />
        </AuthPublicRoute>
      ),
    },
    {
      path: '/onboarding',
      element: (
        <AuthPublicRoute>
          <OnboardingScreen />
        </AuthPublicRoute>
      ),
    },
  ]
}

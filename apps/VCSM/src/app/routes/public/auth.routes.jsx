import AuthPublicRoute from '@/app/routes/public/AuthPublicRoute'

export function authPublicRoutes({
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  AuthCallbackScreen,
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
    // /reset kept as alias for backward compat (linked from login screen)
    {
      path: '/reset',
      element: (
        <AuthPublicRoute>
          <ForgotPasswordScreen />
        </AuthPublicRoute>
      ),
    },
    {
      path: '/forgot-password',
      element: (
        <AuthPublicRoute>
          <ForgotPasswordScreen />
        </AuthPublicRoute>
      ),
    },
    {
      path: '/reset-password',
      element: (
        <AuthPublicRoute>
          <ResetPasswordScreen />
        </AuthPublicRoute>
      ),
    },
    {
      path: '/auth/callback',
      element: (
        <AuthPublicRoute>
          <AuthCallbackScreen />
        </AuthPublicRoute>
      ),
    },
  ]
}

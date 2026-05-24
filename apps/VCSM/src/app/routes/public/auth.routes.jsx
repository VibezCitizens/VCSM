import AuthPublicRoute from '@/app/routes/public/AuthPublicRoute'

export function authPublicRoutes({
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  AuthCallbackScreen,
  VerifyEmailRequiredScreen,
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
      // VENOM-AUTH-002: /reset-password is NOT wrapped in AuthPublicRoute.
      //
      // AuthPublicRoute redirects user !== null to /feed. A Supabase PASSWORD_RECOVERY
      // session sets user, so wrapping this route would redirect legitimate recovery
      // users away from the form — breaking the PKCE recovery flow entirely.
      //
      // Access control is enforced by setNewPassword.controller.js:
      //   - A valid recovery nonce (UUID + issuedAt, written only by AuthProvider on
      //     PASSWORD_RECOVERY) must be present in sessionStorage with a 30-minute TTL.
      //   - Without the nonce, resolveRecoverySessionController() returns
      //     { ok: false, error: null }, the form never reaches 'ready' status,
      //     and submission is blocked.
      //   - Normal logged-in users who navigate here directly see a spinner, then the
      //     15-second timeout fires and renders the invalid-link error card.
      //
      // This is intentional: the recovery gate is the controller, not the route guard.
      path: '/reset-password',
      element: <ResetPasswordScreen />,
    },
    {
      path: '/auth/callback',
      element: (
        <AuthPublicRoute>
          <AuthCallbackScreen />
        </AuthPublicRoute>
      ),
    },
    {
      path: '/verify-email',
      element: (
        <AuthPublicRoute>
          <VerifyEmailRequiredScreen />
        </AuthPublicRoute>
      ),
    },
  ]
}

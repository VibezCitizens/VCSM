import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import LoginFormPanel from '@/auth/components/LoginFormPanel'
import LoginHeroPanel from '@/auth/components/LoginHeroPanel'
import { useViewportWidth } from '@/auth/hooks/useViewportWidth'
import { useWentrexIdentity } from '@/features/identity/WentrexIdentityContext'

function LoginScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const viewportWidth = useViewportWidth()
  const { loading: contextLoading, context, error: contextError } = useWentrexIdentity()
  const [awaitingLogin, setAwaitingLogin] = useState(false)
  const [resolveError, setResolveError] = useState('')

  const isStackedLayout = viewportWidth < 1180
  const isCompactLayout = viewportWidth < 860
  const featureColumnCount = viewportWidth < 760 ? 1 : 2

  const navState = useMemo(() => {
    const state = location?.state || {}
    return {
      accessDenied: state.accessDenied === true,
      accessCheckFailed: state.accessCheckFailed === true,
    }
  }, [location])

  // Called by useLogin after credentials are accepted and the Supabase session is live.
  // WentrexIdentityContext handles provisioning on SIGNED_IN — set flag and wait for context.
  const handleLogin = useCallback(() => {
    setAwaitingLogin(true)
    setResolveError('')
  }, [])

  // Navigate once context resolves after login
  useEffect(() => {
    if (!awaitingLogin || contextLoading) return

    if (context) {
      setAwaitingLogin(false)
      if (context.isSuspended) {
        navigate('/suspended', { replace: true })
      } else {
        navigate(context.defaultDestination ?? '/unauthorized', { replace: true })
      }
    } else if (contextError) {
      setAwaitingLogin(false)
      if (contextError?.code === 'NO_SESSION') {
        navigate('/login', { replace: true })
      } else if (contextError?.code === 'NO_LEARNING_ACTOR') {
        navigate('/unauthorized', { replace: true, state: { reason: 'no_learning_actor' } })
      } else if (contextError?.code === 'ACCESS_DENIED') {
        const reason = contextError.accessStatus === 'none' ? 'access_not_granted' : 'access_revoked'
        navigate('/unauthorized', { replace: true, state: { reason } })
      } else {
        setResolveError('Unable to load your account. Please try again.')
      }
    }
  }, [awaitingLogin, contextLoading, context, contextError, navigate])

  const resolving = awaitingLogin && contextLoading

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: isCompactLayout ? '16px 14px 24px' : '24px 22px 30px',
        background:
          'radial-gradient(circle at top left, rgba(139, 198, 255, 0.4), transparent 28%), radial-gradient(circle at bottom right, rgba(251, 191, 36, 0.18), transparent 30%), linear-gradient(180deg, #f6fbff 0%, #edf5fb 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 1460,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isStackedLayout
            ? 'minmax(0, 1fr)'
            : 'minmax(0, 1.08fr) minmax(360px, 420px)',
          gap: isStackedLayout ? 18 : 34,
          alignItems: 'start',
        }}
      >
        <LoginHeroPanel
          isCompactLayout={isCompactLayout}
          isStackedLayout={isStackedLayout}
          featureColumnCount={featureColumnCount}
        />
        <LoginFormPanel
          isCompactLayout={isCompactLayout}
          isStackedLayout={isStackedLayout}
          navState={navState}
          onLogin={handleLogin}
          resolving={resolving}
          resolveError={resolveError}
        />
      </div>
    </div>
  )
}

export default LoginScreen

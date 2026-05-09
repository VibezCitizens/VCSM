import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import LoginFormPanel from '@/auth/components/LoginFormPanel'

function LoginScreen() {
  const location = useLocation()
  const navigate = useNavigate()

  const navState = useMemo(() => {
    const state = location?.state || {}
    return {
      accessDenied: state.accessDenied === true,
      accessCheckFailed: state.accessCheckFailed === true,
    }
  }, [location])

  const handleLogin = useCallback(async ({ from }) => {
    const destination = !from || from === '/' || from === '/login'
      ? '/dashboard'
      : from

    navigate(destination, { replace: true })
  }, [navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at 16% 18%, rgba(75, 172, 198, 0.42), transparent 30%), radial-gradient(circle at 82% 22%, rgba(231, 178, 90, 0.36), transparent 28%), radial-gradient(circle at 50% 92%, rgba(31, 122, 89, 0.42), transparent 34%), linear-gradient(135deg, #071922 0%, #123241 46%, #10251f 100%)',
      }}
    >
      <div
        style={{
          width: 'min(100%, 440px)',
          display: 'grid',
        }}
      >
        <LoginFormPanel
          isCompactLayout={false}
          isStackedLayout
          navState={navState}
          onLogin={handleLogin}
        />
      </div>
    </div>
  )
}

export default LoginScreen

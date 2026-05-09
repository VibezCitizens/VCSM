import { useLogin } from '@/auth/hooks/useLogin'

function fieldStyle() {
  return {
    width: '100%',
    borderRadius: 14,
    border: '1px solid #d2deea',
    background: 'rgba(245, 250, 255, 0.96)',
    padding: '14px 16px',
    fontSize: 15,
    color: '#08111b',
    boxSizing: 'border-box',
  }
}

const srOnlyStyle = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

function LoginFormPanel({ isCompactLayout, isStackedLayout, navState, onLogin, resolving, resolveError }) {
  const { email, setEmail, password, setPassword, loading, error, handleLogin } =
    useLogin(onLogin)

  const isWorking = loading || resolving
  const canSubmit = !isWorking && email.trim() && password.trim()

  return (
    <aside
      id="login-panel"
      style={{
        borderRadius: 8,
        padding: isCompactLayout ? '22px 18px' : '30px 28px',
        background: 'linear-gradient(145deg, rgba(7, 25, 34, 0.92), rgba(18, 50, 65, 0.9) 48%, rgba(46, 63, 48, 0.88))',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 28px 80px rgba(0, 0, 0, 0.34)',
        color: '#ffffff',
        position: isStackedLayout ? 'relative' : 'sticky',
        top: isStackedLayout ? 'auto' : 24,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignSelf: 'start',
      }}
    >
      {/* Decorative glows */}
      <div
        style={{
          position: 'absolute',
          top: -48,
          right: -42,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(251, 191, 36, 0.14)',
          filter: 'blur(24px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -28,
          bottom: -48,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.14)',
          filter: 'blur(28px)',
        }}
      />

      <div style={{ position: 'relative' }}>
        {navState.accessDenied || navState.accessCheckFailed ? (
          <div
            style={{
              marginBottom: 18,
              borderRadius: 16,
              padding: '13px 14px',
              border: navState.accessCheckFailed
                ? '1px solid rgba(251, 191, 36, 0.3)'
                : '1px solid rgba(248, 113, 113, 0.3)',
              background: navState.accessCheckFailed
                ? 'rgba(251, 191, 36, 0.12)'
                : 'rgba(220, 38, 38, 0.14)',
              color: navState.accessCheckFailed ? '#fde68a' : '#fecaca',
              fontSize: 13.5,
              lineHeight: 1.55,
            }}
          >
              {navState.accessCheckFailed
              ? 'Dashboard access could not be verified right now. Try again in a moment.'
              : 'This account is not allowlisted for this dashboard. Sign in with the approved account.'}
          </div>
        ) : null}

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label
              htmlFor="login-email"
              style={srOnlyStyle}
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={fieldStyle()}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              style={srOnlyStyle}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={fieldStyle()}
            />
          </div>

          {(error || resolveError) ? (
            <div
              style={{
                borderRadius: 14,
                background: 'rgba(220, 38, 38, 0.14)',
                border: '1px solid rgba(248, 113, 113, 0.28)',
                padding: '12px 14px',
                color: '#fecaca',
                fontSize: 14,
              }}
            >
              {error || resolveError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              marginTop: 4,
              border: 'none',
              borderRadius: 16,
              background: canSubmit
                ? 'linear-gradient(135deg, #0f4a72, #13608f)'
                : 'rgba(255,255,255,0.16)',
              color: '#fff',
              padding: '14px 16px',
              fontSize: 15,
              fontWeight: 700,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 18px 30px rgba(15, 74, 114, 0.32)' : 'none',
            }}
          >
            {loading ? 'Signing in...' : resolving ? 'Loading your dashboard...' : 'Sign in'}
          </button>
        </form>

      </div>
    </aside>
  )
}

export default LoginFormPanel

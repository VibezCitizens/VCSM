// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Scope: Global migration pass
// @Note: Do NOT remove, rename, or modify this block.

import { useNavigate, Link, useLocation } from 'react-router-dom'
import { getActiveSeasonTheme } from '@/Season'
import { useLogin } from '@/features/auth/hooks/useLogin'

function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const season = getActiveSeasonTheme('topRight')

  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleLogin,
  } = useLogin(navigate, location)

  const canSubmit = !loading && email.trim() && password.trim()

  return (
    <div className={`${season.wrapper} min-h-screen flex items-center justify-center`}>
      {season.fog1 && <div className={season.fog1} />}
      {season.fog2 && <div className={season.fog2} />}

      <div className="w-full max-w-md mx-auto">
        <div className="relative">
          {season.hatPosition && season.hatClassMap && (
            <img
              src="/season/xmas/XmasHat.png"
              alt="Xmas Hat"
              className={`w-72 pointer-events-none z-50 ${season.hatClassMap[season.hatPosition]}`}
            />
          )}

          <form
            onSubmit={handleLogin}
            className="relative w-full space-y-5 bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl"
          >
            <h1 className="text-5xl font-['GFS Didot'] text-center">
              Vibez Citizens
            </h1>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 bg-black/30 text-white rounded-lg"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 bg-black/30 text-white rounded-lg"
            />

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="text-center text-sm">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>

            <p className="text-sm text-center">
              Don’t have an account? <Link to="/register">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen

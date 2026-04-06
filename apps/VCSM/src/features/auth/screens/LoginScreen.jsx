// src/features/auth/screens/LoginScreen.jsx
// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Scope: Global migration pass
// @Note: Do NOT remove, rename, or modify this block.

import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { ChevronRight, Smartphone, Sparkles } from 'lucide-react'
import { getActiveSeasonTheme } from '@/season'
import { useLogin } from '@/features/auth/hooks/useLogin'

// iOS install modal
import IosInstallPrompt from '@/app/platform/ios/components/IosInstallPrompt'

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

  const navState = useMemo(() => {
    const s = location?.state || {}
    return {
      from: typeof s.from === 'string' ? s.from : null,
      card: typeof s.card === 'string' ? s.card : null,
      // ✅ Option A: no wandersClientKey
    }
  }, [location])

  // ------------------------------------------------------------
  // iOS install visibility logic
  // ------------------------------------------------------------
  const [canShowInstall, setCanShowInstall] = useState(false)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    try {
      const ua = (navigator.userAgent || '').toLowerCase()

      const isIOS = /iphone|ipad|ipod/.test(ua)
      const isSafari =
        isIOS &&
        ua.includes('safari') &&
        !ua.includes('crios') &&
        !ua.includes('fxios')

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        navigator.standalone === true

      if (isIOS && isSafari && !isStandalone) {
        setCanShowInstall(true)
      }
    } catch {
      // fail closed
    }
  }, [])

  const onSubmit = async (e) => {
    await handleLogin(e)
  }

  return (
    <>
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
              onSubmit={onSubmit}
              className="
                relative w-full space-y-5 overflow-hidden
                bg-white/5 backdrop-blur-xl
                border border-white/10
                p-6 sm:p-8 rounded-2xl
              "
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/12 blur-3xl" />
              <div className="pointer-events-none absolute -left-12 -bottom-14 h-36 w-36 rounded-full bg-rose-300/10 blur-3xl" />

              <div className="relative text-center">
                <h1 className="font-serif text-[clamp(2.45rem,9.6vw,3.35rem)] font-semibold leading-[0.96] tracking-[0.005em] whitespace-nowrap text-transparent bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 bg-clip-text">
                  Vibez Citizens
                </h1>
                <p className="mt-2 text-sm tracking-[0.08em] text-amber-100/80">
                  Where your vibez belongs.
                </p>
              </div>

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
                <p className="text-red-400 text-sm text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="
                  relative w-full
                  bg-gradient-to-r from-purple-600 to-violet-600
                  hover:from-purple-500 hover:to-violet-500
                  transition
                  text-white font-semibold
                  py-3 rounded-xl
                  disabled:opacity-40
                "
              >
                <span
                  className="
                    absolute -top-3 -right-3
                    rounded-full
                    bg-gradient-to-r from-pink-500 to-rose-500
                    px-3 py-1
                    text-xs font-bold uppercase tracking-wide
                    text-white
                    shadow-[0_0_16px_rgba(244,63,94,0.6)]
                  "
                >
                  Beta
                </span>

                {loading ? 'Logging in…' : 'Login'}
              </button>

              <div className="flex items-center justify-between pt-2 text-sm">
                <Link
                  to="/forgot-password"
                  className="
                    text-purple-400
                    font-medium
                    hover:text-purple-300
                    transition
                    no-underline
                  "
                >
                  Forgot password?
                </Link>

                <Link
                  to="/register"
                  state={navState}
                  className="
                    relative
                    text-purple-400
                    font-medium
                    hover:text-purple-300
                    transition
                    no-underline
                  "
                >
                  Create account
                </Link>
              </div>

              {canShowInstall && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowInstall(true)}
                    className="
                      group relative w-full overflow-hidden rounded-2xl border border-cyan-300/30
                      bg-gradient-to-r from-cyan-400/15 via-indigo-400/10 to-sky-400/10
                      px-4 py-3 text-left transition hover:border-cyan-200/45 hover:brightness-110
                    "
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-300/25 blur-2xl" />
                    <div className="pointer-events-none absolute -left-12 -bottom-10 h-24 w-24 rounded-full bg-indigo-300/20 blur-2xl" />

                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/35 bg-cyan-300/15 text-cyan-100">
                          <Smartphone size={17} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                            Install on iPhone
                            <Sparkles size={14} className="text-cyan-200" />
                          </div>
                          <div className="text-xs text-slate-200/75">
                            Guided setup in 3 quick steps
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        size={17}
                        className="text-cyan-100 transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <IosInstallPrompt
        open={showInstall}
        onClose={() => setShowInstall(false)}
      />
    </>
  )
}

export default LoginScreen

// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Scope: Global migration pass
// @Note: Do NOT remove, rename, or modify this block.

import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { getActiveSeasonTheme } from '@/season'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { supabase } from '@/services/supabase/supabaseClient'

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
      // ✅ only present when coming from WandersShareVCSM (or other intentional caller)
      wandersClientKey: typeof s.wandersClientKey === 'string' ? s.wandersClientKey : null,
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

  // ✅ Wrap login submit so we can claim after a successful auth
  const onSubmit = async (e) => {
    await handleLogin(e)

    // Only claim when they came from WandersShareVCSM (state includes token)
    if (!navState?.wandersClientKey) return

    try {
      const { data } = await supabase.auth.getSession()
      const userId = data?.session?.user?.id

      // Only attempt claim if login actually succeeded
      if (!userId) return

      await supabase.rpc('claim_guest_mailbox', {
        p_client_key: navState.wandersClientKey,
      })
    } catch (err) {
      // fail open: login flow should never be blocked
      console.warn('[Wanders claim] failed', err)
    }
  }

  return (
    <>
      <div
        className={`${season.wrapper} min-h-screen flex items-center justify-center`}
      >
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
                relative w-full space-y-5
                bg-white/5 backdrop-blur-xl
                border border-white/10
                p-6 sm:p-8 rounded-2xl
              "
            >
              <h1 className="text-4xl font-semibold text-center tracking-wide">
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
                <p className="text-red-400 text-sm text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="
                  w-full
                  bg-gradient-to-r from-purple-600 to-violet-600
                  hover:from-purple-500 hover:to-violet-500
                  transition
                  text-white font-semibold
                  py-3 rounded-xl
                  disabled:opacity-40
                "
              >
                {loading ? 'Logging in…' : 'Login'}
              </button>

              {/* Footer Row */}
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

              {/* iOS INSTALL */}
              {canShowInstall && (
                <button
                  type="button"
                  onClick={() => setShowInstall(true)}
                  className="
                    mt-3 w-full
                    rounded-xl
                    border border-white/15
                    py-2 text-sm text-white/90
                    hover:bg-white/10
                    transition
                  "
                >
                  Install on iPhone
                </button>
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

import { Link } from 'react-router-dom'
import { useResetPassword } from '@/auth/hooks/useResetPassword'

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

export default function ResetPasswordScreen() {
  const { email, setEmail, status, loading, canSubmit, handleReset } = useResetPassword()

  const isSuccess = status && status.toLowerCase().includes('check')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background:
          'radial-gradient(circle at top left, rgba(139, 198, 255, 0.4), transparent 28%), radial-gradient(circle at bottom right, rgba(251, 191, 36, 0.18), transparent 30%), linear-gradient(180deg, #f6fbff 0%, #edf5fb 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 30,
          padding: '32px 28px',
          background: 'linear-gradient(180deg, rgba(11, 26, 38, 0.98) 0%, rgba(13, 38, 57, 0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 28px 60px rgba(8, 17, 27, 0.28)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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
          <h2
            style={{
              margin: '0 0 8px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 28,
              lineHeight: 1,
            }}
          >
            Forgot password
          </h2>
          <p
            style={{
              margin: '0 0 24px',
              color: 'rgba(226, 238, 246, 0.72)',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {isSuccess ? (
            <div
              style={{
                borderRadius: 14,
                background: 'rgba(34, 197, 94, 0.14)',
                border: '1px solid rgba(134, 239, 172, 0.3)',
                padding: '14px 16px',
                color: '#bbf7d0',
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              Success: {status}
            </div>
          ) : null}

          {status && !isSuccess ? (
            <div
              style={{
                borderRadius: 14,
                background: 'rgba(220, 38, 38, 0.14)',
                border: '1px solid rgba(248, 113, 113, 0.28)',
                padding: '14px 16px',
                color: '#fecaca',
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              {status}
            </div>
          ) : null}

          {!isSuccess && (
            <form onSubmit={handleReset} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label
                  htmlFor="reset-email"
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 13,
                    color: 'rgba(226, 238, 246, 0.82)',
                  }}
                >
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={fieldStyle()}
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  marginTop: 4,
                  border: 'none',
                  borderRadius: 16,
                  background: canSubmit ? 'linear-gradient(135deg, #0f4a72, #13608f)' : 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  padding: '14px 16px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  boxShadow: canSubmit ? '0 18px 30px rgba(15, 74, 114, 0.32)' : 'none',
                }}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link
              to="/"
              style={{ color: '#dbeafe', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

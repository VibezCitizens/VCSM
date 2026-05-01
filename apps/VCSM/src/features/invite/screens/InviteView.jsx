import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Send, CheckCircle2, ArrowLeft, Users } from 'lucide-react'
import { useInvite } from '../hooks/useInvite'
import { S } from '@/features/invite/screens/InviteView.styles'

export default function InviteView() {
  const navigate = useNavigate()
  const {
    email, setEmail,
    sending, success, error,
    rawDebugError, // DEV PROBE
    send, reset,
    inviterName, inviterType,
  } = useInvite()

  const disabled = sending || !email.trim()

  // After invite sends, navigate back so the onboarding card refreshes and turns green
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => navigate(-1), 2000)
    return () => clearTimeout(t)
  }, [success, navigate])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !disabled) send()
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div style={S.card}>
        {success ? (
          <div style={S.successCard}>
            <CheckCircle2 size={48} style={S.successIcon} />
            <p style={S.successTitle}>Invite sent!</p>
            <p style={S.successText}>
              We've sent an invitation to{' '}
              <strong style={{ color: '#e9d5ff' }}>{email || 'your contact'}</strong>.
              They'll receive a link to join Vibez Citizens.
            </p>
            <p style={{ ...S.successText, fontSize: 12, opacity: 0.6, marginBottom: 0 }}>
              Taking you back…
            </p>
            {import.meta.env.DEV && rawDebugError && (
              <pre style={{
                marginTop: 12,
                padding: '8px 10px',
                background: 'rgba(139,92,246,0.10)',
                border: '1px solid rgba(139,92,246,0.30)',
                borderRadius: 8,
                fontSize: 11,
                color: '#c4b5fd',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                textAlign: 'left',
              }}>
                [DEV INVITE] {rawDebugError}
              </pre>
            )}
          </div>
        ) : (
          <>
            <div style={S.iconWrap}>
              <Users size={24} color="#a78bfa" />
            </div>

            <p style={S.title}>Invite a friend</p>
            <p style={S.subtitle}>
              Send a personal invite to join Vibez Citizens. They'll get an email with a sign-up link — no app download required to get started.
            </p>

            {inviterName && (
              <div style={S.senderBadge}>
                <Mail size={15} color="#a78bfa" />
                <div>
                  <p style={S.senderLabel}>Sending as</p>
                  <p style={S.senderName}>
                    {inviterName}
                    {inviterType === 'vport' && (
                      <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>
                        · VPORT
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <label htmlFor="invite-email" style={S.fieldLabel}>Email address</label>
            <input
              id="invite-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ ...S.input, ...(error ? S.inputError : {}) }}
              disabled={sending}
            />

            {error && <p style={S.errorText}>{error}</p>}

            {/* DEV PROBE — remove after invite tracking confirmed working */}
            {import.meta.env.DEV && rawDebugError && (
              <pre style={{
                marginTop: 8,
                padding: '8px 10px',
                background: 'rgba(139,92,246,0.10)',
                border: '1px solid rgba(139,92,246,0.30)',
                borderRadius: 8,
                fontSize: 11,
                color: '#c4b5fd',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                [DEV INVITE] {rawDebugError}
              </pre>
            )}

            <button
              style={{ ...S.sendBtn, ...(disabled ? S.sendBtnDisabled : {}) }}
              onClick={send}
              disabled={disabled}
            >
              <Send size={16} />
              {sending ? 'Sending…' : 'Send invite'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

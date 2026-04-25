import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { authTheme } from '@/features/auth/styles/authTheme'

const CONTACT_CARDS = [
  {
    title: 'General',
    email: 'contact@vibezcitizens.com',
    description: 'General questions, partnerships, and business inquiries.',
    accent: 'rgba(139,92,246,0.18)',
    borderColor: 'rgba(139,92,246,0.30)',
  },
  {
    title: 'Support',
    email: 'support@vibezcitizens.com',
    description: 'Account help, bug reports, and technical issues.',
    accent: 'rgba(99,102,241,0.16)',
    borderColor: 'rgba(99,102,241,0.28)',
  },
  {
    title: 'Privacy',
    email: 'privacy@vibezcitizens.com',
    description: 'Data deletion requests, privacy inquiries, and GDPR/CCPA.',
    accent: 'rgba(168,85,247,0.14)',
    borderColor: 'rgba(168,85,247,0.26)',
  },
  {
    title: 'Report',
    email: 'report@vibezcitizens.com',
    description: 'Abuse, harassment, copyright violations, or unsafe content.',
    accent: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.22)',
  },
]

export default function ContactView() {
  return (
    <div
      className="min-h-screen px-4 py-10 text-white"
      style={{ background: authTheme.pageBackground }}
    >
      <div className="mx-auto w-full max-w-2xl">

        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        {/* Header card */}
        <div
          className="rounded-2xl border border-white/10 p-6 sm:p-8 mb-6"
          style={{
            background: authTheme.cardBackground,
            boxShadow: authTheme.cardShadow,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.30)' }}
            >
              <Mail size={18} className="text-purple-300" />
            </div>
            <h1 className="text-xl font-bold text-white">Contact Vibez Citizens</h1>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--vc-text-muted)' }}>
            Reach our team for support, business inquiries, privacy requests, or to report
            something. Choose the address that matches your need and we will get back to you.
          </p>
          <p className="mt-3 text-xs" style={{ color: 'var(--vc-text-muted)' }}>
            We typically respond within 24–48 hours.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONTACT_CARDS.map(({ title, email, description, accent, borderColor }) => (
            <div
              key={email}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{
                background: accent,
                border: `1px solid ${borderColor}`,
              }}
            >
              <div>
                <div className="text-sm font-semibold text-white mb-1">{title}</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--vc-text-muted)' }}>
                  {description}
                </p>
              </div>

              <div
                className="rounded-lg px-3 py-2 text-xs font-mono break-all"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.70)',
                }}
              >
                {email}
              </div>

              <a
                href={`mailto:${email}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(139,92,246,0.55)',
                  border: '1px solid rgba(139,92,246,0.45)',
                  color: '#fff',
                }}
              >
                <Mail size={14} />
                Send email
              </a>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

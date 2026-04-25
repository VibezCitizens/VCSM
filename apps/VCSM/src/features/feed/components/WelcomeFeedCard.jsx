import { useNavigate } from 'react-router-dom'
import {
  Sparkles, X, ChevronRight, User, Compass,
  MessageSquare, FileText, Store, CreditCard, CheckCircle2,
} from 'lucide-react'
import { useFeedWelcomeCard } from '../hooks/useFeedWelcomeCard'

const FEATURES = [
  {
    icon: FileText,
    title: 'Create posts & vibes',
    desc: 'Share moments, ideas, and local content with your community.',
  },
  {
    icon: User,
    title: 'Discover citizens',
    desc: 'Find people near you and build your social network.',
  },
  {
    icon: Store,
    title: 'Explore VPORT businesses',
    desc: 'Browse local services, menus, and business profiles.',
  },
  {
    icon: MessageSquare,
    title: 'Send messages',
    desc: 'Chat directly with citizens and businesses.',
  },
  {
    icon: CreditCard,
    title: 'Share VPORT business cards',
    desc: 'Distribute your digital business card to anyone.',
  },
  {
    icon: CheckCircle2,
    title: 'Complete your profile',
    desc: 'Fill in your details to appear in discovery and search.',
  },
]

const S = {
  card: {
    position: 'relative',
    borderRadius: 20,
    background: 'var(--vc-card-bg)',
    border: '1px solid rgba(139,92,246,0.25)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 0 0 1px rgba(139,92,246,0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  strip: {
    height: 5,
    background: 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 60%, #7c3aed 100%)',
  },
  body: {
    padding: '18px 18px 16px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  titleLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: 'rgba(139,92,246,0.18)',
    border: '1px solid rgba(139,92,246,0.30)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.3,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    color: 'rgba(255,255,255,0.35)',
    flexShrink: 0,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.55,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
    marginBottom: 14,
  },
  ctaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  ctaBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.80)',
    textAlign: 'left',
  },
  ctaBtnPrimary: {
    gridColumn: '1 / -1',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.30) 0%, rgba(109,40,217,0.20) 100%)',
    border: '1px solid rgba(139,92,246,0.35)',
    color: '#c4b5fd',
  },
  ctaDismiss: {
    gridColumn: '1 / -1',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.30)',
    fontSize: 12,
    justifyContent: 'center',
  },
  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'flex-end',
    padding: 0,
  },
  drawer: {
    width: '100%',
    maxHeight: '85dvh',
    background: 'var(--vc-bg-0, #0e0e1a)',
    borderRadius: '20px 20px 0 0',
    border: '1px solid rgba(139,92,246,0.20)',
    borderBottom: 'none',
    overflowY: 'auto',
    padding: '20px 20px 40px',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#fff',
  },
  drawerCloseBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    padding: '6px 6px',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.60)',
    display: 'flex',
    alignItems: 'center',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  featureRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: 'rgba(139,92,246,0.15)',
    border: '1px solid rgba(139,92,246,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.45,
  },
  drawerDismissBtn: {
    width: '100%',
    marginTop: 24,
    padding: '13px 0',
    borderRadius: 14,
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(109,40,217,0.30)',
  },
}

export default function WelcomeFeedCard({ actorId, kind }) {
  const navigate = useNavigate()
  const { show, dismiss, modalOpen, openModal, closeModal } = useFeedWelcomeCard({ actorId, kind })

  if (!show) return null

  function handleCompleteProfile() {
    dismiss()
    navigate('/settings?tab=profile')
  }

  function handleExplore() {
    dismiss()
    navigate('/explore')
  }

  return (
    <>
      <div style={S.card} className="mx-4 mt-1">
        <div style={S.strip} />
        <div style={S.body}>
          <div style={S.titleRow}>
            <div style={S.titleLeft}>
              <div style={S.iconBadge}>
                <Sparkles size={16} color="#a78bfa" />
              </div>
              <p style={S.title}>Welcome to Vibez Citizens</p>
            </div>
            <button style={S.closeBtn} onClick={dismiss} aria-label="Dismiss welcome card">
              <X size={16} />
            </button>
          </div>

          <p style={S.description}>
            Discover people, VPORTs, vibes, and districts around you. Create posts, complete your profile, explore local businesses, and connect through messages.
          </p>

          <div style={S.divider} />

          <div style={S.ctaGrid}>
            <button
              style={{ ...S.ctaBtn, ...S.ctaBtnPrimary }}
              onClick={openModal}
            >
              <span>Learn what you can do</span>
              <ChevronRight size={14} color="#a78bfa" />
            </button>

            <button style={S.ctaBtn} onClick={handleCompleteProfile}>
              <span>Complete profile</span>
              <ChevronRight size={13} style={{ opacity: 0.4 }} />
            </button>

            <button style={S.ctaBtn} onClick={handleExplore}>
              <span>Explore</span>
              <Compass size={13} style={{ opacity: 0.4 }} />
            </button>

            <button style={{ ...S.ctaBtn, ...S.ctaDismiss }} onClick={dismiss}>
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Modal rendered as sibling — avoids iOS stacking context issues */}
      {modalOpen && (
        <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) { closeModal(); dismiss() } }}>
          <div style={S.drawer}>
            <div style={S.drawerHeader}>
              <p style={S.drawerTitle}>What you can do</p>
              <button style={S.drawerCloseBtn} onClick={() => { closeModal(); dismiss() }} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div style={S.featureList}>
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} style={S.featureRow}>
                  <div style={S.featureIcon}>
                    <Icon size={17} color="#a78bfa" />
                  </div>
                  <div>
                    <p style={S.featureTitle}>{title}</p>
                    <p style={S.featureDesc}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button style={S.drawerDismissBtn} onClick={() => { closeModal(); dismiss() }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}

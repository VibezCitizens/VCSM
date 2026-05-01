import { useNavigate } from 'react-router-dom'
import {
  Sparkles, X, ChevronRight, User, Compass,
  MessageSquare, FileText, Store, CreditCard, CheckCircle2,
} from 'lucide-react'
import { useFeedWelcomeCard } from '../hooks/useFeedWelcomeCard'
import { S } from '@/features/feed/components/welcomeFeedCard.styles'

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

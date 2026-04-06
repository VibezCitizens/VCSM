import { Building2, GraduationCap, ShieldCheck, Users } from 'lucide-react'

function FeatureCard({ icon: Icon, title, description, compact = false }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(15, 74, 114, 0.12)',
        borderRadius: 22,
        padding: compact ? 18 : 22,
        minHeight: compact ? 0 : 220,
        background: 'rgba(255, 255, 255, 0.82)',
        boxShadow: '0 18px 34px rgba(15, 48, 84, 0.08)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(15, 74, 114, 0.1)',
          color: '#0f4a72',
          marginBottom: compact ? 12 : 14,
        }}
      >
        <Icon size={20} />
      </div>
      <h3
        style={{
          margin: `0 0 ${compact ? 8 : 10}px`,
          fontSize: compact ? 17 : 18,
          fontWeight: 700,
          color: '#08111b',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          lineHeight: compact ? 1.58 : 1.65,
          color: '#506274',
          fontSize: compact ? 13.5 : 14,
        }}
      >
        {description}
      </p>
    </div>
  )
}

const FEATURE_CARDS = [
  {
    icon: ShieldCheck,
    title: 'Administration',
    description: 'Manage staff, students, courses, and school operations from a single dashboard.',
  },
  {
    icon: Users,
    title: 'Teachers',
    description: 'Deliver lessons, create assignments, grade submissions, and communicate with students and parents.',
  },
  {
    icon: Building2,
    title: 'Parents',
    description: 'See your child\'s courses, grades, and assignments. Message teachers directly.',
  },
  {
    icon: GraduationCap,
    title: 'Students',
    description: 'Access your courses, complete lessons, submit assignments, and view your grades.',
  },
]

function LoginHeroPanel({ isCompactLayout, isStackedLayout, featureColumnCount }) {
  return (
    <section
      style={{
        borderRadius: 30,
        padding: isCompactLayout ? '22px 18px' : '30px clamp(24px, 3vw, 42px)',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.94), rgba(246,251,255,0.88))',
        border: '1px solid rgba(15, 74, 114, 0.1)',
        boxShadow: '0 28px 60px rgba(15, 48, 84, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: isCompactLayout ? 18 : 26,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: isCompactLayout
            ? 'clamp(2.1rem, 8.5vw, 3rem)'
            : isStackedLayout
              ? 'clamp(2.5rem, 6vw, 4.1rem)'
              : 'clamp(2.35rem, 3.9vw, 4.2rem)',
          lineHeight: 0.94,
          color: '#08111b',
          maxWidth: isStackedLayout ? 900 : 760,
          letterSpacing: '-0.02em',
        }}
      >
        Welcome to WENTREX.
      </h1>

      <p
        style={{
          margin: 0,
          maxWidth: isStackedLayout ? 920 : 720,
          fontSize: isCompactLayout ? 15 : 16,
          lineHeight: isCompactLayout ? 1.62 : 1.72,
          color: '#4e6273',
        }}
      >
        Sign in to access your school's workspace. Administrators, teachers,
        parents, and students all use the same platform — your role and
        permissions are assigned by your school.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${featureColumnCount}, minmax(0, 1fr))`,
          gap: isCompactLayout ? 14 : 18,
          maxWidth: isStackedLayout ? 'none' : 840,
        }}
      >
        {FEATURE_CARDS.map((card) => (
          <FeatureCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            description={card.description}
            compact={isCompactLayout}
          />
        ))}
      </div>
    </section>
  )
}

export default LoginHeroPanel

import { lazy, Suspense } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { authTheme } from '@/features/auth/adapters/auth.adapter'
import { useLegalDocument } from '../hooks/useLegalDocument'
import PublicNavbar, { PUBLIC_NAV_HEIGHT } from '@/shared/components/PublicNavbar'
import '@/features/legal/styles/legalDocument.css'

const AgeVerificationContent = lazy(() => import('../docs/AgeVerificationContent'))
const PrivacyPolicyContent = lazy(() => import('../docs/PrivacyPolicyContent'))
const TermsOfServiceContent = lazy(() => import('../docs/TermsOfServiceContent'))

const DOCUMENT_MAP = {
  'age-verification': {
    component: AgeVerificationContent,
    documentType: 'age_verification',
    fallbackTitle: 'Age Verification Attestation',
  },
  'privacy-policy': {
    component: PrivacyPolicyContent,
    documentType: 'privacy_policy',
    fallbackTitle: 'Privacy Policy',
  },
  'terms-of-service': {
    component: TermsOfServiceContent,
    documentType: 'terms_of_service',
    fallbackTitle: 'Terms of Service',
  },
}

const baseStyle = {
  background: authTheme.pageBackground,
  paddingTop: `calc(${PUBLIC_NAV_HEIGHT}px + env(safe-area-inset-top))`,
}

export default function LegalDocumentScreen() {
  const { docType } = useParams()
  const [searchParams] = useSearchParams()
  const entry = DOCUMENT_MAP[docType]

  const requestedVersion = searchParams.get('v') || null

  const { docMeta, loading, error: docError } = useLegalDocument({
    appKey: 'vcsm',
    documentType: entry?.documentType,
    version: requestedVersion,
    enabled: !!entry,
  })

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white" style={baseStyle}>
        <PublicNavbar />
        <p style={{ color: 'var(--vc-text-muted)' }}>Document not found.</p>
      </div>
    )
  }

  const Content = entry.component
  const title = docMeta?.title || entry.fallbackTitle
  const version = docMeta?.version || requestedVersion
  const publishedAt = docMeta?.published_at
    ? new Date(docMeta.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div
      className="min-h-screen px-4 text-white"
      style={{ ...baseStyle, paddingTop: `calc(${PUBLIC_NAV_HEIGHT}px + env(safe-area-inset-top) + 32px)` }}
    >
      <PublicNavbar />
      <div className="mx-auto w-full max-w-2xl">
        <div
          className="rounded-2xl border border-white/10 p-6 sm:p-8"
          style={{
            background: authTheme.cardBackground,
            boxShadow: authTheme.cardShadow,
          }}
        >
          <div className="legal-doc-content">
            {!loading && (
              <div className="mb-6">
                {docError ? (
                  <p className="text-sm mb-2" style={{ color: 'var(--vc-text-muted)' }}>
                    Document metadata unavailable. Showing current version.
                  </p>
                ) : (
                  <>
                    <h1>{title}{version ? ` v${version}` : ''}</h1>
                    {publishedAt && (
                      <p className="text-sm" style={{ color: 'var(--vc-text-muted)' }}>
                        Effective {publishedAt}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <Suspense fallback={null}>
              <Content />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

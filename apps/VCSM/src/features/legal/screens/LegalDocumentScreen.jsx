import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { authTheme } from '@/features/auth/styles/authTheme'
import { dalGetLegalDocument } from '../dal/legalDocuments.read.dal'
import PrivacyPolicyContent from '../docs/PrivacyPolicyContent'
import TermsOfServiceContent from '../docs/TermsOfServiceContent'
import '@/features/legal/styles/legalDocument.css'

const DOCUMENT_MAP = {
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

export default function LegalDocumentScreen() {
  const { docType } = useParams()
  const [searchParams] = useSearchParams()
  const entry = DOCUMENT_MAP[docType]

  const requestedVersion = searchParams.get('v') || null

  const [docMeta, setDocMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!entry) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function resolve() {
      try {
        const doc = await dalGetLegalDocument({
          appKey: 'vcsm',
          documentType: entry.documentType,
          version: requestedVersion,
        })
        if (!cancelled) setDocMeta(doc)
      } catch (err) {
        console.error('[LegalDocumentScreen] Failed to resolve document:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [entry, requestedVersion])

  if (!entry) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6 text-white"
        style={{ background: authTheme.pageBackground }}
      >
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
      className="min-h-screen px-4 py-8 text-white"
      style={{ background: authTheme.pageBackground }}
    >
      <div className="mx-auto w-full max-w-2xl">
        <div
          className="rounded-2xl border border-white/10 p-6 sm:p-8"
          style={{
            background: authTheme.cardBackground,
            boxShadow: authTheme.cardShadow,
          }}
        >
          <div className="legal-doc-content">
            {/* Dynamic header from DB record */}
            {!loading && (
              <div className="mb-6">
                <h1>{title}{version ? ` v${version}` : ''}</h1>
                {publishedAt && (
                  <p className="text-sm" style={{ color: 'var(--vc-text-muted)' }}>
                    Effective {publishedAt}
                  </p>
                )}
              </div>
            )}

            <Content />
          </div>
        </div>
      </div>
    </div>
  )
}

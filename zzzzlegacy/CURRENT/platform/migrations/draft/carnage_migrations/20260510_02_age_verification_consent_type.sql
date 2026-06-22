-- ============================================================
-- CARNAGE MIGRATION 02
-- Date: 2026-05-10
-- Source: Venom Finding 7 + Wolverine Item 4
-- Title: Add age_verification consent_type + active legal document seed
-- ============================================================

-- 1. Extend consent_type CHECK on platform.user_consents
ALTER TABLE platform.user_consents
  DROP CONSTRAINT IF EXISTS user_consents_consent_type_check;

ALTER TABLE platform.user_consents
  ADD CONSTRAINT user_consents_consent_type_check
  CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy',
    'marketing_email',
    'location_consent',
    'age_verification'
  ));

-- 2. Extend document_type CHECK on platform.legal_documents
ALTER TABLE platform.legal_documents
  DROP CONSTRAINT IF EXISTS legal_documents_document_type_check;

ALTER TABLE platform.legal_documents
  ADD CONSTRAINT legal_documents_document_type_check
  CHECK (document_type IN (
    'terms_of_service',
    'privacy_policy',
    'marketing_email',
    'location_consent',
    'age_verification'
  ));

-- 3. Seed the age_verification legal document (idempotent via NOT EXISTS guard)
INSERT INTO platform.legal_documents (
  app_id,
  document_type,
  version,
  title,
  is_active,
  published_at
)
SELECT
  a.id,
  'age_verification',
  '1.0',
  'Age Verification Attestation',
  true,
  now()
FROM platform.apps a
WHERE a.key = 'vcsm'
  AND NOT EXISTS (
    SELECT 1
    FROM platform.legal_documents ld
    WHERE ld.app_id = a.id
      AND ld.document_type = 'age_verification'
  );

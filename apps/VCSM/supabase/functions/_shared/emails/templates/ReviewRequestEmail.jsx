/**
 * ReviewRequestEmail — asks a citizen to leave a review for a vport.
 *
 * TICKET-EMAIL-004 — migrated from the orphan apps/VCSM/emails/review-request.jsx
 * onto the shared React Email foundation. All chrome/branding now comes from
 * VibezLayout + the shared typography helpers + brand tokens; no hardcoded colors
 * or fonts remain (the original used #0f0f12 / #ffffff / #cfcfd4 / sans-serif
 * inline — all removed in favor of the brand palette).
 *
 * Functional content preserved verbatim from the original:
 *   - preview : "How was your experience with {vportName}?"
 *   - heading : "Leave a review"
 *   - copy    : "Hi {citizenName}, thanks for visiting {vportName}. Tap below to
 *                share your experience."
 *   - CTA     : "Write a review" -> reviewUrl
 *
 * Props:
 *   citizenName  string  recipient's display name   (default 'Citizen')
 *   vportName    string  business being reviewed     (default 'Vport')
 *   reviewUrl    string  CTA destination             (default brand.homeUrl)
 *
 * Deno-compatible: imports only @react-email/components + local shared modules
 * (explicit extensions). Caller validates reviewUrl before passing it.
 */
import { Section } from '@react-email/components';
import { VibezLayout } from '../components/VibezLayout.jsx';
import { EmailHeading, EmailText } from '../components/EmailText.jsx';
import { CTAButton } from '../components/CTAButton.jsx';
import { brand } from '../brand/tokens.js';

export function ReviewRequestEmail({
  citizenName = 'Citizen',
  vportName = 'Vport',
  reviewUrl = brand.homeUrl,
}) {
  return (
    <VibezLayout preview={`How was your experience with ${vportName}?`}>
      <EmailHeading>Leave a review</EmailHeading>
      <EmailText>
        Hi {citizenName}, thanks for visiting {vportName}. Tap below to share your
        experience.
      </EmailText>
      <Section style={{ paddingTop: '8px' }}>
        <CTAButton href={reviewUrl}>Write a review</CTAButton>
      </Section>
    </VibezLayout>
  );
}

// Sample data for the React Email preview server (`email dev`). Static metadata
// only — not used at render time by callers.
ReviewRequestEmail.PreviewProps = {
  citizenName: 'George',
  vportName: 'Tri-Point Lock & Keys',
  reviewUrl: 'https://vibezcitizens.com/review/tri-point',
};

export default ReviewRequestEmail;

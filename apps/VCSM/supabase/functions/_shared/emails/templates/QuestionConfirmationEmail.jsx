/**
 * QuestionConfirmationEmail — confirms to an anonymous asker that the question
 * they submitted on the public Traffic Q&A surface was received, and explains
 * that it is pending review before it can appear publicly.
 *
 * Built on the same shared React Email foundation as LeadConfirmationEmail
 * (VibezLayout + shared typography + brand tokens) — no hardcoded colors, fonts,
 * logo URL, or domain.
 *
 * Subject is NOT defined here — it stays in the Edge Function SES envelope. The
 * <Preview> below is preheader text.
 *
 * Props (content is generated from props only — no SES, Supabase, Deno.env, DB):
 *   displayName    string        asker's first name        (default 'there')
 *   questionTitle  string|null   the question they asked   (default null)
 *
 * Deliberately makes NO promise of publication and does NOT mention a future
 * "answered" email (that flow does not exist yet). It only confirms receipt and
 * the pending-review state. No delete/remove link is included — that ships only
 * once the server-side token RPC exists.
 *
 * Deno-compatible: imports only @react-email/components + local shared modules.
 */
import { Section } from '@react-email/components';
import { VibezLayout } from '../components/VibezLayout.jsx';
import { EmailHeading, EmailText, Divider } from '../components/EmailText.jsx';
import { CTAButton } from '../components/CTAButton.jsx';
import { brand } from '../brand/tokens.js';

export function QuestionConfirmationEmail({
  displayName = 'there',
  questionTitle = null,
}) {
  const hasTitle = typeof questionTitle === 'string' && questionTitle.trim().length > 0;

  return (
    <VibezLayout preview="We received your question">
      <EmailHeading>Question received</EmailHeading>

      <EmailText tone="greeting">Hey {displayName},</EmailText>

      <EmailText>
        Thanks for submitting your question to{' '}
        <strong style={{ color: brand.color.textStrong }}>{brand.name}</strong>. We
        have received it.
      </EmailText>

      {hasTitle ? (
        <EmailText tone="muted">“{questionTitle.trim()}”</EmailText>
      ) : null}

      <EmailText>
        Your question is pending review and won’t appear publicly unless it’s
        approved by our team.
      </EmailText>

      <Divider />

      <EmailText tone="muted">
        While you wait, you can explore questions and answers from local experts
        across Vibez Citizens.
      </EmailText>
      <Section style={{ paddingBottom: '4px' }}>
        <CTAButton href={brand.homeUrl}>Explore Vibez Citizens</CTAButton>
      </Section>
    </VibezLayout>
  );
}

// Sample data for the React Email preview server (`email dev`). Static metadata only.
QuestionConfirmationEmail.PreviewProps = {
  displayName: 'George',
  questionTitle: 'How much does a lock rekey usually cost?',
};

export default QuestionConfirmationEmail;

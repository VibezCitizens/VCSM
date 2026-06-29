/**
 * QuestionRemovalLinkEmail — sent when someone requests removal of a question
 * they submitted on the public Traffic Q&A surface AND the email they entered
 * matches the one stored on the question.
 *
 * Built on the shared React Email foundation (VibezLayout + shared typography +
 * brand tokens) — no hardcoded colors, fonts, logo URL, or domain.
 *
 * Subject lives in the Edge Function SES envelope. <Preview> is preheader text.
 *
 * Props (content from props only — no SES, Supabase, Deno.env, DB):
 *   removeUrl  string   one-time, 30-minute removal link (required; http(s))
 *
 * Security: the link is the only sensitive value and it is short-lived +
 * single-use. The template renders it solely as a CTA href; nothing else about
 * the question is exposed.
 *
 * Deno-compatible: imports only @react-email/components + local shared modules.
 */
import { Section } from '@react-email/components';
import { VibezLayout } from '../components/VibezLayout.jsx';
import { EmailHeading, EmailText, Divider } from '../components/EmailText.jsx';
import { CTAButton } from '../components/CTAButton.jsx';
import { brand } from '../brand/tokens.js';

function isHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

export function QuestionRemovalLinkEmail({ removeUrl = null }) {
  const showCta = isHttpUrl(removeUrl);

  return (
    <VibezLayout preview="Remove your question — this link expires in 30 minutes">
      <EmailHeading>Remove your question</EmailHeading>

      <EmailText tone="greeting">Hi there,</EmailText>

      <EmailText>
        We received a request to remove your question from{' '}
        <strong style={{ color: brand.color.textStrong }}>{brand.name}</strong>.
      </EmailText>

      <EmailText>
        This link expires in 30 minutes and can be used once.
      </EmailText>

      {showCta ? (
        <Section style={{ paddingTop: '4px', paddingBottom: '8px' }}>
          <CTAButton href={removeUrl}>Remove my question</CTAButton>
        </Section>
      ) : null}

      <Divider />

      <EmailText tone="muted">
        If you did not request this, you can ignore this email — your question
        stays exactly as it is.
      </EmailText>
    </VibezLayout>
  );
}

// Sample data for the React Email preview server (`email dev`). Static only.
QuestionRemovalLinkEmail.PreviewProps = {
  removeUrl: 'https://traffic.vibezcitizens.com/answers/remove?t=example-token',
};

export default QuestionRemovalLinkEmail;

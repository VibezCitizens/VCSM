/**
 * LeadConfirmationEmail — confirms to a lead that their request to a vport was
 * received, then offers two growth CTAs (create a profile / add a business).
 *
 * TICKET-EMAIL-005 — migrated from the inline string builders in
 * send-lead-confirmation/index.ts (buildLeadConfirmationHtml /
 * buildLeadConfirmationText) onto the shared React Email foundation. All chrome
 * and branding now come from VibezLayout + shared typography + brand tokens; no
 * hardcoded colors, fonts, logo URL, or domain remain.
 *
 * Subject is NOT defined here — it stays in the Edge Function SES envelope as
 * "Request received by Vibez Citizens". The <Preview> below is preheader text.
 *
 * Props (content is generated from props only — no SES, Supabase, Deno.env, DB):
 *   displayName         string        recipient's first name  (default 'there')
 *   provider            string        business contacted      (default 'this provider')
 *   providerProfileUrl  string|null   optional profile link   (default null)
 *
 * providerProfileUrl CTA (locked decision): rendered only when the value is a
 * present, http(s) URL; omitted safely otherwise. The Edge Function already
 * passes null for missing/unsafe URLs; isHttpUrl is a defensive second check so
 * the template never emits an unsafe href.
 *
 * Deno-compatible: imports only @react-email/components + local shared modules
 * (explicit extensions).
 */
import { Section } from '@react-email/components';
import { VibezLayout } from '../components/VibezLayout.jsx';
import { EmailHeading, EmailText, Divider } from '../components/EmailText.jsx';
import { CTAButton } from '../components/CTAButton.jsx';
import { brand } from '../brand/tokens.js';

function isHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

// Growth links: domain from shared brand token, paths preserved from the legacy
// template verbatim.
const CREATE_PROFILE_URL = `${brand.homeUrl}/how-to/create-profile`;
const CREATE_VPORT_URL = `${brand.homeUrl}/how-to/create-vport`;

export function LeadConfirmationEmail({
  displayName = 'there',
  provider = 'this provider',
  providerProfileUrl = null,
}) {
  const showProfileCta = isHttpUrl(providerProfileUrl);

  return (
    <VibezLayout preview="Request received by Vibez Citizens">
      <EmailHeading>Request received</EmailHeading>

      <EmailText tone="greeting">Hey {displayName},</EmailText>

      <EmailText>
        Thanks for sending a request to{' '}
        <strong style={{ color: brand.color.textStrong }}>{provider}</strong>. Your
        message was received successfully.
      </EmailText>

      <EmailText>
        <strong style={{ color: brand.color.textStrong }}>{provider}</strong> should
        contact you soon using the information you provided.
      </EmailText>

      {showProfileCta ? (
        <Section style={{ paddingTop: '4px', paddingBottom: '8px' }}>
          <CTAButton href={providerProfileUrl}>
            {`View ${provider}'s profile`}
          </CTAButton>
        </Section>
      ) : null}

      <Divider />

      <EmailText tone="muted">
        If you want, you can create a Vibez Citizens profile and start building your
        presence across trusted local businesses.
      </EmailText>
      <Section style={{ paddingBottom: '4px' }}>
        <CTAButton href={CREATE_PROFILE_URL}>Start your Vibez profile</CTAButton>
      </Section>

      <Divider />

      <EmailText tone="muted">
        Also—if you run a business, Vibez Citizens lets you turn real customer
        reviews into visibility and trust.
      </EmailText>
      <Section style={{ paddingBottom: '4px' }}>
        <CTAButton href={CREATE_VPORT_URL}>Add your business</CTAButton>
      </Section>
    </VibezLayout>
  );
}

// Sample data for the React Email preview server (`email dev`). Static metadata
// only — exercises the providerProfileUrl CTA branch.
LeadConfirmationEmail.PreviewProps = {
  displayName: 'George',
  provider: 'Tri-Point Lock & Keys',
  providerProfileUrl: 'https://vibezcitizens.com/u/tri-point',
};

export default LeadConfirmationEmail;

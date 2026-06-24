/**
 * CitizenInviteEmail — invites a person to join Vibez Citizens.
 *
 * TICKET-EMAIL-006 — migrated from the inline HTML/text strings inside
 * sendInviteEmail() in send-citizen-invite/index.ts onto the shared React Email
 * foundation. All chrome and branding now come from VibezLayout + shared
 * typography + brand tokens; no hardcoded colors, fonts, logo URL, or domain
 * remain.
 *
 * Subject is NOT defined here — it stays in the Edge Function SES envelope as
 * `${inviterName} invited you to Vibez Citizens`. The <Preview> below is
 * preheader text.
 *
 * Props (content is generated from props only — no SES, Supabase, Deno.env, DB):
 *   inviterName  string        who is inviting   (default 'Someone')
 *   inviteLink   string|null   CTA destination   (default null)
 *
 * inviteLink CTA: rendered only when the value is a present, http(s) URL;
 * omitted safely otherwise. The Edge Function builds this link server-side, so
 * it is normally always present; isHttpUrl is a defensive check so the template
 * never emits an unsafe href.
 *
 * Deno-compatible: imports only @react-email/components + local shared modules
 * (explicit extensions).
 */
import { Section } from '@react-email/components';
import { VibezLayout } from '../components/VibezLayout.jsx';
import { EmailHeading, EmailText } from '../components/EmailText.jsx';
import { CTAButton } from '../components/CTAButton.jsx';
import { brand } from '../brand/tokens.js';

function isHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

export function CitizenInviteEmail({ inviterName = 'Someone', inviteLink = null }) {
  const showCta = isHttpUrl(inviteLink);

  return (
    <VibezLayout preview="You're invited to Vibez Citizens">
      <EmailHeading>{"You're invited"}</EmailHeading>

      <EmailText>
        <strong style={{ color: brand.color.textStrong }}>{inviterName}</strong>{' '}
        invited you to join Vibez Citizens.
      </EmailText>

      <EmailText>
        Create your profile, discover local businesses, and connect with your
        community.
      </EmailText>

      {showCta ? (
        <Section style={{ paddingTop: '4px', paddingBottom: '8px' }}>
          <CTAButton href={inviteLink}>Join Vibez Citizens</CTAButton>
        </Section>
      ) : null}

      <EmailText tone="muted">
        {"If you didn't expect this invitation, you can ignore this email."}
      </EmailText>
    </VibezLayout>
  );
}

// Sample data for the React Email preview server (`email dev`). Static metadata
// only — exercises the inviteLink CTA branch.
CitizenInviteEmail.PreviewProps = {
  inviterName: 'George',
  inviteLink: 'https://vibezcitizens.com/register?invite_code=demo-1234',
};

export default CitizenInviteEmail;

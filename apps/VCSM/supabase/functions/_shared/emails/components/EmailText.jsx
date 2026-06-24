/**
 * Typography helpers for VCSM transactional emails.
 *
 * TICKET-EMAIL-002 — Shared React Email foundation.
 *
 * EmailHeading — the 26px white heading used at the top of email bodies.
 * EmailText    — body copy with brand tone variants:
 *                  'body'     (default) — primary body color
 *                  'greeting' — greeting line
 *                  'strong'   — white emphasis
 *                  'muted'    — secondary / growth copy
 * Divider      — the thin in-body horizontal rule.
 *
 * All colors come from emails/brand/tokens.js. Deno-compatible: imports only
 * @react-email/components + local brand tokens.
 */
import { Heading, Hr, Text } from '@react-email/components';
import { brand } from '../brand/tokens.js';

const TONE_COLOR = {
  body: brand.color.textBody,
  greeting: brand.color.textGreeting,
  strong: brand.color.textStrong,
  muted: brand.color.textMuted,
};

export function EmailHeading({ children }) {
  return (
    <Heading
      as="h1"
      style={{
        margin: 0,
        fontSize: '26px',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.4px',
        color: brand.color.textStrong,
        fontFamily: brand.font,
      }}
    >
      {children}
    </Heading>
  );
}

export function EmailText({ children, tone = 'body' }) {
  return (
    <Text
      style={{
        margin: '0 0 16px',
        fontSize: '15px',
        lineHeight: 1.75,
        color: TONE_COLOR[tone] ?? brand.color.textBody,
        fontFamily: brand.font,
      }}
    >
      {children}
    </Text>
  );
}

export function Divider() {
  return (
    <Hr
      style={{
        border: 'none',
        borderTop: `1px solid ${brand.color.divider}`,
        margin: '24px 0',
      }}
    />
  );
}

export default EmailText;

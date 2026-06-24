/**
 * CTAButton — branded call-to-action button for VCSM transactional emails.
 *
 * TICKET-EMAIL-002 — Shared React Email foundation.
 *
 * Mirrors the live SES button (purple accent, rounded, bold white label).
 * `href` is passed straight to React Email's <Button>; callers remain
 * responsible for validating the URL (e.g. isSafeUrl) before passing it, exactly
 * as the current Edge Functions do.
 *
 * Deno-compatible: imports only @react-email/components + local brand tokens.
 */
import { Button } from '@react-email/components';
import { brand } from '../brand/tokens.js';

export function CTAButton({ href, children }) {
  return (
    <Button
      href={href}
      style={{
        display: 'inline-block',
        padding: '14px 22px',
        fontSize: '15px',
        fontWeight: 700,
        color: brand.color.textStrong,
        backgroundColor: brand.color.accent,
        textDecoration: 'none',
        borderRadius: '12px',
      }}
    >
      {children}
    </Button>
  );
}

export default CTAButton;

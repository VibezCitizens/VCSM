/**
 * VCSM transactional email — brand tokens (single source of truth).
 *
 * TICKET-EMAIL-002 — Shared React Email foundation.
 *
 * These values mirror the existing AWS SES email look (dark theme + purple
 * gradient header + centered footer) so migrated templates render identically
 * to today's hand-written HTML. Every template/component MUST read brand from
 * here — do not hardcode colors or the logo URL in templates.
 *
 * Deno-compatible: plain data only. No imports, no node:/fs/path/process, no
 * browser-only globals.
 */
export const brand = {
  name: 'Vibez Citizens',
  logoUrl: 'https://vibezcitizens.com/vibez-icon-512x512.png',
  homeUrl: 'https://vibezcitizens.com',
  font: 'Arial, Helvetica, sans-serif',
  color: {
    pageBg: '#0b0b0f',          // outer wrapper background
    cardBg: '#13111f',          // email card background
    headerGradient:             // header strip gradient (matches live SES HTML)
      'linear-gradient(135deg,#3b0764 0%,#5b21b6 50%,#7c5cff 100%)',
    headerBgFallback: '#5b21b6', // solid fallback for clients that drop gradients
    accent: '#7c5cff',          // CTA / link purple
    divider: '#2a2540',         // in-body horizontal rule
    footerBorder: '#1e1a30',    // footer top border
    textStrong: '#ffffff',      // headings / emphasis
    textGreeting: '#e2e8f0',    // greeting line
    textBody: '#b8c0cc',        // body copy
    textMuted: '#8892a0',       // secondary / growth copy
    textFooter: '#4a4a5a',      // footer + disclaimers
  },
};

export default brand;

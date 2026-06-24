/**
 * Shared render helper for VCSM transactional emails.
 *
 * TICKET-EMAIL-002 — Shared React Email foundation.
 *
 * RENDER STRATEGY (locked):
 *   Runtime React Email rendering inside the Supabase Edge Function Deno
 *   runtime. @react-email/render@2 ships a `deno` export with no node: built-ins
 *   (it uses react-dom/server.browser), so this runs in Deno WITHOUT any Node
 *   polyfills. No build-time token interpolation is used — templates receive
 *   real props and are rendered per request.
 *
 * SENDER (unchanged):
 *   AWS SES v2 remains the sender. This helper NEVER sends anything — it only
 *   turns a React element into { html, text }. Edge Function handlers will
 *   import a template + this helper and pass { html, text } to SES in a later
 *   ticket (EMAIL-004 / EMAIL-005). No Edge Function or SES logic is touched
 *   in this ticket.
 *
 * `pretty` is intentionally left at its default (false) so the Deno bundle
 * stays small and prettier is never pulled in at cold start.
 *
 * Deno-compatible: no node:/fs/path/process imports, no browser-only globals.
 * `render` is imported from @react-email/render (installed locally + available
 * in Deno via npm:); the Edge Function import map will provide both
 * @react-email/render and @react-email/components.
 */
import { render } from '@react-email/render';

/**
 * Render a React Email element into both HTML and a plaintext fallback.
 *
 * @param {import('react').ReactElement} element - a React Email template element
 * @returns {Promise<{ html: string, text: string }>}
 */
export async function renderEmail(element) {
  const html = await render(element);                      // pretty defaults to false
  const text = await render(element, { plainText: true }); // plaintext fallback
  return { html, text };
}

export default renderEmail;

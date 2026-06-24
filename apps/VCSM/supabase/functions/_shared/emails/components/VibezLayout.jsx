/**
 * VibezLayout — shared outer shell for all VCSM transactional emails.
 *
 * TICKET-EMAIL-002 — Shared React Email foundation.
 *
 * Owns the brand chrome: dark page background, the card, the gradient header
 * strip (logo + wordmark), and the centered footer. Templates render their copy
 * as `children`. All styling comes from emails/brand/tokens.js — never hardcode.
 *
 * Deno-compatible: imports only @react-email/components + local brand tokens.
 */
import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { brand } from '../brand/tokens.js';

export function VibezLayout({ preview, children }) {
  return (
    <Html lang="en">
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: brand.color.pageBg,
          fontFamily: brand.font,
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            width: '100%',
            margin: '40px auto 56px',
            backgroundColor: brand.color.cardBg,
            borderRadius: '20px',
          }}
        >
          {/* Header strip */}
          <Section
            style={{
              background: brand.color.headerGradient,
              backgroundColor: brand.color.headerBgFallback,
              padding: '20px 28px',
              borderRadius: '20px 20px 0 0',
            }}
          >
            <Row>
              <Column style={{ width: '58px' }}>
                <Img
                  src={brand.logoUrl}
                  alt={brand.name}
                  width="48"
                  height="48"
                  style={{ display: 'block', border: 0, borderRadius: '10px' }}
                />
              </Column>
              <Column style={{ paddingLeft: '10px' }}>
                <Text
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: brand.color.textStrong,
                    letterSpacing: '-0.3px',
                  }}
                >
                  {brand.name}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Body — template content */}
          <Section style={{ padding: '36px 32px 28px' }}>{children}</Section>

          {/* Footer */}
          <Section
            style={{
              padding: '14px 32px 28px',
              borderTop: `1px solid ${brand.color.footerBorder}`,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: '12px',
                color: brand.color.textFooter,
                textAlign: 'center',
              }}
            >
              {'—'} {brand.name}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default VibezLayout;

// Public Contact / Support page for Vibez Citizens + Traze.
// Self-contained (Traffic is isolated — no imports from apps/VCSM).
// Static UI only: no forms, no client interactivity, no backend.
// Reuses the shared legal-page shell + contact card styles
// (src/styles/pages/terms.css + src/styles/pages/contact.css) so it matches
// the existing dark theme, spacing, and gradient system.
//
// Legal/support copy is maintained in English. The `locale` prop only controls
// the localized notice banner; the body copy below stays in English.

import Link from "next/link";

const CONTACT_EMAIL = "contact@vibezcitizens.com";
const SUPPORT_EMAIL = "support@vibezcitizens.com";
const PRIVACY_EMAIL = "privacy@vibezcitizens.com";
const REPORT_EMAIL = "report@vibezcitizens.com";

const LOCALIZED_NOTICE = {
  es: "Aviso: esta página de contacto se mantiene en inglés. La versión en inglés es la versión oficial. Una traducción al español está pendiente de revisión.",
};

export default function ContactScreen({ locale = "en" }) {
  const notice = LOCALIZED_NOTICE[locale];

  return (
    <div className="legal-page">
      <article className="legal-doc">
        <header className="legal-doc__header">
          <p className="legal-doc__kicker">Vibez Citizens / Traze</p>
          <h1 className="legal-doc__title">Contact and Support</h1>
          <p className="legal-doc__meta">
            Reach the right team below. We respond by email; the Platform does not
            offer phone support.
          </p>
        </header>

        {notice ? (
          <p className="legal-doc__notice" lang="es">
            {notice}
          </p>
        ) : null}

        <section className="contact-grid" aria-label="Contact options">
          <article className="contact-card">
            <h2 className="contact-card__title">Support and General Inquiries</h2>
            <p className="contact-card__desc">
              Questions about the Platform, directory discovery, questions and answers,
              or general help.
            </p>
            <a className="contact-card__email" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            <p className="contact-card__sla">
              <span className="contact-card__sla-label">Typical response</span>
              24&ndash;48 hours
            </p>
          </article>

          <article className="contact-card">
            <h2 className="contact-card__title">Privacy Requests</h2>
            <p className="contact-card__desc">
              Requests to access, correct, or delete information, or other
              privacy-related questions. See our{" "}
              <Link href="/privacy">Privacy Policy</Link> for details.
            </p>
            <a className="contact-card__email" href={`mailto:${PRIVACY_EMAIL}`}>
              {PRIVACY_EMAIL}
            </a>
            <p className="contact-card__sla">
              <span className="contact-card__sla-label">Typical response</span>
              3&ndash;10 business days
            </p>
          </article>

          <article className="contact-card">
            <h2 className="contact-card__title">Reports and Abuse</h2>
            <p className="contact-card__desc">
              Report listings, content, or activity that may violate our{" "}
              <Link href="/terms">Terms of Use</Link>, including safety or fraud
              concerns.
            </p>
            <a className="contact-card__email" href={`mailto:${REPORT_EMAIL}`}>
              {REPORT_EMAIL}
            </a>
            <p className="contact-card__sla">
              <span className="contact-card__sla-label">Typical response</span>
              Reviewed as soon as reasonably possible
            </p>
          </article>

          <article className="contact-card">
            <h2 className="contact-card__title">Business Listing Corrections</h2>
            <p className="contact-card__desc">For business owners and representatives:</p>
            <ul className="contact-card__list">
              <li>listing corrections;</li>
              <li>listing removal requests;</li>
              <li>business ownership verification;</li>
              <li>claimed listing disputes.</li>
            </ul>
            <a className="contact-card__email" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </article>
        </section>

        <div className="contact-legal">
          <p className="contact-legal__notice">
            By contacting Vibez Citizens, you agree that we may use the information you
            provide to respond to your inquiry in accordance with our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
          <p className="contact-legal__links">
            <Link href="/privacy">Privacy Policy</Link>
            <span className="contact-legal__sep" aria-hidden="true">
              ·
            </span>
            <Link href="/terms">Terms of Use</Link>
          </p>
        </div>
      </article>
    </div>
  );
}

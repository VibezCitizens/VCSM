// Public Privacy Policy for Vibez Citizens + Traze.
// Self-contained (Traffic is isolated — no imports from apps/VCSM).
// Reuses the shared legal-page / legal-doc styles (src/styles/pages/terms.css)
// so it matches the Terms of Use page layout, typography, and dark theme.
//
// Legal copy is maintained in English. The `locale` prop only controls the
// localized notice banner; the binding legal text below stays in English.
//
// TODO(legal-i18n): A reviewed Spanish translation of this document is pending.
// Until legal sign-off, the /es/privacy route renders this English text with a
// Spanish notice. Do not auto-translate legal copy — replace this with a
// reviewed `PrivacyContentEs` only after legal approval.

import Link from "next/link";

const LAST_UPDATED = "June 23, 2026";

const LOCALIZED_NOTICE = {
  es: "Aviso: esta página de Política de privacidad se mantiene en inglés. La versión en inglés es la versión oficial y vinculante. Una traducción al español está pendiente de revisión legal.",
};

export default function PrivacyScreen({ locale = "en" }) {
  const notice = LOCALIZED_NOTICE[locale];

  return (
    <div className="legal-page">
      <article className="legal-doc">
        <header className="legal-doc__header">
          <p className="legal-doc__kicker">Vibez Citizens / Traze</p>
          <h1 className="legal-doc__title">Vibez Citizens / Traze Privacy Policy</h1>
          <p className="legal-doc__meta">Last updated: {LAST_UPDATED}</p>
        </header>

        {notice ? (
          <p className="legal-doc__notice" lang="es">
            {notice}
          </p>
        ) : null}

        <div className="legal-doc__body">
          <p>
            This Privacy Policy explains how Vibez Citizens handles information in
            connection with the Vibez Citizens platform and the Traze local services
            directory, including our websites, public listing pages, provider discovery
            features, questions and answers, and related services (collectively, the
            &ldquo;Platform&rdquo;). This Privacy Policy forms part of, and should be read
            together with, the{" "}
            <Link href="/terms">Vibez Citizens / Traze Terms of Use</Link>.
          </p>

          <h2>1. Introduction</h2>
          <p>
            Vibez Citizens operates Traze, a public local services directory and discovery
            layer that helps people find local businesses, service providers, guides, and
            answers. Your privacy matters to us. This Privacy Policy describes the types of
            information that may be collected, how that information may be used, and the
            choices available to you when you use the Platform.
          </p>
          <p>
            Browsing public Traze directory pages does not require an account. Some
            features, such as submitting a question, sending a provider contact request,
            or claiming a listing, involve information you choose to provide.
          </p>

          <h2>2. Information You Provide</h2>
          <p>
            When you choose to use certain features, you may provide information directly
            to us. Depending on the feature, this may include:
          </p>
          <ul>
            <li>your name;</li>
            <li>your email address;</li>
            <li>your phone number;</li>
            <li>messages you send to a provider through a contact request;</li>
            <li>questions you submit;</li>
            <li>answers you submit;</li>
            <li>information included in a claim-profile request.</li>
          </ul>
          <p>
            You decide whether to provide this information. If you do not wish to share it,
            you can avoid using the related feature.
          </p>

          <h2>3. Directory Listings</h2>
          <p>
            Traze publishes directory listings for local businesses and service providers.
            You understand and agree that:
          </p>
          <ul>
            <li>
              public business information may be sourced from publicly available
              information or third-party data sources, and may be aggregated, normalized,
              categorized, or organized into directory listings;
            </li>
            <li>
              a listing may remain unclaimed until a business owner or authorized
              representative claims it;
            </li>
            <li>
              businesses may request corrections, updates, claims, restriction, or review
              of a listing through the channels Vibez Citizens provides.
            </li>
          </ul>

          <h2>4. Provider Contact Requests</h2>
          <p>
            When you contact a provider or submit a booking request through the Platform,
            the information you submit &mdash; which may include your name, email address,
            phone number, and message &mdash; may be shared with the selected provider so
            that they can respond to your inquiry.
          </p>
          <p>
            Once your information is shared with a provider, that provider handles it
            independently. Vibez Citizens is not responsible for a provider&rsquo;s
            independent collection, use, retention, or disclosure of information after it is
            shared with them.
          </p>

          <h2>5. Questions and Answers</h2>
          <p>
            Traze may allow you to submit questions and answers. You understand and agree
            that:
          </p>
          <ul>
            <li>
              submitted questions and answers may be reviewed or moderated before
              publication;
            </li>
            <li>
              content that is published becomes publicly visible and may be indexed or
              cached by search engines and other third parties;
            </li>
            <li>
              you should not include sensitive personal information in content you submit
              for public display.
            </li>
          </ul>
          <p>
            If you provide a private email address when submitting a question or answer so
            we can follow up with you, that address is not displayed publicly on Traze.
          </p>

          <h2>6. Location Information</h2>
          <p>
            Some discovery features can use your approximate location to help you find
            nearby services. Location access is optional and requires your browser&rsquo;s
            permission, which you can grant or deny. If you choose to use this feature, your
            device&rsquo;s location may be processed to identify nearby listings, and a
            location preference may be saved in your browser so the Platform can remember
            your selected area. You can deny or revoke location access at any time through
            your browser settings.
          </p>

          <h2>7. Technical Information</h2>
          <p>
            Where necessary to operate and secure the Platform, technical information may be
            collected or processed, such as:
          </p>
          <ul>
            <li>browser type;</li>
            <li>device type;</li>
            <li>language preferences;</li>
            <li>basic diagnostic information.</li>
          </ul>
          <p>
            This information is used to help deliver, maintain, and protect the Platform.
          </p>

          <h2>8. Cookies and Local Storage</h2>
          <p>
            The Platform may use local storage and similar technologies, where applicable,
            to support its functionality. This may include storing:
          </p>
          <ul>
            <li>language preferences;</li>
            <li>region or location preferences;</li>
            <li>session or display preferences.</li>
          </ul>
          <p>
            If optional analytics are enabled, analytics or measurement technologies may
            also be used to understand general usage of the Platform. The Platform does not
            use advertising cookies.
          </p>

          <h2>9. How Information Is Used</h2>
          <p>Information may be used to:</p>
          <ul>
            <li>operate, provide, and maintain the Platform;</li>
            <li>process and respond to requests, including provider contact requests;</li>
            <li>improve discovery and directory features;</li>
            <li>detect, prevent, and address spam, fraud, or abuse;</li>
            <li>maintain the security and integrity of the Platform;</li>
            <li>respond to your inquiries and communicate with you;</li>
            <li>comply with legal obligations.</li>
          </ul>

          <h2>10. Information Sharing</h2>
          <p>Information may be shared:</p>
          <ul>
            <li>
              with providers you choose to contact, so they can respond to your request;
            </li>
            <li>
              with service providers and infrastructure partners that support the
              operation of the Platform, such as hosting, storage, and communication
              services, where applicable;
            </li>
            <li>
              where required by law, legal process, or to protect the rights, safety, and
              integrity of users, businesses, or the Platform.
            </li>
          </ul>
          <p>Vibez Citizens does not sell personal information.</p>

          <h2>11. Data Retention</h2>
          <p>
            Information may be retained for as long as reasonably necessary to operate the
            Platform, process and respond to requests, resolve disputes, prevent abuse, and
            meet legal obligations. Some information or public content may be retained
            longer where it originates from public or third-party sources, or where its
            retention is necessary to maintain the integrity of the Platform. We do not
            guarantee specific deletion timelines, and some removals may take time to
            process across our systems and any third-party caches.
          </p>

          <h2>12. Your Choices</h2>
          <p>You have choices about your information. You may:</p>
          <ul>
            <li>choose not to submit forms or optional information;</li>
            <li>deny or revoke location access through your browser;</li>
            <li>request corrections or updates to information;</li>
            <li>request deletion of your account, where you have one;</li>
            <li>request review or removal of public content, where applicable.</li>
          </ul>
          <p>
            To make a request, contact us using the details in the Contact section. We may
            need to verify your identity or authority before acting on a request, and some
            information may be retained as described in the Data Retention section.
          </p>

          <h2>13. Security</h2>
          <p>
            We use reasonable technical and organizational measures designed to protect
            information against unauthorized access, loss, or misuse. However, no method of
            transmission or storage is completely secure, and we cannot guarantee absolute
            security.
          </p>

          <h2>14. Children&rsquo;s Privacy</h2>
          <p>
            The Platform is not intended for children under 18, and accounts on the Vibez
            Citizens platform require you to be at least 18 years old. We do not knowingly
            collect personal information from children under 18.
          </p>

          <h2>15. International Access</h2>
          <p>
            The Platform may be accessed from different countries and regions. By using the
            Platform, you understand that information may be processed in locations that may
            have different data protection laws than those in your country of residence.
          </p>

          <h2>16. Changes to this Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we may update
            the effective date and, where appropriate, provide notice through the Platform
            or by other reasonable means. Your continued use of the Platform after an
            updated Privacy Policy becomes effective means you acknowledge the updated
            Privacy Policy.
          </p>

          <h2>17. Contact</h2>
          <p>
            For questions about this Privacy Policy, or to make a privacy-related request,
            contact:
          </p>
          <p>
            Vibez Citizens
            <br />
            <a href="mailto:support@vibezcitizens.com">support@vibezcitizens.com</a>
          </p>
        </div>
      </article>
    </div>
  );
}

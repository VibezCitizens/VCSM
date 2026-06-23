// Public Terms of Use for Vibez Citizens + Traze.
// Self-contained (Traffic is isolated — no imports from apps/VCSM).
// Legal copy is maintained in English. The `locale` prop only controls the
// localized notice banner; the binding legal text below stays in English.
//
// TODO(legal-i18n): A reviewed Spanish translation of this document is pending.
// Until legal sign-off, the /es/terms route renders this English text with a
// Spanish notice. Do not auto-translate legal copy — replace this with a
// reviewed `TermsContentEs` only after legal approval.

const LAST_UPDATED = "June 23, 2026";

const LOCALIZED_NOTICE = {
  es: "Aviso: esta página de Términos de uso se mantiene en inglés. La versión en inglés es la versión oficial y vinculante. Una traducción al español está pendiente de revisión legal.",
};

export default function TermsScreen({ locale = "en" }) {
  const notice = LOCALIZED_NOTICE[locale];

  return (
    <div className="legal-page">
      <article className="legal-doc">
        <header className="legal-doc__header">
          <p className="legal-doc__kicker">Vibez Citizens / Traze</p>
          <h1 className="legal-doc__title">Vibez Citizens / Traze Terms of Use</h1>
          <p className="legal-doc__meta">Last updated: {LAST_UPDATED}</p>
        </header>

        {notice ? (
          <p className="legal-doc__notice" lang="es">
            {notice}
          </p>
        ) : null}

        <div className="legal-doc__body">
          <p>
            Welcome to Vibez Citizens. These Terms of Use (&ldquo;Terms&rdquo;) govern
            your access to and use of the Vibez Citizens platform and the Traze local
            services directory, including our websites, applications, public listing
            pages, discovery features, questions and answers, and related services
            (collectively, the &ldquo;Platform&rdquo;).
          </p>
          <p>
            By accessing or using the Platform, including any Traze directory page,
            you agree to be bound by these Terms. If you do not agree, do not use the
            Platform.
          </p>

          <h2>1. About Vibez Citizens and Traze</h2>
          <p>
            Vibez Citizens is a digital platform that allows users to create profiles,
            share content, discover local businesses and service providers, manage
            business listings, make booking requests, and access related social and
            marketplace features.
          </p>
          <p>
            Traze is operated by Vibez Citizens. Traze is a local services directory
            and public discovery layer that helps people find local businesses,
            service providers, guides, and answers. Traze pages may link back to the
            Vibez Citizens platform for booking, claiming, and account features.
          </p>

          <h2>2. Traze Directory Listings</h2>
          <p>
            Traze publishes directory listings for local businesses and service
            providers. You understand and agree that:
          </p>
          <ul>
            <li>
              some listings may be created by Vibez Citizens from publicly available
              information, third-party data sources, or user contributions, and not
              directly by the business owner;
            </li>
            <li>
              listing information such as business name, location, category, contact
              details, and general service descriptions may be derived from public or
              third-party data and may not always be current or complete;
            </li>
            <li>
              a listing may remain unclaimed until a business owner or authorized
              representative claims it;
            </li>
            <li>
              businesses may claim, update, correct, or request removal or restriction
              of their listing through the channels Vibez Citizens provides;
            </li>
            <li>
              inclusion of a business on Traze does not imply endorsement, affiliation,
              or partnership unless explicitly stated.
            </li>
          </ul>
          <p>
            Vibez Citizens may, at its discretion, update, correct, restrict, or remove
            listings based on verified requests, legal obligations, or platform
            policies.
          </p>

          <h2>3. No Guarantee of Providers or Services</h2>
          <p>
            Vibez Citizens is a directory and platform provider, not the provider of
            the underlying goods or services offered by listed businesses. Vibez
            Citizens does not independently guarantee, and is not responsible for, the:
          </p>
          <ul>
            <li>identity of any business or service provider;</li>
            <li>licensing, certifications, or qualifications of any provider;</li>
            <li>pricing, rates, or fees;</li>
            <li>availability, hours, or responsiveness;</li>
            <li>quality, legality, or safety of any service performed.</li>
          </ul>
          <p>
            Any transaction, appointment, booking, or interaction between a user and a
            business or service provider is solely between those parties. You are
            responsible for verifying a provider&rsquo;s suitability before engaging
            them.
          </p>

          <h2>4. Questions and Answers</h2>
          <p>
            Traze may allow users to submit questions and may publish answers,
            including answers contributed by experts or providers. You understand and
            agree that:
          </p>
          <ul>
            <li>
              questions and answers are provided for general informational purposes
              only;
            </li>
            <li>
              expert answers do not replace professional, legal, emergency, security,
              financial, medical, or other licensed advice, and should not be relied
              on as a substitute for consulting a qualified professional;
            </li>
            <li>
              user-submitted questions and answers may be moderated, rejected, edited
              for formatting, archived, or removed at our discretion;
            </li>
            <li>
              answers reflect the views of their authors and do not represent the
              views of Vibez Citizens unless explicitly stated.
            </li>
          </ul>
          <p>
            When submitting a question or answer, you may be asked to provide a private
            email address so we can follow up with you. Private submitter email
            addresses collected for follow-up are not displayed publicly on Traze.
          </p>

          <h2>5. Promotional Placements and Featured Listings</h2>
          <p>
            Traze may display provider profile links, business spotlights, featured
            listings, and promotional placements. These placements may appear
            alongside organic directory results and may be highlighted visually.
            Placement on Traze does not by itself indicate a guarantee, endorsement,
            or verification of a provider.
          </p>

          <h2>6. Public Listings and Search Engines</h2>
          <p>
            Traze is a public discovery layer. Listing pages and public directory
            content are intended to be publicly accessible and may be indexed, cached,
            or displayed by search engines and other third parties. Content you submit
            for public display may therefore appear in search results and persist in
            third-party caches for some period.
          </p>

          <h2>7. Eligibility</h2>
          <p>
            You must be at least 18 years old to create or use an account on the Vibez
            Citizens platform. By creating an account, you represent that you are at
            least 18 years old and legally able to enter into these Terms. Browsing
            public Traze directory pages does not require an account.
          </p>

          <h2>8. Claiming and Operating a Listing</h2>
          <p>
            If you claim, create, manage, or operate a business listing, you represent
            and warrant that:
          </p>
          <ul>
            <li>
              you are authorized to act on behalf of that business, brand,
              organization, or service provider;
            </li>
            <li>the listing information you provide is accurate and not misleading;</li>
            <li>
              you will keep listing details, pricing, service details, and contact
              information reasonably up to date.
            </li>
          </ul>
          <p>
            We may remove, restrict, suspend, or disable listings that are inaccurate,
            misleading, fraudulent, impersonating others, or otherwise in violation of
            these Terms.
          </p>

          <h2>9. User Content</h2>
          <p>
            The Platform may allow you to submit content, including questions, answers,
            listing details, and related contributions. You retain ownership of the
            content you create, subject to the rights you grant us under these Terms.
          </p>
          <p>
            By submitting or making content available through the Platform, you grant
            Vibez Citizens a worldwide, non-exclusive, royalty-free, transferable,
            sublicensable license to host, store, reproduce, modify for technical
            formatting, display, distribute, and otherwise use that content as
            necessary to operate, improve, secure, promote, and provide the Platform,
            including Traze.
          </p>

          <h2>10. Prohibited Conduct</h2>
          <p>You may not use the Platform to:</p>
          <ul>
            <li>violate any law or regulation;</li>
            <li>harass, threaten, abuse, or intimidate others;</li>
            <li>impersonate a person, business, organization, or brand;</li>
            <li>create fake listings, fake accounts, or deceptive business pages;</li>
            <li>submit false, manipulated, retaliatory, or misleading content;</li>
            <li>scrape or harvest data from the Platform without authorization;</li>
            <li>upload malware, malicious code, or harmful files;</li>
            <li>attempt unauthorized access to accounts, systems, or data;</li>
            <li>interfere with Platform integrity, performance, or security.</li>
          </ul>

          <h2>11. Content Moderation and Enforcement</h2>
          <p>
            Vibez Citizens may, but is not obligated to, monitor, review, moderate,
            remove, restrict, or disable content, listings, questions, answers, or
            access to the Platform. We may take these actions, with or without prior
            notice where appropriate, to protect users, businesses, or the Platform, or
            to comply with the law.
          </p>

          <h2>12. Third-Party Services</h2>
          <p>
            The Platform may rely on third-party services and infrastructure, including
            hosting, storage, analytics, mapping, and media delivery. Your use of some
            features may also be subject to third-party terms and policies. Vibez
            Citizens is not responsible for the performance or independent actions of
            third-party providers except as required by law.
          </p>

          <h2>13. Intellectual Property</h2>
          <p>
            The Platform, including its software, branding, designs, features,
            interfaces, and logos, is owned by Vibez Citizens or its licensors and is
            protected by applicable intellectual property laws. Except as expressly
            allowed in writing, you may not copy, modify, distribute, reverse engineer,
            scrape, or create derivative works from the Platform or its protected
            materials.
          </p>

          <h2>14. Disclaimers</h2>
          <p>
            The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; basis. To the maximum extent permitted by law, Vibez
            Citizens disclaims all warranties, express or implied, including warranties
            of merchantability, fitness for a particular purpose, non-infringement,
            availability, and accuracy. We do not warrant that listings are accurate or
            lawful, that providers are licensed, qualified, safe, or available, or that
            directory information based on public or third-party data reflects
            real-time or owner-verified information.
          </p>

          <h2>15. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Vibez Citizens and its operators,
            affiliates, licensors, service providers, officers, employees, and agents
            will not be liable for any indirect, incidental, special, consequential,
            exemplary, or punitive damages, or for any loss of profits, revenue,
            goodwill, or data, arising out of or related to your use of the Platform,
            directory listings, questions and answers, or interactions with providers.
          </p>

          <h2>16. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. When we do, we may update the
            effective date and, where appropriate, provide notice through the Platform
            or by other reasonable means. Your continued use of the Platform after
            updated Terms become effective means you agree to the revised Terms.
          </p>

          <h2>17. Contact</h2>
          <p>
            For questions about these Terms, to claim a listing, or to request a
            correction or removal, contact:
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

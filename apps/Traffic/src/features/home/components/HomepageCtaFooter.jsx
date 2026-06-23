"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";

export default function HomepageCtaFooter({ claimHref, mainPlatformHref, directoryHref = "/categories" }) {
  const { t } = useTrafficLanguage();

  return (
    <>
      <section className="homepage-section homepage-section--divider homepage-cta-panel homepage-directory-surface" id="provider-cta">
        <h2 className="homepage-claim-title">
          {t("homepage.claimTitle")}
        </h2>
        <p className="homepage-hero-copy">{t("homepage.claimBody")}</p>
        <div className="homepage-cta-row">
          <a className="pill pill--primary pill--strong" href={claimHref} target="_blank" rel="noreferrer">
            {t("homepage.startListing")}
          </a>
          <a className="pill pill--ghost" href={mainPlatformHref} target="_blank" rel="noreferrer">
            {t("homepage.openVc")}
          </a>
        </div>
      </section>

      <footer className="homepage-footer">
        <div className="homepage-footer-top">
          <div className="homepage-footer-brand">
            <p className="homepage-footer-name">TRAZE</p>
            <p className="homepage-footer-powered">
              {t("homepage.poweredByVc")}
            </p>
          </div>

          <nav className="homepage-footer-links" aria-label="Footer">
            <a className="homepage-footer-link" href={mainPlatformHref} target="_blank" rel="noreferrer">
              Vibez Citizens
            </a>
            <Link className="homepage-footer-link" href={directoryHref}>
              {t("shell.nav.directory")}
            </Link>
            <Link className="homepage-footer-link" href="/sitemap-index.xml">
              Sitemap
            </Link>
            <a className="homepage-footer-link homepage-footer-link--strong" href={claimHref} target="_blank" rel="noreferrer">
              {t("shell.claimProfile")}
            </a>
            <Link className="homepage-footer-link" href="/terms">
              {t("homepage.terms")}
            </Link>
          </nav>
        </div>

        <p className="homepage-footer-disclaimer">
          {t("homepage.footerDisclaimerPrefix")} <a href={claimHref} target="_blank" rel="noreferrer">{t("homepage.footerDisclaimerLink")}</a>{t("homepage.footerDisclaimerSuffix")}
        </p>
      </footer>
    </>
  );
}

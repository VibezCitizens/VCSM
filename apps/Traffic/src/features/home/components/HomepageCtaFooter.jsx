"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";

export default function HomepageCtaFooter({ claimHref, mainPlatformHref }) {
  const { lang } = useTrafficLanguage();

  return (
    <>
      <section className="homepage-section homepage-section--divider homepage-cta-panel homepage-directory-surface" id="provider-cta">
        <h2 className="homepage-claim-title">
          {lang === "es" ? "Hazte visible. Recibe reservas." : "Get discovered. Get booked."}
        </h2>
        <p className="homepage-hero-copy">
          {lang === "es"
            ? "Publica tu negocio, muestra disponibilidad y acepta reservas de clientes locales."
            : "Publish your business, show availability, and accept bookings from local customers."}
        </p>
        <div className="homepage-cta-row">
          <a className="pill pill--primary pill--strong" href={claimHref} target="_blank" rel="noreferrer">
            {lang === "es" ? "Publicar negocio" : "Start listing"}
          </a>
          <a className="pill pill--ghost" href={mainPlatformHref} target="_blank" rel="noreferrer">
            {lang === "es" ? "Abrir Vibez Citizens" : "Open Vibez Citizens"}
          </a>
        </div>
      </section>

      <footer className="homepage-footer">
        <div className="homepage-footer-brand">
          <p className="homepage-footer-name">TRAZE</p>
          <p className="homepage-footer-powered">
            {lang === "es" ? "Impulsado por Vibez Citizens" : "Powered by Vibez Citizens"}
          </p>
        </div>

        <div className="homepage-footer-links">
          <a className="homepage-footer-link" href={mainPlatformHref} target="_blank" rel="noreferrer">
            Vibez Citizens
          </a>
          <Link className="homepage-footer-link" href="/us">
            {lang === "es" ? "Directorio" : "Directory"}
          </Link>
          <Link className="homepage-footer-link" href="/sitemap-index.xml">
            {lang === "es" ? "Mapa del sitio" : "Sitemap"}
          </Link>
          <a className="homepage-footer-link homepage-footer-link--strong" href={claimHref} target="_blank" rel="noreferrer">
            {lang === "es" ? "Reclamar perfil" : "Claim Profile"}
          </a>
        </div>
      </footer>
    </>
  );
}

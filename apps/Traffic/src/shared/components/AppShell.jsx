"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPlatformOrigin } from "@/lib/env";
import { initAnalytics, trackPageView } from "@/lib/analytics";
import { LanguageProvider, useTrafficLanguage } from "@/lib/language";

function claimHref() {
  try {
    const url = new URL("/claim-profile", getPlatformOrigin());
    url.searchParams.set("source", "traffic");
    url.searchParams.set("surface", "header");
    return url.toString();
  } catch {
    return "/claim-profile";
  }
}

const NAV_LINKS = [
  { labelEn: "Home",             labelEs: "Inicio",              href: "/" },
  { labelEn: "Directory",        labelEs: "Directorio",          href: "/us" },
  { labelEn: "Categories",       labelEs: "Categorías",          href: "/#categories" },
  { labelEn: "Top Providers",    labelEs: "Mejores Proveedores", href: "/#top-providers" },
];

// ─── Inner shell — consumes LanguageContext ────────────────────────────────────

function ShellInner({ children }) {
  const pathname = usePathname();
  const { lang, setLang } = useTrafficLanguage();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return (
    <>
      <header className="traffic-shell-header">
        <div className="traffic-shell-inner">
          <div className="traffic-shell-brand-wrap">
            <Link className="traffic-shell-brand" href="/">
              TRAZE
            </Link>
            <span className="traffic-shell-subtitle">
              {lang === "es" ? "Directorio de Servicios Locales" : "Local Services Directory"}
            </span>
          </div>

          <nav className="traffic-shell-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href.replace("#", ""));
              const label = lang === "es" ? link.labelEs : link.labelEn;
              return (
                <Link
                  key={link.href}
                  className={`traffic-shell-link${isActive ? " traffic-shell-link--active" : ""}`}
                  href={link.href}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="traffic-lang-toggle" role="group" aria-label="Language">
            <button
              type="button"
              className={`traffic-lang-btn${lang === "en" ? " traffic-lang-btn--active" : ""}`}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              type="button"
              className={`traffic-lang-btn${lang === "es" ? " traffic-lang-btn--active" : ""}`}
              onClick={() => setLang("es")}
              aria-pressed={lang === "es"}
            >
              ES
            </button>
          </div>

          <a
            className="traffic-shell-cta-btn"
            href={claimHref()}
            target="_blank"
            rel="noreferrer"
          >
            {lang === "es" ? "Reclamar perfil" : "Claim Profile"}
          </a>
        </div>
      </header>
      {children}
    </>
  );
}

// ─── Public export — wraps everything in LanguageProvider ─────────────────────

export function AppShell({ children }) {
  return (
    <LanguageProvider>
      <ShellInner>{children}</ShellInner>
    </LanguageProvider>
  );
}

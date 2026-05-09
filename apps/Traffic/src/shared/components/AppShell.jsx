"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getPlatformOrigin } from "@/lib/env";
import { initAnalytics, trackPageView } from "@/lib/analytics";
import { LanguageProvider, useTrafficLanguage } from "@/lib/language";
import { localeFromPathname, switchLocalePath, withLocale } from "@/lib/i18n";
import {
  readStoredTrazeLocation,
  TRAZE_LOCATION_CHANGE_EVENT,
  validateStoredTrazeLocation
} from "@/lib/trazeLocationStorage";

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
  { labelKey: "shell.nav.home", key: "home" },
  { labelKey: "shell.nav.directory", key: "directory" },
  { labelKey: "shell.nav.categories", key: "categories" },
];

// ─── Inner shell — consumes LanguageContext ────────────────────────────────────

function ShellInner({ children, countryOptions = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useTrafficLanguage();
  const [navHrefs, setNavHrefs] = useState({
    directory: "/directory",
    categories: "/categories",
    "top-providers": "/top-providers"
  });

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    const routeLocale = localeFromPathname(pathname);
    if (routeLocale && routeLocale !== lang) {
      setLang(routeLocale);
    }
  }, [pathname, lang, setLang]);

  useEffect(() => {
    function syncNavHrefs(event) {
      const stored = validateStoredTrazeLocation(event?.detail ?? readStoredTrazeLocation(), {
        countryOptions,
        locationOptions: []
      });
      const cs = stored?.countrySlug ?? null;
      setNavHrefs({
        directory: cs ? `/${cs}` : "/directory",
        categories: cs ? `/${cs}/categories` : "/categories",
        "top-providers": cs ? `/${cs}/top-providers` : "/top-providers"
      });
    }

    syncNavHrefs();
    window.addEventListener("storage", syncNavHrefs);
    window.addEventListener(TRAZE_LOCATION_CHANGE_EVENT, syncNavHrefs);

    return () => {
      window.removeEventListener("storage", syncNavHrefs);
      window.removeEventListener(TRAZE_LOCATION_CHANGE_EVENT, syncNavHrefs);
    };
  }, [countryOptions]);

  return (
    <>
      <header className="traffic-shell-header">
        <div className="traffic-shell-inner">
          <div className="traffic-shell-brand-wrap">
            <Link className="traffic-shell-brand" href={withLocale("/", lang)}>
              TRAZE
            </Link>
            <span className="traffic-shell-subtitle">
              {t("shell.subtitle")}
            </span>
          </div>

          <nav className="traffic-shell-nav" aria-label={t("shell.nav.directory")}>
            {NAV_LINKS.map((link) => {
              const rawHref = link.key === "home" ? "/" : navHrefs[link.key];
              const href = withLocale(rawHref, lang);
              const isActive =
                link.key === "home"
                  ? pathname === "/" || pathname === `/${lang}`
                  : link.key === "directory"
                    ? pathname === href || pathname === "/directory" || pathname.endsWith("/directory")
                    : pathname.endsWith(`/${link.key}`) || pathname === `/${link.key}`;
              return (
                <Link
                  key={link.key}
                  className={`traffic-shell-link${isActive ? " traffic-shell-link--active" : ""}`}
                  href={href}
                >
                  {t(link.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="traffic-lang-toggle" role="group" aria-label={t("common.language")}>
            <button
              type="button"
              className={`traffic-lang-btn${lang === "en" ? " traffic-lang-btn--active" : ""}`}
              onClick={() => {
                setLang("en");
                router.push(switchLocalePath(pathname, "en"));
              }}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              type="button"
              className={`traffic-lang-btn${lang === "es" ? " traffic-lang-btn--active" : ""}`}
              onClick={() => {
                setLang("es");
                router.push(switchLocalePath(pathname, "es"));
              }}
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
            {t("shell.claimProfile")}
          </a>
        </div>
      </header>
      {children}
    </>
  );
}

// ─── Public export — wraps everything in LanguageProvider ─────────────────────

export function AppShell({ children, countryOptions = [] }) {
  return (
    <LanguageProvider>
      <ShellInner countryOptions={countryOptions}>{children}</ShellInner>
    </LanguageProvider>
  );
}

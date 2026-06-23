"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  Grid3X3,
  Home,
  Languages,
  MapPinned,
  Menu,
  MessageCircleQuestion,
  Settings,
  UsersRound,
  X
} from "lucide-react";
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
  { labelKey: "shell.nav.home", key: "home", Icon: Home },
  { labelKey: "shell.nav.directory", key: "directory", Icon: MapPinned },
  { labelKey: "shell.nav.categories", key: "categories", Icon: Grid3X3 },
  { labelKey: "shell.nav.answers", key: "answers", Icon: MessageCircleQuestion },
  { labelKey: "shell.nav.providers", key: "top-providers", Icon: UsersRound },
  { labelKey: "shell.nav.settings", key: "settings", Icon: Settings, external: true },
];

// ─── Inner shell — consumes LanguageContext ────────────────────────────────────

function getRawHref(link, navHrefs) {
  if (link.key === "home") return "/";
  if (link.key === "settings") return "/settings";
  return navHrefs[link.key];
}

function isLinkActive({ link, href, pathname, lang }) {
  if (link.external) return false;
  if (link.key === "home") return pathname === "/" || pathname === `/${lang}`;
  if (link.key === "directory") {
    return pathname === href || pathname === "/directory" || pathname.endsWith("/directory");
  }
  return pathname === href || pathname.endsWith(`/${link.key}`) || pathname === `/${link.key}`;
}

function LanguageToggle({ lang, setLang, pathname, router, t, compact = false }) {
  return (
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
        {compact ? "EN" : "English"}
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
        {compact ? "ES" : "Español"}
      </button>
    </div>
  );
}

function DesktopNavigation({ navHrefs, pathname, lang, t }) {
  return (
    <nav className="traffic-desktop-nav" aria-label={t("shell.drawer.label")}>
      {NAV_LINKS.filter((link) => ["home", "directory", "categories", "answers"].includes(link.key)).map((link) => {
        const rawHref = getRawHref(link, navHrefs);
        const href = withLocale(rawHref, lang);
        const active = isLinkActive({ link, href, pathname, lang });
        return (
          <Link key={link.key} className={`traffic-desktop-link${active ? " traffic-desktop-link--active" : ""}`} href={href}>
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

function TrafficDrawer({ open, onClose, navHrefs, pathname, lang, setLang, router, t }) {
  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.classList.add("traffic-drawer-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("traffic-drawer-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div className={`traffic-drawer-layer${open ? " traffic-drawer-layer--open" : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className="traffic-drawer-scrim"
        aria-label={t("shell.drawer.close")}
        onClick={onClose}
      />
      <aside id="traffic-drawer" className="traffic-drawer" aria-label={t("shell.drawer.label")}>
        <div className="traffic-drawer-head">
          <div>
            <p className="traffic-drawer-kicker">{t("shell.subtitle")}</p>
            <strong>TRAZE</strong>
          </div>
          <button type="button" className="traffic-icon-btn" aria-label={t("shell.drawer.close")} onClick={onClose}>
            <X size={21} strokeWidth={2.2} />
          </button>
        </div>

        <nav className="traffic-drawer-nav" aria-label={t("shell.drawer.label")}>
          {NAV_LINKS.map((link) => {
            const rawHref = getRawHref(link, navHrefs);
            const href = link.external
              ? new URL(rawHref, getPlatformOrigin()).toString()
              : withLocale(rawHref, lang);
            const active = isLinkActive({ link, href, pathname, lang });
            const Icon = link.Icon;
            return (
              <Link
                key={link.key}
                className={`traffic-drawer-link${active ? " traffic-drawer-link--active" : ""}`}
                href={href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
                onClick={onClose}
              >
                <span className="traffic-drawer-link-icon">
                  <Icon size={19} strokeWidth={2.1} />
                </span>
                <span>{t(link.labelKey)}</span>
                {link.external ? <ExternalLink className="traffic-drawer-external" size={15} /> : null}
              </Link>
            );
          })}
        </nav>

        <section className="traffic-drawer-language" aria-label={t("common.language")}>
          <div className="traffic-drawer-language-label">
            <Languages size={17} />
            <span>{t("shell.nav.language")}</span>
          </div>
          <LanguageToggle lang={lang} setLang={setLang} pathname={pathname} router={router} t={t} />
        </section>

        <a className="traffic-drawer-cta" href={claimHref()} target="_blank" rel="noreferrer">
          {t("shell.claimProfile")}
          <ExternalLink size={16} />
        </a>
      </aside>
    </div>
  );
}

function ShellInner({ children, countryOptions = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useTrafficLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navHrefs, setNavHrefs] = useState({
    directory: "/directory",
    categories: "/categories",
    answers: "/answers",
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
        answers: "/answers",
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

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="traffic-shell-header">
        <div className="traffic-shell-inner">
          <Link className="traffic-shell-brand traffic-shell-brand--desktop" href={withLocale("/", lang)} aria-label="TRAZE home">
            <span>TRAZE</span>
            <small>{t("shell.subtitle")}</small>
          </Link>

          <div className="traffic-mobile-left">
            <LanguageToggle lang={lang} setLang={setLang} pathname={pathname} router={router} t={t} compact />
          </div>

          <Link className="traffic-shell-brand traffic-shell-brand--mobile" href={withLocale("/", lang)} aria-label="TRAZE home">
            <span>TRAZE</span>
          </Link>

          <DesktopNavigation navHrefs={navHrefs} pathname={pathname} lang={lang} t={t} />

          <div className="traffic-shell-actions">
            <LanguageToggle lang={lang} setLang={setLang} pathname={pathname} router={router} t={t} compact />
          </div>

          <button
            type="button"
            className="traffic-icon-btn traffic-shell-menu"
            aria-label={t("shell.drawer.open")}
            aria-expanded={drawerOpen}
            aria-controls="traffic-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>
        </div>
      </header>
      <TrafficDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navHrefs={navHrefs}
        pathname={pathname}
        lang={lang}
        setLang={setLang}
        router={router}
        t={t}
      />
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

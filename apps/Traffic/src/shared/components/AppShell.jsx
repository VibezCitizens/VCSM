"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPlatformOrigin } from "@/lib/env";
import { initAnalytics, trackPageView } from "@/lib/analytics";

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
  { label: "Home", href: "/" },
  { label: "Directory", href: "/us" },
  { label: "Categories", href: "/#categories" },
  { label: "Top Providers", href: "/#top-providers" },
];

export function AppShell({ children }) {
  const pathname = usePathname();

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
            <span className="traffic-shell-subtitle">Local Services Directory</span>
          </div>

          <nav className="traffic-shell-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href.replace("#", ""));
              return (
                <Link
                  key={link.href}
                  className={`traffic-shell-link${isActive ? " traffic-shell-link--active" : ""}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <a
            className="traffic-shell-cta-btn"
            href={claimHref()}
            target="_blank"
            rel="noreferrer"
          >
            Claim Profile
          </a>
        </div>
      </header>
      {children}
    </>
  );
}

import "./globals.css";
import { listLiveProviderCountries } from "@/data/repositories/provider.repo";
import { AppShell } from "@/shared/components/AppShell";
import TrazePublicFooter from "@/shared/components/TrazePublicFooter";
import { JsonLdScript } from "@/shared/components/JsonLdScript";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/seo/schemaOrg";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a12",
};

export const metadata = {
  title: "Traze",
  description:
    "Traze public discovery layer for country, city, locality, service, provider, guide, and review SEO pages.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://traze.vibezcitizens.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Traze",
  },
  applicationName: "Traze",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({ children }) {
  const countryOptions = listLiveProviderCountries();

  return (
    <html lang="en">
      <body className="traffic-theme">
        <JsonLdScript id="schema-organization" schema={buildOrganizationSchema()} />
        <JsonLdScript id="schema-website" schema={buildWebSiteSchema()} />
        <AppShell countryOptions={countryOptions}>
          <main>
            {children}
            <TrazePublicFooter />
          </main>
        </AppShell>
      </body>
    </html>
  );
}

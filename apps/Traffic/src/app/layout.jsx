import "@/styles/citizens-theme.css";
import "./globals.css";
import { AppShell } from "@/shared/components/AppShell";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a12",
};

export const metadata = {
  title: "TRAZE",
  description:
    "TRAZE public discovery layer for country, city, locality, service, provider, guide, and review SEO pages.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://traze.vibezcitizens.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TRAZE",
  },
  icons: {
    apple: "/icons/icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="traffic-theme">
        <AppShell>
          <main>{children}</main>
        </AppShell>
      </body>
    </html>
  );
}

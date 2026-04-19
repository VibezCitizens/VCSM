import "@/styles/citizens-theme.css";
import "./globals.css";
import { AppShell } from "@/shared/components/AppShell";

export const metadata = {
  title: "TRAZE",
  description:
    "TRAZE public discovery layer for country, city, locality, service, provider, guide, and review SEO pages.",
  metadataBase: new URL("https://traffic.vibezcitizens.com")
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

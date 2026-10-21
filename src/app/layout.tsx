import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/layout/SiteShell";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { SOCIAL_LINKS } from "@/lib/constants/social";
import { safeJsonLd } from "@/lib/utils";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  defaultOpenGraph,
  defaultTwitter,
  getSiteUrl,
} from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  // El canonical NO se define aca a nivel global: cada pagina publica declara
  // el suyo (incluida la home) para no heredar "/" en paginas sin metadata
  // propia. Open Graph y Twitter si se definen globales porque son heredables
  // y cualquier pagina sin override necesita igual un preview valido.
  title: {
    default: "Nixon Studio — Remeras Oversize",
    template: "%s | Nixon Studio",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: defaultOpenGraph(),
  twitter: defaultTwitter(),
};

function organizationJsonLd() {
  const siteUrl = getSiteUrl();
  const sameAs = [
    SOCIAL_LINKS.instagram.url,
    SOCIAL_LINKS.facebook,
    SOCIAL_LINKS.twitter,
    SOCIAL_LINKS.pinterest,
    SOCIAL_LINKS.youtube,
  ].filter((url): url is string => Boolean(url));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Nixon Studio",
        url: siteUrl,
        logo: `${siteUrl}/nixon-icon.png`,
        sameAs,
      },
      {
        "@type": "WebSite",
        url: siteUrl,
        name: "Nixon Studio",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black dark:bg-black dark:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd()) }}
        />
        <GoogleAnalytics />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}

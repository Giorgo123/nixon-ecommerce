import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/layout/SiteShell";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { SOCIAL_LINKS } from "@/lib/constants/social";
import { safeJsonLd } from "@/lib/utils";

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
  title: "Nixon Studio — Remeras Oversize",
  description: "Ecommerce Nixon Studio: remeras oversize, streetwear y dark art.",
};

function organizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nixonstudio.com.ar";
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

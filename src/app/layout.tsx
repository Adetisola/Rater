import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FEC312",
};

export const metadata: Metadata = {
  // metadataBase is required so that relative URLs in page-level metadata
  // (canonical, OG images, etc.) resolve correctly against the production domain.
  metadataBase: new URL("https://raterapp.site"),

  title: {
    // Default title for the homepage and any page that doesn't set its own.
    default: "Rater — Design Critique Studio",
    // Page-specific titles will render as: "Browse | Rater", "Post Title | Rater", etc.
    template: "%s | Rater",
  },
  description:
    "Rater is a design feedback platform where designers share their work, receive constructive critiques, and develop their visual judgment.",

  manifest: "/manifest.json",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  icons: {
    icon: [
      { url: "/icons/rater-logo-white-bg.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },

  openGraph: {
    title: "Rater — Design Critique Studio",
    description:
      "Rater is a design feedback platform where designers share their work, receive constructive critiques, and develop their visual judgment.",
    url: "https://raterapp.site",
    siteName: "Rater",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rater — Design Critique Studio",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Rater — Design Critique Studio",
    description:
      "Rater is a design feedback platform where designers share their work, receive constructive critiques, and develop their visual judgment.",
    images: ["/og-image.png"],
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { PostProvider } from "@/context/PostContext";
import { TimeProvider } from "@/context/TimeContext";
import { GlobalRouteLoader } from "../components/GlobalRouteLoader";
import { GlobalOverlays } from "../components/GlobalOverlays";
import { PWARegistry } from "../components/PWARegistry";
import { ScrollRestorationProvider } from "../components/ScrollRestorationProvider";
import { GlobalErrorBoundary } from "../components/GlobalErrorBoundary";
import { StructuredData } from "../components/StructuredData";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <StructuredData />
        <GlobalErrorBoundary>
          <AuthProvider>
            <PostProvider>
              <TimeProvider>
                <ScrollRestorationProvider>
                  <PWARegistry />
                  <GlobalRouteLoader />
                  <GlobalOverlays />
                  {children}
                </ScrollRestorationProvider>
              </TimeProvider>
            </PostProvider>
          </AuthProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport: Viewport = {
  themeColor: "#FEC312",
};

export const metadata: Metadata = {
  title: "Rater — Design Critique Studio",
  description: "Rater is a design feedback platform where designers can share their work, give constructive critiques, and train their eye by evaluating real-world projects.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/rater-logo-white-bg.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
  },
  openGraph: {
    title: "Rater — Design Critique Studio",
    description: "Rater is a design feedback platform where designers can share their work, give constructive critiques, and train their eye by evaluating real-world projects.",
    url: "https://raterapp.site",
    siteName: "Rater",
    images: [
      {
        url: "https://raterapp.site/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rater — Design Critique Studio",
    description: "Rater is a design feedback platform where designers can share their work, give constructive critiques, and train their eye by evaluating real-world projects.",
    images: ["https://raterapp.site/og-image.png"],
  },
};

import { AuthProvider } from "../context/AuthContext";
import { PostProvider } from "../context/PostContext";
import { TimeProvider } from "../context/TimeContext";
import { GlobalRouteLoader } from "../components/GlobalRouteLoader";
import { GlobalOverlays } from "../components/GlobalOverlays";
import { PWARegistry } from "../components/PWARegistry";
import { ScrollRestorationProvider } from "../components/ScrollRestorationProvider";
import { GlobalErrorBoundary } from "../components/GlobalErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
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

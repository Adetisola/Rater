import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FEC312",
};

export const metadata: Metadata = {
  title: "Rater — Judgment is built, not found",
  description: "Train your design eye by observing, evaluating, and reflecting on real design work.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Rater — Judgment is built, not found",
    description: "Train your design eye by observing, evaluating, and reflecting on real design work.",
    url: "https://rater-web.vercel.app",
    siteName: "Rater",
    images: [
      {
        url: "https://rater-web.vercel.app/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rater — Judgment is built, not found",
    description: "Train your design eye by observing, evaluating, and reflecting on real design work.",
    images: ["https://rater-web.vercel.app/og-image.png"],
  },
};

import { AuthProvider } from "../context/AuthContext";
import { PostProvider } from "../context/PostContext";
import { TimeProvider } from "../context/TimeContext";
import { GlobalRouteLoader } from "../components/GlobalRouteLoader";
import { GlobalOverlays } from "../components/GlobalOverlays";
import { PWARegistry } from "../components/PWARegistry";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/icons/rater-logo-white-bg.svg" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <PostProvider>
            <TimeProvider>
              <PWARegistry />
              <GlobalRouteLoader />
              <GlobalOverlays />
              {children}
            </TimeProvider>
          </PostProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

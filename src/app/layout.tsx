import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FEC312",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  // metadataBase is required so that relative URLs in page-level metadata
  // (canonical, OG images, etc.) resolve correctly against the production domain.
  metadataBase: new URL("https://www.raterapp.site"),

  title: {
    // Default title for the homepage and any page that doesn't set its own.
    default: "Rater — Design Critique Studio",
    // Page-specific titles will render as: "Browse | Rater", "Post Title | Rater", etc.
    template: "%s | Rater",
  },
  description:
    "Rater is a design critique studio where creatives sharpen design judgment through structured critique, ratings, and reflection.",

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
      "Rater is a design critique studio where creatives sharpen design judgment through structured critique, ratings, and reflection.",
    url: "https://www.raterapp.site",
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
      "Rater is a design critique studio where creatives sharpen design judgment through structured critique, ratings, and reflection.",
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
import { MaintenanceBanner } from "../components/MaintenanceBanner";
import { ReferralCapture } from "../components/ReferralCapture";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (
                    window.matchMedia('(display-mode: standalone)').matches ||
                    window.matchMedia('(display-mode: fullscreen)').matches ||
                    window.matchMedia('(display-mode: minimal-ui)').matches ||
                    window.navigator.standalone === true ||
                    (document.referrer && document.referrer.indexOf('android-app://') !== -1)
                  ) {
                    localStorage.setItem('rater_pwa_installed', 'true');
                  }
                } catch (e) {}

                window.__raterDeferredPrompt = null;

                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.__raterDeferredPrompt = e;
                  window.dispatchEvent(new CustomEvent('rater-pwa-installable'));
                });

                window.addEventListener('appinstalled', function() {
                  window.__raterDeferredPrompt = null;
                  try {
                    localStorage.setItem('rater_pwa_installed', 'true');
                  } catch (e) {}
                  window.dispatchEvent(new CustomEvent('rater-pwa-installed'));
                });
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <StructuredData />
        <GlobalErrorBoundary>
          <AuthProvider>
            <ReferralCapture />
            <PostProvider>
              <TimeProvider>
                <ScrollRestorationProvider>
                  <PWARegistry />
                  <GlobalRouteLoader />
                  <GlobalOverlays />
                  <MaintenanceBanner />
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

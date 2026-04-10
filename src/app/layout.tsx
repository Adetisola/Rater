import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rater — Judgment is built, not found",
  description: "Train your design eye by observing, evaluating, and reflecting on real design work.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/icons/logo-rater-hover.svg" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

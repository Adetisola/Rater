/**
 * Submit route layout — exports noindex metadata.
 *
 * /submit is an authenticated-only page (wrapped in ProtectedRoute).
 * It should never appear in search results.
 *
 * Note: submit/page.tsx uses "use client" and therefore cannot export metadata.
 * Next.js App Router requires metadata to come from a Server Component —
 * this layout serves that purpose.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Design",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

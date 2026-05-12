/**
 * Legacy /app/* layout — kept as a thin passthrough for backward-compatibility redirects.
 * All routes under /app/* now redirect to their new clean equivalents.
 */
export default function LegacyAppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

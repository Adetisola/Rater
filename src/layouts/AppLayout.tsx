// AppLayout - wrapper for the web app
// Preserves all existing app behavior

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}

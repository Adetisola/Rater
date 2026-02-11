// LandingLayout - wrapper for landing page only
// Does not contain any app navigation or rating logic

interface LandingLayoutProps {
  children: React.ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-white font-sans text-[#111111]">
      {children}
    </div>
  );
}

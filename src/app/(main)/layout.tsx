import { Header } from "@/components/Header";
import { FloatingPostButton } from "@/components/FloatingPostButton";
import { Footer } from "@/components/Footer";
import { BrowseVisibilityController } from "@/components/BrowseVisibilityController";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full min-w-full bg-white flex flex-col font-sans text-black">
      <Header />
      <BrowseVisibilityController>
        {children}
      </BrowseVisibilityController>
      


      <Footer />
      <FloatingPostButton />
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { FloatingPostButton } from "@/components/FloatingPostButton";
import { Footer } from "@/components/Footer";
import { BrowseKeepAlive } from "@/components/BrowseKeepAlive";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBrowse = pathname === "/app/browse" || pathname === "/app/browse/";

  return (
    <div className="min-h-screen w-full min-w-full bg-white flex flex-col font-sans text-[#111111]">
      
      {/* Always-mounted browse layer — never removed from DOM */}
      {/* visibility:hidden keeps it in document flow, preserving scroll position */}
      <div
        style={{
          visibility: isBrowse ? "visible" : "hidden",
          position: isBrowse ? "relative" : "fixed",
          top: 0,
          left: 0,
          width: "100%",
          pointerEvents: isBrowse ? "auto" : "none",
          zIndex: isBrowse ? "auto" : -1,
        }}
      >
        <BrowseKeepAlive />
      </div>

      {/* Other pages render on top when not on browse */}
      {!isBrowse && (
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      )}

      <Footer />
      <FloatingPostButton />
    </div>
  );
}

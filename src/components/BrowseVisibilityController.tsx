"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { BrowseKeepAlive } from "@/components/BrowseKeepAlive";

export function BrowseVisibilityController({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBrowse = pathname === "/browse" || pathname === "/browse/";

  return (
    <>
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
        <Suspense fallback={null}>
          <BrowseKeepAlive />
        </Suspense>
      </div>

      {/* Other pages render on top when not on browse */}
      {!isBrowse && (
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      )}
    </>
  );
}

"use client";

import { FloatingPostButton } from "@/components/FloatingPostButton";
import { Footer } from "@/components/Footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full min-w-full bg-white flex flex-col font-sans text-[#111111]">
      {children}
      <Footer />
      <FloatingPostButton />
    </div>
  );
}

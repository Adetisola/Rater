"use client";

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FBFBFC] overflow-hidden text-gray-900 antialiased font-sans">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <AdminSidebar 
        isMobileOpen={mobileMenuOpen} 
        onCloseMobile={() => setMobileMenuOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

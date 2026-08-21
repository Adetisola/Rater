"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ShieldAlert, 
  MessageSquare, 
  Settings, 
  ArrowLeft,
  X,
  ExternalLink,
  BarChart2,
  Megaphone
} from 'lucide-react';
import { useAuthState } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ isMobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { currentProfile } = useAuthState();
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);
  const [activeFeedbackCount, setActiveFeedbackCount] = useState<number>(0);

  useEffect(() => {
    async function fetchBadgeCounts() {
      try {
        const [reportsRes, feedbackRes] = await Promise.all([
          supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('feedback_requests').select('*', { count: 'exact', head: true }).neq('status', 'Completed'),
        ]);

        if (reportsRes.count !== null) setPendingReportsCount(reportsRes.count);
        if (feedbackRes.count !== null) setActiveFeedbackCount(feedbackRes.count);
      } catch (err) {
        // Fallback silently if offline or initial load
      }
    }

    fetchBadgeCounts();
  }, [pathname]);

  const navItems = [
    { 
      label: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      label: 'Analytics', 
      href: '/admin/analytics', 
      icon: BarChart2 
    },
    { 
      label: 'Campaigns', 
      href: '/admin/campaigns', 
      icon: Megaphone 
    },
    { 
      label: 'Users', 
      href: '/admin/users', 
      icon: Users 
    },
    { 
      label: 'Posts', 
      href: '/admin/posts', 
      icon: FileText 
    },
    { 
      label: 'Reports', 
      href: '/admin/reports', 
      icon: ShieldAlert,
      badge: pendingReportsCount > 0 ? pendingReportsCount : null,
      badgeVariant: 'danger' as const
    },
    { 
      label: 'Feedback', 
      href: '/admin/feedback', 
      icon: MessageSquare,
      badge: activeFeedbackCount > 0 ? activeFeedbackCount : null,
      badgeVariant: 'neutral' as const
    },
    { 
      label: 'Settings', 
      href: '/admin/settings', 
      icon: Settings 
    },
  ];

  if (!currentProfile?.is_admin) {
    return null;
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-64 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative">
            <img
              src="/icons/rater-logo-transparent-bg-stroked.svg"
              alt="Rater Logo"
              className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-0"
            />
            <img
              src="/icons/rater-logo-black-bg.svg"
              alt="Rater Logo Hover"
              className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            />
          </div>
          <div>
            <div className="text-base font-semibold text-gray-900 tracking-tight leading-none">
              Rater
            </div>
            <div className="text-[10px] font-semibold text-primary tracking-wider mt-0.5">
              Admin Panel
            </div>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        <div className="text-xs font-semibold text-gray-400 tracking-wider mb-3 px-3">
          Management
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium text-sm transition-all duration-150 group ${
                isActive
                  ? 'bg-black text-white font-semibold shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={18}
                  className={`transition-colors ${
                    isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-900'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${
                    isActive
                      ? 'bg-primary text-black'
                      : item.badgeVariant === 'danger'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Quick Links */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Live App
        </Link>
        <Link
          href="/browse"
          target="_blank"
          className="flex items-center justify-center gap-1.5 w-full py-2 text-gray-400 hover:text-gray-700 font-semibold text-[11px] transition-colors"
        >
          Open App in New Tab
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block h-full z-20 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

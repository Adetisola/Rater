"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ArrowLeft, ShieldCheck, Menu } from 'lucide-react';
import { useAuthState } from '@/context/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';

interface AdminHeaderProps {
  onToggleMobileMenu?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'User Management',
  posts: 'Post Moderation',
  reports: 'Reports & Safety',
  feedback: 'Product Feedback',
  settings: 'Platform Settings',
};

export function AdminHeader({ onToggleMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();
  const { currentProfile } = useAuthState();

  // Extract breadcrumbs from pathname: /admin/posts -> ['Admin', 'Post Moderation']
  const segments = pathname.split('/').filter(Boolean);
  const currentSectionKey = segments[1] || 'dashboard';
  const sectionTitle = ROUTE_LABELS[currentSectionKey] || 'Overview';

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between z-10 shrink-0">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-50 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Link href="/admin/dashboard" className="hover:text-gray-900 transition-colors">
            Admin
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-gray-900">{sectionTitle}</span>
        </div>
      </div>

      {/* Right: Admin Profile Snapshot & Back Link */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-colors"
        >
          <ArrowLeft size={14} />
          Back to App
        </Link>

        {currentProfile && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
            <UserAvatar
              avatarUrl={currentProfile.avatar_url}
              className="w-8 h-8 ring-2 ring-primary/20"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                {currentProfile.name}
                <ShieldCheck size={12} className="text-primary fill-primary/20" />
              </div>
              <div className="text-[10px] font-semibold text-gray-400">
                @{currentProfile.username}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

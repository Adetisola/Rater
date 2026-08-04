"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, FileText, Users, BarChart, Settings, ArrowLeft } from 'lucide-react';
import { useAuthState } from '@/context/AuthContext';

export function AdminSidebar() {
  const pathname = usePathname();
  const { currentProfile } = useAuthState();
  
  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
    { label: 'Posts', href: '/admin/posts', icon: FileText },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Reports', href: '/admin/reports', icon: BarChart },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (!currentProfile?.is_admin) {
    return null; // A proper middleware will redirect them, but hide just in case
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full z-10 shrink-0">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-lg">A</div>
          Admin
        </h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Menu</div>
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                isActive 
                  ? 'bg-primary/5 text-primary' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link 
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-gray-100 text-gray-600 hover:bg-gray-50 font-bold text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to App
        </Link>
      </div>
    </aside>
  );
}

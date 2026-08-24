"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthState, useAuthActions } from '../context/AuthContext';
import { 
  LogOut, 
  Settings, 
  MessageSquarePlus, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  QrCode, 
  MoreHorizontal, 
  Edit2, 
  CloudUpload, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  BookOpen, 
  Sparkles, 
  FileText, 
  Lock, 
  LifeBuoy 
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { LogoutConfirmOverlay } from './LogoutConfirmOverlay';
import { QRCodeOverlay } from './QRCodeOverlay';
import { showSettings, showInviteModal, openFeedbackDrawer } from './GlobalOverlays';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
  variant?: 'nav' | 'profile';
  onEditProfile?: () => void;
}

export function UserMenu({ trigger, align = 'left', variant = 'nav', onEditProfile }: UserMenuProps = {}) {
  const { currentProfile } = useAuthState();
  const { logout } = useAuthActions();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [showHelpSubmenu, setShowHelpSubmenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const firstSubmenuItemRef = useRef<HTMLAnchorElement>(null);

  // Detect mobile screen width (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close all menu states cleanly
  const handleCloseAll = useCallback(() => {
    setIsOpen(false);
    setShowHelpSubmenu(false);
  }, []);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseAll();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleCloseAll]);

  // Keyboard accessibility (Escape handling & focus management)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (showHelpSubmenu) {
          setShowHelpSubmenu(false);
          helpTriggerRef.current?.focus();
        } else {
          handleCloseAll();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showHelpSubmenu, handleCloseAll]);

  // Focus first item when Help submenu opens on desktop
  useEffect(() => {
    if (showHelpSubmenu && !isMobile) {
      firstSubmenuItemRef.current?.focus();
    }
  }, [showHelpSubmenu, isMobile]);

  if (!currentProfile) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer" aria-haspopup="menu" aria-expanded={isOpen}>
          {trigger}
        </div>
      ) : variant === 'nav' ? (
        <div 
          onClick={() => setIsOpen(!isOpen)} 
          className="group flex items-center h-[44px] bg-transparent hover:bg-gray-100 rounded-[22px] transition-all duration-200 ease-out cursor-pointer"
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <Link
            href={`/@${currentProfile.username}`}
            onClick={(e) => e.stopPropagation()}
            className="block shrink-0 transition-transform hover:scale-105 active:scale-95 focus:outline-none"
            aria-label="View profile"
          >
            <UserAvatar avatarUrl={currentProfile.avatar_url} size="sm" priority={true} className="w-[44px] h-[44px] shadow-xs" />
          </Link>
          <div className="w-0 overflow-hidden transition-all duration-200 ease-out group-hover:w-8 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ChevronDown size={16} className="text-gray-500 mr-1" />
          </div>
        </div>
      ) : (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer" aria-haspopup="menu" aria-expanded={isOpen}>
          <button 
            className="w-10 h-10 p-0 rounded-full bg-white border-2 border-gray-100 hover:bg-gray-50 flex items-center justify-center transition-all"
            aria-label="Open menu"
          >
            <MoreHorizontal className="w-5 h-5 text-black" />
          </button>
        </div>
      )}

      {/* Dropdown Menu Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute top-full mt-2 w-[260px] bg-white rounded-2xl shadow-xl border border-gray-100/80 overflow-visible z-100",
              align === 'right' ? 'right-0' : 'left-0'
            )}
            role="menu"
            aria-label="User navigation menu"
          >
            {/* Desktop / Mobile Container Wrapper */}
            <div className="relative overflow-hidden rounded-2xl bg-white">
              
              {/* MAIN MENU PANEL (slides only on mobile, stays static on desktop) */}
              <motion.div
                initial={false}
                animate={{ x: isMobile && showHelpSubmenu ? '-100%' : '0%' }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full flex flex-col"
              >
                {/* 1. Interactive Profile Header Card */}
                {variant === 'nav' && (
                  <Link
                    href={`/@${currentProfile.username}`}
                    onClick={handleCloseAll}
                    className="flex items-center justify-between p-3.5 hover:bg-gray-50/80 transition-colors border-b border-gray-100 group"
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar avatarUrl={currentProfile.avatar_url} size="xs" className="w-8 h-8 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-black transition-colors leading-snug">
                          {currentProfile.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate leading-snug">
                          @{currentProfile.username}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0 ml-2" />
                  </Link>
                )}

                {/* 2. Primary Creative Actions */}
                <div className="p-1.5 space-y-0.5 border-b border-gray-100">
                  {onEditProfile ? (
                    <button
                      onClick={() => { handleCloseAll(); onEditProfile(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs text-left"
                      role="menuitem"
                    >
                      <Edit2 size={16} className="text-gray-400" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <Link
                      href={`/@${currentProfile.username}?edit=true`}
                      onClick={handleCloseAll}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs text-left"
                      role="menuitem"
                    >
                      <Edit2 size={16} className="text-gray-400" />
                      <span>Edit Profile</span>
                    </Link>
                  )}

                  <Link
                    href="/submit"
                    onClick={() => {
                      handleCloseAll();
                      window.dispatchEvent(new Event('app-navigation-start'));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs text-left"
                    role="menuitem"
                  >
                    <CloudUpload size={16} className="text-gray-400" />
                    <span>Publish Work</span>
                  </Link>

                  <button
                    onClick={() => { handleCloseAll(); showInviteModal(); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs text-left group/invite"
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserPlus size={16} className="text-gray-400 group-hover/invite:text-black transition-colors" />
                      <span>Invite Designers</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-primary/20 text-black leading-none">
                      Invite
                    </span>
                  </button>

                  <button
                    onClick={() => { handleCloseAll(); setShowQrCode(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs text-left"
                    role="menuitem"
                  >
                    <QrCode size={16} className="text-gray-400" />
                    <span>Share Profile</span>
                  </button>
                </div>

                {/* 3. Settings & Help */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { handleCloseAll(); showSettings(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs text-left"
                    role="menuitem"
                  >
                    <Settings size={16} className="text-gray-400" />
                    <span>Settings</span>
                  </button>

                  {/* Help & Resources Trigger Button */}
                  <button
                    ref={helpTriggerRef}
                    onClick={() => setShowHelpSubmenu(!showHelpSubmenu)}
                    aria-expanded={showHelpSubmenu}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-xs text-left group/help",
                      showHelpSubmenu && !isMobile 
                        ? "bg-gray-100 text-gray-900 font-semibold" 
                        : "hover:bg-gray-50 text-gray-700 font-medium"
                    )}
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2.5">
                      <LifeBuoy size={16} className={cn("transition-colors", showHelpSubmenu && !isMobile ? "text-black" : "text-gray-400 group-hover/help:text-black")} />
                      <span>Help & Resources</span>
                    </div>
                    <ChevronRight size={14} className={cn("transition-colors", showHelpSubmenu && !isMobile ? "text-gray-700" : "text-gray-300 group-hover/help:text-gray-600")} />
                  </button>
                </div>

                {/* 4. Admin Dashboard (Admin Only) */}
                {currentProfile.is_admin && (
                  <div className="p-1.5 border-t border-gray-100">
                    <Link
                      href="/admin/dashboard"
                      onClick={handleCloseAll}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-50/70 text-amber-700 transition-colors font-medium text-xs text-left"
                      role="menuitem"
                    >
                      <ShieldCheck size={16} className="text-amber-600" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </div>
                )}

                {/* 5. Logout */}
                <div className="p-1.5 border-t border-gray-100">
                  <button
                    onClick={() => {
                      handleCloseAll();
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50/80 hover:text-red-600 transition-colors text-gray-700 font-medium text-xs text-left group/logout"
                    role="menuitem"
                  >
                    <LogOut size={16} className="text-gray-400 group-hover/logout:text-red-500" />
                    <span>Log out</span>
                  </button>
                </div>
              </motion.div>

              {/* MOBILE DRILL-DOWN SUBVIEW (Rendered strictly on mobile < 768px) */}
              {isMobile && (
                <motion.div
                  initial={false}
                  animate={{ x: showHelpSubmenu ? '0%' : '100%' }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white flex flex-col z-20"
                >
                  {/* Back Button Header */}
                  <div className="p-2 border-b border-gray-100 flex items-center">
                    <button
                      onClick={() => setShowHelpSubmenu(false)}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:text-black rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                      <span>Back to Menu</span>
                    </button>
                  </div>

                  {/* Mobile Submenu Items */}
                  <div className="p-1.5 space-y-3 overflow-y-auto max-h-[340px]">
                    {/* Support & Feedback */}
                    <div className="space-y-0.5">
                      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Support & Feedback
                      </p>
                      <a
                        href="mailto:support@raterapp.site"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                      >
                        <Mail size={16} className="text-gray-400" />
                        <span>Contact Support</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseAll();
                          openFeedbackDrawer();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs text-left"
                      >
                        <MessageSquarePlus size={16} className="text-gray-400" />
                        <span>Share Feedback</span>
                      </button>
                    </div>

                    {/* Resources */}
                    <div className="space-y-0.5 border-t border-gray-100 pt-2">
                      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Resources
                      </p>
                      <Link
                        href="/legal/community-guidelines"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                      >
                        <BookOpen size={16} className="text-gray-400" />
                        <span>Community Guidelines</span>
                      </Link>
                      <Link
                        href="/legal/ai-insights"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                      >
                        <Sparkles size={16} className="text-gray-400" />
                        <span>AI Insights Disclosure</span>
                      </Link>
                    </div>

                    {/* Legal */}
                    <div className="space-y-0.5 border-t border-gray-100 pt-2">
                      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Legal
                      </p>
                      <Link
                        href="/legal/terms"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                      >
                        <FileText size={16} className="text-gray-400" />
                        <span>Terms of Service</span>
                      </Link>
                      <Link
                        href="/legal/privacy"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                      >
                        <Lock size={16} className="text-gray-400" />
                        <span>Privacy Policy</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* DESKTOP SIDE FLYOUT SUBMENU (Rendered strictly on desktop md+) */}
            {!isMobile && (
              <AnimatePresence>
                {showHelpSubmenu && (
                  <motion.div
                    initial={{ opacity: 0, x: align === 'right' ? 8 : -8, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: align === 'right' ? 8 : -8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={cn(
                      "absolute top-0 w-[240px] bg-white rounded-2xl shadow-xl border border-gray-100/80 p-1.5 z-105",
                      align === 'right' ? 'right-full mr-2' : 'left-full ml-2'
                    )}
                    role="menu"
                    aria-label="Help & Resources submenu"
                  >
                    {/* Support & Feedback */}
                    <div className="space-y-0.5 pb-1.5 mb-1.5 border-b border-gray-100">
                      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Support & Feedback
                      </p>
                      <a
                        ref={firstSubmenuItemRef}
                        href="mailto:support@raterapp.site"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                        role="menuitem"
                      >
                        <Mail size={16} className="text-gray-400" />
                        <span>Contact Support</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseAll();
                          openFeedbackDrawer();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs text-left"
                        role="menuitem"
                      >
                        <MessageSquarePlus size={16} className="text-gray-400" />
                        <span>Share Feedback</span>
                      </button>
                    </div>

                    {/* Resources */}
                    <div className="space-y-0.5 pb-1.5 mb-1.5 border-b border-gray-100">
                      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Resources
                      </p>
                      <Link
                        href="/legal/community-guidelines"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                        role="menuitem"
                      >
                        <BookOpen size={16} className="text-gray-400" />
                        <span>Community Guidelines</span>
                      </Link>
                      <Link
                        href="/legal/ai-insights"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                        role="menuitem"
                      >
                        <Sparkles size={16} className="text-gray-400" />
                        <span>AI Insights Disclosure</span>
                      </Link>
                    </div>

                    {/* Legal */}
                    <div className="space-y-0.5">
                      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Legal
                      </p>
                      <Link
                        href="/legal/terms"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                        role="menuitem"
                      >
                        <FileText size={16} className="text-gray-400" />
                        <span>Terms of Service</span>
                      </Link>
                      <Link
                        href="/legal/privacy"
                        onClick={handleCloseAll}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-xs"
                        role="menuitem"
                      >
                        <Lock size={16} className="text-gray-400" />
                        <span>Privacy Policy</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmOverlay
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout();
            if (pathname?.startsWith('/@')) {
              router.replace('/browse');
            }
          }}
        />
      )}

      {/* QR Code / Share Profile Modal */}
      {showQrCode && (
        <QRCodeOverlay
          isOpen={showQrCode}
          onClose={() => setShowQrCode(false)}
          username={currentProfile.username}
          avatarUrl={currentProfile.avatar_url}
        />
      )}
    </div>
  );
}

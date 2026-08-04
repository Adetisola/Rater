"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthState, useAuthActions } from '../context/AuthContext';
import { LogOut, Settings, MessageSquarePlus, Scale, User, ShieldAlert, ChevronDown, QrCode, MoreHorizontal, Edit2 } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { LogoutConfirmOverlay } from './LogoutConfirmOverlay';
import { QRCodeOverlay } from './QRCodeOverlay';

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!currentProfile) return null;

  return (
    <div className="relative" ref={menuRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
      ) : variant === 'nav' ? (
        <div 
          onClick={() => setIsOpen(!isOpen)} 
          className="group flex items-center h-[44px] bg-transparent hover:bg-gray-100 rounded-[22px] transition-all duration-300 ease-out cursor-pointer"
        >
          <Link
            href={`/@${currentProfile.username}`}
            onClick={(e) => e.stopPropagation()}
            className="block shrink-0 transition-transform hover:scale-105 active:scale-95 focus:outline-none"
          >
            <UserAvatar avatarUrl={currentProfile.avatar_url} className="w-[44px] h-[44px] shadow-sm" />
          </Link>
          <div className="w-0 overflow-hidden transition-all duration-300 ease-out group-hover:w-8 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ChevronDown size={16} className="text-gray-500 mr-1" />
          </div>
        </div>
      ) : (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          <button className="w-10 h-10 p-0 rounded-full bg-white border-2 border-gray-100 hover:bg-gray-50 flex items-center justify-center transition-all">
            <MoreHorizontal className="w-5 h-5 text-black" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-3 w-[240px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-100`}
          >
            {variant === 'nav' && (
              <div className="p-3 border-b border-gray-100">
                <p className="font-bold text-gray-900 truncate">{currentProfile.name}</p>
                <p className="text-sm text-gray-500 truncate">@{currentProfile.username}</p>
              </div>
            )}
            
            <div className="p-2 flex flex-col gap-1">
              {onEditProfile ? (
                <button
                  onClick={() => { setIsOpen(false); onEditProfile(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm"
                >
                  <Edit2 size={18} className="text-gray-400" />
                  Edit your Profile
                </button>
              ) : (
                <Link
                  href={`/@${currentProfile.username}?edit=true`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm"
                >
                  <Edit2 size={18} className="text-gray-400" />
                  Edit your Profile
                </Link>
              )}
              
              {variant !== 'profile' && (
                <Link
                  href={`/@${currentProfile.username}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm"
                >
                  <User size={18} className="text-gray-400" />
                  Profile
                </Link>
              )}
              
              <button
                onClick={() => { setIsOpen(false); setShowQrCode(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm"
              >
                <QrCode size={18} className="text-gray-400" />
                Share Profile
              </button>
              
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Link
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm"
                  >
                    <Settings size={18} className="text-gray-400" />
                    Settings
                  </Link>
                  
                  <Link
                    href="/feedback"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm"
                  >
                    <MessageSquarePlus size={18} className="text-gray-400" />
                    Feedback
                  </Link>
                  
                  <Link
                    href="/legal/terms"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm"
                  >
                    <Scale size={18} className="text-gray-400" />
                    Legal
                  </Link>
                </>
              )}
              
              {currentProfile.is_admin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 text-primary transition-colors font-bold text-sm mt-1"
                >
                  <ShieldAlert size={18} className="text-primary" />
                  Admin Dashboard
                </Link>
              )}
            </div>
            
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-gray-700 font-medium text-sm"
              >
                <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

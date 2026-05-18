"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Edit2, Trash2, Share2, Download, Flag, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { showDeleteConfirmation } from './GlobalOverlays';
import { cn } from '../lib/utils';
import { type Post } from '../logic/mockData';
import { sharePost, downloadPostImage } from '../lib/postActions';
import { createPortal } from 'react-dom';
import { SharePostOverlay } from './SharePostOverlay';
import { ReportPostOverlay } from './ReportPostOverlay';

interface PostActionsMenuProps {
  post: Post;
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
  iconSizeClass?: string;
  onReport?: () => void;
  isCardContext?: boolean;
}

export function PostActionsMenu({
  post,
  className,
  buttonClassName,
  iconClassName,
  iconSizeClass = "w-4 h-4",
  onReport,
  isCardContext,
}: PostActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);
  const [isReportOverlayOpen, setIsReportOverlayOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { currentAvatar } = useAuth();
  const { setEditingPost } = usePosts();
  const menuRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const updateDropdownPosition = () => {
    if (isOpen && moreBtnRef.current) {
      const rect = moreBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  };

  useEffect(() => {
    updateDropdownPosition();
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen]);

  const isOwner = currentAvatar?.id === post.avatar_id;

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // — Handlers —

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const handledNatively = await sharePost(post.id, post.title);
    if (handledNatively) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } else {
      setIsShareOverlayOpen(true);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await downloadPostImage(post.image_url, post.title);
    setIsOpen(false);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onReport) {
      onReport();
    } else {
      setIsReportOverlayOpen(true);
    }
    setIsOpen(false);
  };

  // — Shared button styling —

  const btnClass = cn(
    "flex items-center justify-center rounded-full active:scale-90",
    buttonClassName || cn(
      "w-8 h-8 transition-all",
      "bg-white/20 text-white hover:bg-white/40 backdrop-blur-md border border-white/30"
    ),
    iconClassName
  );

  const moreBtnClass = cn(
    "flex items-center justify-center rounded-full active:scale-90",
    buttonClassName
      ? cn(buttonClassName, isOpen && "ring-2 ring-black/10")
      : cn(
          "w-8 h-8 transition-all",
          isOpen
            ? "bg-white text-black shadow-lg"
            : "bg-white/20 text-white hover:bg-white/40 backdrop-blur-md border border-white/30"
        ),
    iconClassName
  );

  // — Menu item class —
  const menuItemClass = "w-full px-4 py-3 flex items-center gap-2.5 hover:bg-gray-50 transition-colors text-sm font-medium";

  // ── Abstracted Menu Content ──
  const menuContent = (
    <div className="flex flex-col">
      {/* Mobile-only Share option inside the menu */}
      {isCardContext && isMobile && (
        <button
          type="button"
          onClick={handleShare}
          className={cn(menuItemClass, "text-gray-600")}
        >
          <Share2 className="w-4 h-4" />
          Share Post
        </button>
      )}

      {isOwner ? (
        /* OWNER: Edit, Delete, divider, Download */
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditingPost(post);
              setIsOpen(false);
            }}
            className={cn(menuItemClass, "text-gray-600")}
          >
            <Edit2 className="w-4 h-4" />
            Edit Post
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              showDeleteConfirmation(post.id);
              setIsOpen(false);
            }}
            className={cn(menuItemClass, "text-red-500 hover:bg-red-50")}
          >
            <Trash2 className="w-4 h-4" />
            Remove Post
          </button>
          <div className="border-t border-gray-100 mx-3" />
          <button
            type="button"
            onClick={handleDownload}
            className={cn(menuItemClass, "text-gray-600")}
          >
            <Download className="w-4 h-4" />
            Download Image
          </button>
        </>
      ) : (
        /* NON-OWNER / GUEST: Download, divider, Report */
        <>
          <button
            type="button"
            onClick={handleDownload}
            className={cn(menuItemClass, "text-gray-600")}
          >
            <Download className="w-4 h-4" />
            Download Image
          </button>
          <div className="border-t border-gray-100 mx-3" />
          <button
            type="button"
            onClick={handleReport}
            className={cn(menuItemClass, "text-red-500 hover:bg-red-50")}
          >
            <Flag className="w-4 h-4" />
            Report Post
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className={cn("relative flex items-center gap-2", className)} ref={menuRef} data-no-route-loader>
      {/* Share Button (always visible unless mobile + card context) */}
      <button
        type="button"
        onClick={handleShare}
        className={cn(
          btnClass, 
          shareSuccess && !buttonClassName && "bg-white text-black shadow-lg",
          isCardContext && "hidden md:flex"
        )}
      >
        {shareSuccess
          ? <Check className={cn(iconSizeClass, buttonClassName ? "text-green-500" : "text-green-400")} />
          : <Share2 className={iconSizeClass} />
        }
      </button>

      {/* More Menu Button (always visible) */}
      <button
        ref={moreBtnRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={moreBtnClass}
      >
        <MoreVertical className={iconSizeClass} />
      </button>

      {/* Dropdown Menu or Bottom Sheet */}
      {isCardContext && isMobile ? (
        mounted && createPortal(
          <AnimatePresence>
            {isOpen && (
              <div 
                className="fixed inset-0 z-100 flex items-end"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <motion.div 
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    e.preventDefault();
                    setIsOpen(false); 
                  }}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full bg-white rounded-t-[32px] overflow-hidden relative z-10 pb-6 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                  </div>
                  <div className="px-2 py-2">
                    {menuContent}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )
      ) : (
        mounted && createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.15 }}
                className="fixed bg-white rounded-2xl shadow-xl border border-gray-100 z-60 min-w-[200px] overflow-hidden"
                style={{ top: dropdownPos.top, right: dropdownPos.right }}
              >
                {menuContent}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      )}

      {/* Share Overlay for Desktop */}
      {isShareOverlayOpen && (
        <SharePostOverlay 
          post_id={post.id} 
          onClose={() => setIsShareOverlayOpen(false)} 
        />
      )}

      {/* Report Overlay for PostCard UI */}
      {isReportOverlayOpen && (
        <ReportPostOverlay 
          onClose={() => setIsReportOverlayOpen(false)}
          onSubmit={(reason, details) => {
            console.log('Report submitted:', reason, details);
            setIsReportOverlayOpen(false);
          }}
        />
      )}
    </div>
  );
}

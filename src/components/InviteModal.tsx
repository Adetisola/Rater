"use client";

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Button } from '@/components/ui/Button';
import { useAuthState } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const whatsappIcon = '/icons/icons8-whatsapp.svg';
const xIcon = '/icons/icons8-x.svg';
const linkedinIcon = '/icons/icons8-linkedin.svg';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { currentProfile } = useAuthState();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!mounted || !isOpen || !currentProfile) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.raterapp.site';
  const inviteUrl = `${origin}/invite/@${currentProfile.username}`;
  const shareText = `Join me on Rater, the design critique platform where designers get real critiques and ratings on their work. Sign up with my invite link:`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy invite link', err);
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'x' | 'linkedin') => {
    const encodedUrl = encodeURIComponent(inviteUrl);
    const encodedText = encodeURIComponent(shareText);
    let target = '';
    if (platform === 'whatsapp') {
      target = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
    } else if (platform === 'x') {
      target = `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    } else if (platform === 'linkedin') {
      target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    }
    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal Content Container */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-surface-primary rounded-[32px] p-8 sm:p-10 shadow-2xl relative z-10 text-center border border-border-default overflow-hidden"
      >
        <h2 className="text-xl font-medium text-text-primary mb-1">Invite Designers</h2>
        <p className="text-sm text-text-secondary mb-5">Invite fellow creatives to join Rater.</p>

        {/* URL Input */}
        <div className="flex items-center gap-2 border-2 border-border-default rounded-xl px-4 py-3 mb-6 bg-surface-secondary">
          <input 
            readOnly
            value={inviteUrl}
            className="flex-1 bg-transparent text-sm text-text-secondary outline-none w-full select-all font-medium"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mb-7">
          <Button 
            variant="ghost"
            className="h-10 px-6 rounded-full text-base font-medium transition-all text-text-secondary hover:text-text-primary"
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            onClick={handleCopy}
            variant="outline"
            className={cn(
              "px-8 h-12 rounded-full text-lg font-medium transition-all flex items-center gap-2 border-primary text-text-primary hover:bg-primary/10",
              copied && "bg-[#10b981] border-[#10b981] text-white hover:bg-[#0e9f6e] hover:border-[#0e9f6e] hover:text-white"
            )}
          >
            {copied ? (
              <>
                <div className="h-10 w-10 -ml-6 -my-4">
                  <DotLottieReact
                    src="https://lottie.host/a059d513-00d2-44a4-82a1-3d15c5bad2fc/OWXtqqeGsX.lottie"
                    loop
                    autoplay
                  />
                </div>
                <span>Copied!</span>
              </>
            ) : (
              "Copy Link"
            )}
          </Button>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center items-center gap-6 mb-4">
          <button 
            type="button"
            onClick={() => handleSocialShare('whatsapp')}
            className="hover:scale-105 transition-transform"
            title="Share on WhatsApp"
          >
            <img src={whatsappIcon} className="h-12 w-12" alt="WhatsApp" />
          </button>
          <button 
            type="button"
            onClick={() => handleSocialShare('x')}
            className="hover:scale-105 transition-transform"
            title="Share on X"
          >
            <img src={xIcon} className="h-12 w-12" alt="X" />
          </button>
          <button 
            type="button"
            onClick={() => handleSocialShare('linkedin')}
            className="hover:scale-105 transition-transform"
            title="Share on LinkedIn"
          >
            <img src={linkedinIcon} className="h-13 w-13" alt="LinkedIn" />
          </button>
        </div>

        {/* In-Person QR Code Toggle */}
        <div className="pt-2 border-t border-border-default flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="text-xs font-semibold text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5 py-1.5 transition-colors"
          >
            <QrCode size={14} />
            <span>{showQr ? 'Hide In-Person QR Code' : 'Show In-Person Invite QR Code'}</span>
          </button>

          <AnimatePresence>
            {showQr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 bg-surface-secondary rounded-2xl border border-border-default shadow-2xs flex flex-col items-center overflow-hidden"
                ref={qrRef}
              >
                <div className="p-2 bg-white rounded-xl">
                  <QRCodeCanvas
                    value={inviteUrl}
                    size={160}
                    level="H"
                    includeMargin
                  />
                </div>
                <span className="text-[10px] text-text-muted mt-2">
                  Scan with phone camera to join
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-text-muted italic mt-3">
          When a designer joins with this link, you will be credited as their referrer.
        </p>

      </motion.div>
    </div>,
    document.body
  );
}

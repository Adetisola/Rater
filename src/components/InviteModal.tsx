"use client";

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, QrCode, Sparkles, Share2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { useAuthState } from '@/context/AuthContext';

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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!mounted || !isOpen || !currentProfile) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = `${origin}/invite/@${currentProfile.username}`;
  const shareText = `Join me on Rater — the design feedback platform where designers get real critiques and ratings on their work. Sign up with my invite link:`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite link', err);
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${inviteUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}\n\n${inviteUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Rater with my invite link',
          text: shareText,
          url: inviteUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-4xl p-6 sm:p-7 shadow-2xl overflow-hidden flex flex-col border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-black">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-semibold text-lg text-gray-900">Invite Designers</h3>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors bg-gray-50 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              Share your personal invite link with friends and fellow designers. When someone registers through your link, you will be recognized as their referrer on Rater.
            </p>

            {/* Invite Link Box */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 mb-4 space-y-2">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Your Personal Invite Link
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 select-all focus:outline-none"
                />
                <Button
                  variant="primary"
                  onClick={handleCopy}
                  className="h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 inline-flex items-center gap-1.5 bg-black text-white hover:bg-gray-800"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="space-y-2 mb-4">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Quick Share
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-semibold text-xs transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-[11px] font-bold">WhatsApp</span>
                </button>
                <button
                  onClick={handleShareX}
                  className="py-2.5 px-2 rounded-xl bg-black/5 hover:bg-black/10 text-gray-900 font-semibold text-xs transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-[11px] font-bold">X (Twitter)</span>
                </button>
                <button
                  onClick={handleShareLinkedIn}
                  className="py-2.5 px-2 rounded-xl bg-[#0077B5]/10 hover:bg-[#0077B5]/20 text-[#0077B5] font-semibold text-xs transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-[11px] font-bold">LinkedIn</span>
                </button>
                <button
                  onClick={handleNativeShare}
                  className="py-2.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition-colors flex flex-col items-center gap-1"
                >
                  <Share2 size={13} />
                  <span className="text-[10px] font-bold">More</span>
                </button>
              </div>
            </div>

            {/* QR Code Toggle */}
            <div className="pt-2 border-t border-gray-100 flex flex-col items-center">
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-xs font-semibold text-gray-600 hover:text-black inline-flex items-center gap-1.5 py-1"
              >
                <QrCode size={14} />
                <span>{showQr ? 'Hide Invite QR Code' : 'Show In-Person Invite QR Code'}</span>
              </button>

              {showQr && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm flex flex-col items-center"
                  ref={qrRef}
                >
                  <QRCodeCanvas
                    value={inviteUrl}
                    size={160}
                    level="H"
                    includeMargin
                  />
                  <span className="text-[10px] text-gray-400 mt-2 font-mono">
                    Scan with phone camera to join
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

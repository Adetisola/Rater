"use client";

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, User, Users } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface QRCodeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatarUrl?: string;
  initialMode?: 'profile' | 'invite';
}

export function QRCodeOverlay({ isOpen, onClose, username, avatarUrl, initialMode = 'profile' }: QRCodeOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'profile' | 'invite'>(initialMode);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [processedAvatar, setProcessedAvatar] = useState<string | undefined>(undefined);
  
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const activeUrl = mode === 'invite' ? `${origin}/invite/@${username}` : `${origin}/@${username}`;
  const displayUrl = activeUrl.replace(/^https?:\/\//, '');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (avatarUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = avatarUrl;
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw white background/border
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // Create circular clip for the image
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.clip();

        const imgAspect = img.width / img.height;
        let drawWidth = size;
        let drawHeight = size;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > 1) {
          drawWidth = size * imgAspect;
          offsetX = -(drawWidth - size) / 2;
        } else {
          drawHeight = size / imgAspect;
          offsetY = -(drawHeight - size) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
        
        setProcessedAvatar(canvas.toDataURL());
      };
    } else {
      setProcessedAvatar(undefined);
    }
  }, [avatarUrl]);

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

  if (!mounted || !isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
      
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `rater-${mode}-${username}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-[370px] bg-surface-elevated rounded-[32px] p-6 shadow-2xl overflow-hidden flex flex-col items-center border border-border-default"
          >
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="font-medium text-base text-text-primary tracking-tight">
                {mode === 'invite' ? 'Invite Referral Link' : 'Share Profile'}
              </h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors bg-surface-subtle text-text-muted hover:text-text-primary"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Pills */}
            <div className="w-full flex bg-surface-interactive p-1 rounded-full mb-5">
              <button
                type="button"
                onClick={() => setMode('profile')}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200",
                  mode === 'profile'
                    ? "bg-surface-elevated text-text-primary border border-border-default shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <User size={13} className={mode === 'profile' ? "text-text-primary" : "text-text-muted"} />
                <span>Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('invite')}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200",
                  mode === 'invite'
                    ? "bg-surface-elevated text-text-primary border border-border-default shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <Users size={13} className={mode === 'invite' ? "text-text-primary" : "text-text-muted"} />
                <span>Invite Link</span>
              </button>
            </div>

            {/* QR Code Container */}
            <div 
              ref={canvasRef}
              className="bg-white p-4.5 rounded-3xl border border-border-default mb-4"
            >
              <QRCodeCanvas 
                value={activeUrl}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#111111"}
                level={"Q"}
                includeMargin={false}
                imageSettings={processedAvatar ? {
                    src: processedAvatar,
                    x: undefined,
                    y: undefined,
                    height: 48,
                    width: 48,
                    excavate: true,
                } : undefined}
              />
            </div>

            {/* User details and clean URL */}
            <div className="text-center mb-6 w-full px-2">
              <p className="text-sm font-medium text-text-primary mb-0.5 truncate">@{username}</p>
              <p className="text-xs text-text-muted font-medium truncate select-all">{displayUrl}</p>
              {mode === 'invite' && (
                <p className="text-[11px] text-text-muted font-medium leading-relaxed mt-2 px-1">
                  When a designer joins with this link, you will be credited as their referrer.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 w-full">
              <button 
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-surface-interactive hover:bg-surface-hover text-text-primary font-semibold text-xs transition-all active:scale-[0.98] border border-border-subtle"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied" : "Copy Link"}</span>
              </button>
              <button 
                type="button"
                onClick={handleDownload}
                className="flex-[1.2] flex items-center justify-center gap-2 py-3 rounded-full bg-primary hover:bg-[#E5B011] text-brand-primary-fg font-semibold text-xs transition-all shadow-xs active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

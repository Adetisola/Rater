"use client";

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatarUrl?: string; // We can use this to optionally put a logo in the center if we want
}

export function QRCodeOverlay({ isOpen, onClose, username, avatarUrl }: QRCodeOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [processedAvatar, setProcessedAvatar] = useState<string | undefined>(undefined);
  
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/@${username}` : '';

  useEffect(() => {
    if (avatarUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = avatarUrl;
      img.onload = () => {
        const size = 200; // Resolution of the logo
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

        // Create circular clip for the image (slightly smaller for the border effect)
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.clip();

        // Draw image with "cover" logic to avoid squashing
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
      await navigator.clipboard.writeText(profileUrl);
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
      
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `rater-${username}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl overflow-hidden flex flex-col items-center border border-gray-100"
          >
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg text-[#111111]">Share Profile</h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors bg-gray-50"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* QR Code */}
            <div 
              ref={canvasRef}
              className="bg-white p-4 rounded-3xl border-2 border-gray-100 shadow-sm mb-6"
            >
              <QRCodeCanvas 
                value={profileUrl}
                size={220}
                bgColor={"#ffffff"}
                fgColor={"#111111"}
                level={"Q"}
                includeMargin={false}
                imageSettings={processedAvatar ? {
                    src: processedAvatar,
                    x: undefined,
                    y: undefined,
                    height: 52,
                    width: 52,
                    excavate: true,
                } : undefined}
              />
            </div>

            <div className="text-center mb-8">
              <p className="text-[17px] font-bold text-[#111111] mb-1">@{username}</p>
              <p className="text-sm text-gray-500 font-medium">rater-web.vercel.app/@{username}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <button 
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#111111] font-semibold text-sm transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy Link"}
              </button>
              <button 
                onClick={handleDownload}
                className="flex-[1.5] flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#FEC312] hover:bg-[#e6b00f] text-white font-semibold text-sm transition-colors shadow-sm shadow-[#FEC312]/20"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
            </div>
            
            <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-linear-to-bl from-[#FEC312]/10 to-transparent -mr-16 -mt-16 rounded-full pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

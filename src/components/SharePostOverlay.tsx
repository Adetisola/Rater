"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
const whatsappIcon = '/icons/icons8-whatsapp.svg';
const xIcon = '/icons/icons8-x.svg';
const linkedinIcon = '/icons/icons8-linkedin.svg';


interface SharePostOverlayProps {
  onClose: () => void;
  post_id: string;
}

export function SharePostOverlay({ onClose, post_id }: SharePostOverlayProps) {
  const shareUrl = `https://rater-web.vercel.app/post/${post_id}`;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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

      {/* Modal Content */}
      <div className="w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-center">
        
        <h2 className="text-2xl font-semibold text-black mb-2">Share this Post</h2>
        <p className="text-sm text-gray-500 mb-2">Help others review or learn from this design.</p>

        {/* URL Input */}
        <div className="flex items-center gap-2 border-2 border-[#111111] rounded-xl px-4 py-3 mb-6">
            <input 
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-sm text-gray-500 outline-none w-full"
            />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mb-8">
            <Button 
                variant="ghost"
                className="h-10 px-6 rounded-full text-base font-medium transition-all"
                onClick={onClose}
            >
                Close
            </Button>
            <Button 
                onClick={handleCopy}
                variant="outline"
                className={cn(
                    "px-8 h-12 rounded-full text-lg font-medium transition-all flex items-center gap-2",
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
                        Copied!
                    </>
                ) : (
                    "Copy Link"
                )}
            </Button>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 mb-4">
            <button className="hover:scale-105 transition-transform">
                <img src={whatsappIcon} className="h-12" alt="WhatsApp" />
            </button>
            <button className="hover:scale-105 transition-transform">
                <img src={xIcon} className="h-12" alt="X" />
            </button>
            <button className="hover:scale-105 transition-transform">
                <img src={linkedinIcon} className="h-14" alt="LinkedIn" />
            </button>
        </div>
        
        <p className="text-[10px] text-gray-400 italic">Shared posts are public.</p>

      </div>
    </div>,
    document.body
  );
}

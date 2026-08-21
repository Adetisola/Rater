"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { logShareEvent } from '@/lib/server/shareEvents';
const whatsappIcon = '/icons/icons8-whatsapp.svg';
const xIcon = '/icons/icons8-x.svg';
const linkedinIcon = '/icons/icons8-linkedin.svg';


interface SharePostOverlayProps {
  onClose: () => void;
  post_id: string;
}

export function SharePostOverlay({ onClose, post_id }: SharePostOverlayProps) {
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.raterapp.site'}/post/${post_id}`;
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
    logShareEvent(post_id, 'copy_link').catch(() => {});
  };

  const handleSocialShare = (platform: 'whatsapp' | 'x' | 'linkedin') => {
    logShareEvent(post_id, platform).catch(() => {});
    const encodedUrl = encodeURIComponent(shareUrl);
    const text = encodeURIComponent('Check out this design on Rater!');
    let target = '';
    if (platform === 'whatsapp') {
      target = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`;
    } else if (platform === 'x') {
      target = `https://x.com/intent/tweet?text=${text}&url=${encodedUrl}`;
    } else if (platform === 'linkedin') {
      target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    }
    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
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
        
        <h2 className="text-xl font-medium text-black mb-1">Share this Work</h2>
        <p className="text-sm text-gray-500 mb-4">Invite others to critique or study this work.</p>

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
            <button 
                type="button"
                onClick={() => handleSocialShare('whatsapp')}
                className="hover:scale-105 transition-transform"
                title="Share on WhatsApp"
            >
                <img src={whatsappIcon} className="h-12" alt="WhatsApp" />
            </button>
            <button 
                type="button"
                onClick={() => handleSocialShare('x')}
                className="hover:scale-105 transition-transform"
                title="Share on X"
            >
                <img src={xIcon} className="h-12" alt="X" />
            </button>
            <button 
                type="button"
                onClick={() => handleSocialShare('linkedin')}
                className="hover:scale-105 transition-transform"
                title="Share on LinkedIn"
            >
                <img src={linkedinIcon} className="h-14" alt="LinkedIn" />
            </button>
        </div>
        
        <p className="text-[10px] text-gray-400 italic">Shared works are public.</p>

      </div>
    </div>,
    document.body
  );
}

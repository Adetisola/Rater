"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
const whatsappIcon = '/icons/icons8-whatsapp.svg';
const xIcon = '/icons/icons8-x.svg';
const linkedinIcon = '/icons/icons8-linkedin.svg';


interface SharePostOverlayProps {
  onClose: () => void;
  postId: string;
}

export function SharePostOverlay({ onClose, postId }: SharePostOverlayProps) {
  const shareUrl = `http://rater.vercel.app/${postId}`;
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

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-center">
        
        <h2 className="text-2xl font-semibold text-[#111111] mb-2">Share this Post</h2>
        <p className="text-sm text-gray-500 mb-2">Help others review or learn from this design.</p>
        <p className="text-xs text-[#a77d00] font-medium mb-8">Attribution is claimed by the submitter.</p>

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
            <button 
                onClick={onClose}
                className="px-8 py-3 rounded-full text-sm font-semibold text-[#111111] hover:bg-[#FEC312] hover:text-white transition-all duration-300"
            >
                Close
            </button>
            <button 
                onClick={handleCopy}
                className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-500 flex items-center gap-2 ${
                    copied 
                    ? "bg-[#10b981] text-white border-2 border-[#10b981]" 
                    : "text-[#111111] border-2 border-[#FEC312] hover:bg-[#FEC312] hover:text-white"
                }`}
            >
                {copied ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                    </>
                ) : (
                    "Copy Link"
                )}
            </button>
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

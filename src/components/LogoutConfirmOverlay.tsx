"use client";

import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { LogOut, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LogoutConfirmOverlayProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmOverlay({ onClose, onConfirm }: LogoutConfirmOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="bg-white w-full max-w-sm rounded-[32px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 fade-in duration-200 text-center">
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogOut className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-2xl font-semibold mb-3 text-black">Confirm Logout</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
            Are you sure you want to log out? You'll need your passkey to sign back in.
        </p>

        <div className="flex flex-col gap-3">
            <Button 
                onClick={onConfirm}
                variant="outline"
                className="w-full h-12 rounded-full border-red-600 hover:bg-red-600 text-lg font-medium transition-all"
            >
                Yes, Logout
            </Button>
            <Button 
                onClick={onClose}
                variant="ghost"
                className="w-full h-12 rounded-full text-lg font-medium text-gray-500 transition-all"
            >
                Cancel
            </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

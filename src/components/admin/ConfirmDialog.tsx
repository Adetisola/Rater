"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!mounted || !isOpen) return null;

  const icons = {
    danger: <AlertCircle className="w-6 h-6 text-red-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    default: <Info className="w-6 h-6 text-blue-600" />,
  };

  const bgColors = {
    danger: 'bg-red-50',
    warning: 'bg-amber-50',
    default: 'bg-blue-50',
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation();
        if (!isLoading) onCancel();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Dialog */}
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 relative z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100 disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${bgColors[variant]} shrink-0`}>
            {icons[variant]}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'primary' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
            className={`h-10 px-5 rounded-xl text-sm font-bold shadow-none ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white border-transparent'
                : variant === 'warning'
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
                : ''
            }`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

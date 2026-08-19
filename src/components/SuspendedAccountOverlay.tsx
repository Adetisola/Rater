"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Mail, X } from 'lucide-react';
import { Button } from './ui/Button';

interface SuspendedAccountOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuspendedAccountOverlay({ isOpen, onClose }: SuspendedAccountOverlayProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 text-center overflow-hidden z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Status Icon */}
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5 text-red-600 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Suspended
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Your account has been suspended following moderation review. You have been signed out of this session. If you believe this is a mistake, you can submit an appeal to our team.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <a
              href="mailto:support@raterapp.site?subject=Account%20Suspension%20Appeal"
              className="w-full"
            >
              <Button
                variant="primary"
                className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                <span>Appeal to Support</span>
              </Button>
            </a>

            <Button
              variant="outline"
              onClick={onClose}
              className="w-full h-11 rounded-2xl font-medium text-sm text-gray-600 hover:bg-gray-50 border-gray-200"
            >
              Dismiss
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

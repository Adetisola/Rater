"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  docUrl: string;
}

export function LegalModal({ isOpen, onClose, title, docUrl }: LegalModalProps) {
  const [content, setContent] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    setContent('');
    setEffectiveDate(null);
  }, [docUrl]);

  useEffect(() => {
    if (isOpen && docUrl && !content) {
      setIsLoading(true);
      fetch(docUrl)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.text();
        })
        .then(text => {
          const match = text.match(/\*\*Effective Date:\*\*\s*(.*)/i);
          if (match) {
            setEffectiveDate(match[1].trim());
            setContent(text.replace(/\*\*Effective Date:\*\*\s*.*\n*/i, '').trim());
          } else {
            setEffectiveDate(null);
            setContent(text);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to load legal document', err);
          setContent('Failed to load document.');
          setIsLoading(false);
        });
    }
  }, [isOpen, docUrl, content]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-semibold text-black">{title}</h2>
              <div className="flex items-center gap-4">
                {effectiveDate && (
                  <span className="text-[13px] font-medium text-gray-400">
                    {effectiveDate}
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="markdown-content text-[15px] leading-relaxed text-gray-600">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

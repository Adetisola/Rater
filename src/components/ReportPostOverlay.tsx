"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { LegalModal } from './LegalModal';

interface ReportPostOverlayProps {
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

const REPORT_REASONS = [
  "Not the original creator",
  "Copied from another source",
  "Misleading or incomplete credit",
  "Impersonation",
  "Offensive or abusive",
  "Other issue"
];

export function ReportPostOverlay({ onClose, onSubmit }: ReportPostOverlayProps) {
  const [reason, setReason] = useState('Select');
  const [details, setDetails] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; title: string; docUrl: string }>({
    isOpen: false,
    title: '',
    docUrl: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const openLegal = (title: string, docUrl: string) => {
    setLegalModal({ isOpen: true, title, docUrl });
  };

  const handleSubmit = () => {
    if (reason === 'Select') return;
    setIsSubmitted(true);
  };

  const handleDone = () => {
    onSubmit(reason, details);
  };

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
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
        
        {!isSubmitted ? (
            <>
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-black mb-2">Report this Post</h2>
                    <p className="text-sm text-gray-500">Help us understand what's wrong with this post.</p>
                </div>

                {/* Reason Dropdown */}
                <div className="mb-6 relative">
                    <label className="block text-sm font-semibold text-black mb-2">Reason for report</label>
                    <button 
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-left flex items-center justify-between text-sm font-medium hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <span className={reason === 'Select' ? 'text-gray-400' : 'text-black'}>{reason}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-primary rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                            {REPORT_REASONS.map((r) => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setReason(r);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-black font-medium border-b border-gray-50 last:border-0"
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Textarea */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-black mb-2">Tell us more (optional)</label>
                    <div className="relative">
                        <textarea 
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            maxLength={120}
                            className="w-full h-32 bg-white border border-gray-200 rounded-xl p-4 pb-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            placeholder=""
                        />
                        <div className="absolute bottom-3 right-4 text-xs font-medium text-gray-400">
                            {details.length}/120
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-6">
                    <p className="text-[12px] text-gray-500 text-center leading-relaxed">
                        Reports are reviewed according to our{' '}
                        <button type="button" onClick={() => openLegal('Community Guidelines', '/legal/Rater Community Guidelines.md')} className="font-semibold text-gray-600 hover:text-black transition-colors">Community Guidelines</button>.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <Button 
                        variant="ghost"
                        onClick={onClose}
                        className="h-12 px-6 rounded-full text-base font-medium text-gray-500 transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        disabled={reason === 'Select'}
                        onClick={handleSubmit}
                        className="min-w-[140px] h-12 rounded-full text-lg font-medium transition-all"
                    >
                        Report
                    </Button>
                </div>
            </>
        ) : (
            <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-300">
                 <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-bold text-black mb-2">Report Submitted</h2>
                 <p className="text-sm text-gray-500 mb-8 max-w-[280px] mx-auto leading-relaxed">
                    Thanks for letting us know. We appreciate your help in keeping our community safe.
                 </p>
                 <Button onClick={handleDone} className="w-full rounded-full py-6 text-sm font-bold shadow-none">
                    Done
                 </Button>
            </div>
        )}

      </div>
      
      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
        title={legalModal.title}
        docUrl={legalModal.docUrl}
      />
    </div>,
    document.body
  );
}

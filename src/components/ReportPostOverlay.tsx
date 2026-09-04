"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { createReport } from '@/lib/admin/server';

interface ReportPostOverlayProps {
  postId?: string;
  targetType?: 'post' | 'profile' | 'reply' | 'review';
  targetId?: string;
  onClose: () => void;
  onSubmit?: (reason: string, details: string) => void;
}

const REPORT_REASONS = [
  "Not the original creator",
  "Copied from another source",
  "Misleading or incomplete credit",
  "Impersonation",
  "Offensive or abusive",
  "Other issue"
];

export function ReportPostOverlay({
  postId,
  targetType = 'post',
  targetId,
  onClose,
  onSubmit,
}: ReportPostOverlayProps) {
  const [reason, setReason] = useState('Select');
  const [details, setDetails] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const effectiveTargetId = targetId || postId || '';
  const titleText =
    targetType === 'reply'
      ? 'Report this Reply'
      : targetType === 'review'
      ? 'Report this Critique'
      : targetType === 'profile'
      ? 'Report this Profile'
      : 'Report this Work';

  const subtitleText =
    targetType === 'reply'
      ? "Help us understand what's wrong with this reply."
      : targetType === 'review'
      ? "Help us understand what's wrong with this critique."
      : targetType === 'profile'
      ? "Help us understand what's wrong with this profile."
      : "Help us understand what's wrong with this work.";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async () => {
    if (reason === 'Select' || !effectiveTargetId) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await createReport({
        target_type: targetType,
        target_id: effectiveTargetId,
        reason,
        details: details.trim() || undefined,
      });

      setIsSubmitted(true);
      if (onSubmit) {
        onSubmit(reason, details);
      }
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      setSubmitError(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    onClose();
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
          if (!isSubmitting) onClose();
        }}
      />

      {/* Modal Content */}
      <div className="w-full max-w-md bg-surface-elevated rounded-[32px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-border-default">
        
        {!isSubmitted ? (
            <>
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-medium text-text-primary mb-1">{titleText}</h2>
                    <p className="text-sm text-text-secondary">{subtitleText}</p>
                </div>

                {submitError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">
                    {submitError}
                  </div>
                )}

                {/* Reason Dropdown */}
                <div className="mb-6 relative">
                    <label className="block text-sm font-medium text-text-primary mb-2">Reason for report</label>
                    <button 
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isSubmitting}
                        className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-left flex items-center justify-between text-sm font-medium hover:border-border-strong transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <span className={reason === 'Select' ? 'text-text-muted' : 'text-text-primary'}>{reason}</span>
                        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-border-default rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                            {REPORT_REASONS.map((r) => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setReason(r);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm hover:bg-surface-hover transition-colors text-text-primary font-medium border-b border-border-default last:border-0"
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Textarea */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-text-primary mb-2">Tell us more (optional)</label>
                    <div className="relative">
                        <textarea 
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            maxLength={120}
                            disabled={isSubmitting}
                            className="w-full h-32 bg-input-bg border border-input-border text-text-primary rounded-xl p-4 pb-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-text-muted"
                            placeholder=""
                        />
                        <div className="absolute bottom-3 right-4 text-xs font-medium text-text-muted">
                            {details.length}/120
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-6">
                    <p className="text-[12px] text-text-secondary text-center leading-relaxed">
                        Reports are reviewed according to our{' '}
                        <a href="/legal/community-guidelines" target="_blank" rel="noopener noreferrer" className="font-semibold text-text-primary hover:text-primary transition-colors underline">Community Guidelines</a>.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <Button 
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-12 px-6 rounded-full text-base font-medium text-text-secondary transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        disabled={reason === 'Select' || isSubmitting}
                        onClick={handleSubmit}
                        className="min-w-[140px] h-12 rounded-full text-base font-bold transition-all inline-flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Report'
                        )}
                    </Button>
                </div>
            </>
        ) : (
            <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-300">
                 <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10" />
                 </div>
                 <h2 className="text-xl font-medium text-text-primary mb-2">Report Submitted</h2>
                 <p className="text-sm text-text-secondary mb-8 max-w-[280px] mx-auto leading-relaxed">
                    Thanks for letting us know. We appreciate your help in keeping our community safe.
                 </p>
                 <Button variant='outline' onClick={handleDone} className="w-full rounded-full py-6 shadow-none">
                    Done
                 </Button>
            </div>
        )}

      </div>
    </div>,
    document.body
  );
}

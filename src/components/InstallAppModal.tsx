"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Smartphone, 
  Monitor, 
  Apple, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  Download, 
  Sparkles
} from 'lucide-react';
import { usePWAInstall, type PlatformType } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlatform?: PlatformType;
}

export function InstallAppModal({ isOpen, onClose, defaultPlatform }: InstallAppModalProps) {
  const { isInstallable, platform: detectedPlatform, installApp } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<PlatformType>(defaultPlatform || detectedPlatform);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActivePlatform(defaultPlatform || detectedPlatform);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, defaultPlatform, detectedPlatform]);

  if (!mounted || !isOpen) return null;

  const handleTryNativeInstall = async () => {
    const res = await installApp();
    if (res.outcome === 'accepted') {
      onClose();
    }
  };

  const PLATFORMS: { id: PlatformType; label: string; icon: any }[] = [
    { id: 'ios', label: 'iOS (Safari)', icon: Apple },
    { id: 'android', label: 'Android', icon: Smartphone },
    { id: 'desktop', label: 'Desktop (Chrome/Edge)', icon: Monitor },
    { id: 'mac', label: 'Mac (Safari)', icon: Apple },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md bg-surface-primary rounded-[32px] p-6 sm:p-7 shadow-2xl overflow-hidden flex flex-col border border-border-default"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-primary/20 flex items-center justify-center shadow-2xs">
                  <img
                    src="/icons/rater-logo-white-bg.svg"
                    alt="Rater"
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary tracking-tight">Install Rater App</h3>
                  <p className="text-[11px] text-text-secondary">Fast studio access & native experience</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-secondary transition-colors bg-surface-secondary text-text-muted hover:text-text-primary"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Feature Perks */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-default text-center">
                <p className="text-[11px] font-bold text-text-primary">Instant Launch</p>
                <p className="text-[10px] text-text-muted mt-0.5">From Dock or Home</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-default text-center">
                <p className="text-[11px] font-bold text-text-primary">Full Screen</p>
                <p className="text-[10px] text-text-muted mt-0.5">No browser address bar</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-default text-center">
                <p className="text-[11px] font-bold text-text-primary">Push Alerts</p>
                <p className="text-[10px] text-text-muted mt-0.5">Realtime critiques</p>
              </div>
            </div>

            {/* Native Install Action (if available) */}
            {isInstallable && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-primary/20 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-primary shrink-0" />
                  <p className="text-xs font-semibold text-text-primary">1-Click Install Available</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleTryNativeInstall}
                  className="h-8 px-3 text-xs font-bold rounded-xl shadow-2xs"
                >
                  <Download size={13} className="mr-1" />
                  <span>Install Now</span>
                </Button>
              </div>
            )}

            {/* Platform Segmented Switcher */}
            <div className="flex items-center p-1 bg-surface-secondary rounded-2xl mb-4 border border-border-default gap-1 overflow-x-auto">
              {PLATFORMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePlatform === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePlatform(item.id)}
                    className={cn(
                      "flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap",
                      isActive
                        ? "bg-surface-primary text-text-primary shadow-2xs border border-border-default"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <Icon size={13} className={isActive ? "text-text-primary" : "text-text-muted"} />
                    <span>{item.id === 'desktop' ? 'Chrome/Edge' : item.id === 'ios' ? 'iOS' : item.id === 'android' ? 'Android' : 'Mac'}</span>
                  </button>
                );
              })}
            </div>

            {/* Step-by-Step Instructions Container */}
            <div className="rounded-2xl border border-border-default bg-surface-secondary p-4 space-y-3 mb-5">
              {activePlatform === 'ios' && (
                <div className="space-y-2.5 text-xs text-text-secondary">
                  <p className="font-bold text-text-primary flex items-center gap-1.5 text-xs">
                    <Apple size={14} className="text-text-primary" />
                    <span>Installing on iPhone / iPad (Safari):</span>
                  </p>
                  <ol className="space-y-2 text-text-secondary pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">1</span>
                      <span>Tap the <strong className="text-text-primary font-semibold inline-flex items-center gap-1"><Share2 size={13} className="text-primary" /> Share</strong> icon at the bottom of Safari.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">2</span>
                      <span>Scroll down and tap <strong className="text-text-primary font-semibold inline-flex items-center gap-1"><PlusSquare size={13} /> &quot;Add to Home Screen&quot;</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">3</span>
                      <span>Tap <strong className="text-text-primary font-semibold">&quot;Add&quot;</strong> in the top right to complete.</span>
                    </li>
                  </ol>
                </div>
              )}

              {activePlatform === 'android' && (
                <div className="space-y-2.5 text-xs text-text-secondary">
                  <p className="font-bold text-text-primary flex items-center gap-1.5 text-xs">
                    <Smartphone size={14} className="text-text-primary" />
                    <span>Installing on Android (Chrome & Samsung Internet):</span>
                  </p>
                  <ol className="space-y-2 text-text-secondary pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">1</span>
                      <span>
                        In <strong className="text-text-primary font-semibold">Chrome</strong>: tap the <strong className="text-text-primary font-semibold inline-flex items-center gap-0.5"><MoreVertical size={12} /> Menu</strong> (3 dots).<br />
                        In <strong className="text-text-primary font-semibold">Samsung Internet</strong>: tap the <strong className="text-text-primary font-semibold">☰ Menu</strong> or the <strong className="text-text-primary font-semibold">Install (↓)</strong> icon in the address bar.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">2</span>
                      <span>
                        Tap <strong className="text-text-primary font-semibold">&quot;Install app&quot;</strong>, or select <strong className="text-text-primary font-semibold">&quot;+ Add page to&quot; → &quot;Home screen&quot;</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">3</span>
                      <span>Confirm by tapping <strong className="text-text-primary font-semibold">&quot;Install&quot;</strong> or <strong className="text-text-primary font-semibold">&quot;Add&quot;</strong>.</span>
                    </li>
                  </ol>
                </div>
              )}

              {activePlatform === 'desktop' && (
                <div className="space-y-2.5 text-xs text-text-secondary">
                  <p className="font-bold text-text-primary flex items-center gap-1.5 text-xs">
                    <Monitor size={14} className="text-text-primary" />
                    <span>Installing on Desktop (Chrome or Edge):</span>
                  </p>
                  <ol className="space-y-2 text-text-secondary pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">1</span>
                      <span>Look at the right side of the address bar at the top of your browser.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">2</span>
                      <span>Click the <strong className="text-text-primary font-semibold inline-flex items-center gap-1"><Download size={13} className="text-primary" /> Install Rater</strong> icon.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">3</span>
                      <span>Click <strong className="text-text-primary font-semibold">&quot;Install&quot;</strong> to add Rater to your applications and desktop dock.</span>
                    </li>
                  </ol>
                </div>
              )}

              {activePlatform === 'mac' && (
                <div className="space-y-2.5 text-xs text-text-secondary">
                  <p className="font-bold text-text-primary flex items-center gap-1.5 text-xs">
                    <Apple size={14} className="text-text-primary" />
                    <span>Installing on Mac (Safari 17+):</span>
                  </p>
                  <ol className="space-y-2 text-text-secondary pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">1</span>
                      <span>Click <strong className="text-text-primary font-semibold">File</strong> in the top Mac menu bar, or click the <strong className="text-text-primary font-semibold inline-flex items-center gap-1"><Share2 size={13} className="text-primary" /> Share</strong> button.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">2</span>
                      <span>Select <strong className="text-text-primary font-semibold">&quot;Add to Dock...&quot;</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-[10px] font-bold text-text-primary shrink-0 mt-0.5">3</span>
                      <span>Click <strong className="text-text-primary font-semibold">&quot;Add&quot;</strong> to launch Rater directly from your Mac Dock.</span>
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Footer Close */}
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full h-10 rounded-full text-xs font-bold"
            >
              Done
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

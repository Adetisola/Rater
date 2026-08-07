"use client";

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { downloadPostImage } from '../lib/postActions';
import { showToast } from './GlobalOverlays';
import type { Post } from '@/types';
import { Loader2, Check, Download } from 'lucide-react';
import { extractPublicId, generateThumbnail } from '@/lib/cloudinary/transforms';

interface DownloadImageOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export function DownloadImageOverlay({ isOpen, onClose, post }: DownloadImageOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [downloadingIndices, setDownloadingIndices] = useState<number[]>([]);
  const [downloadedIndices, setDownloadedIndices] = useState<number[]>([]);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const images = useMemo(() => {
    if (post.media && post.media.length > 0) {
      return post.media.map(m => m.url);
    }
    if (post.image_url) {
      return [post.image_url];
    }
    return [];
  }, [post]);

  const getThumbUrl = (url: string) => {
    const publicId = extractPublicId(url);
    if (publicId) {
      return generateThumbnail(publicId, 150, 150);
    }
    return url;
  };

  const handleDownloadSingle = async (url: string, index: number, closeAfter = false) => {
    if (downloadingIndices.includes(index) || downloadedIndices.includes(index)) return;
    
    setDownloadingIndices(prev => [...prev, index]);
    try {
      const suffix = images.length > 1 ? `_${index + 1}` : '';
      await downloadPostImage(url, `${post.title}${suffix}`);
      setDownloadedIndices(prev => [...prev, index]);
      if (closeAfter) onClose();
    } catch (e) {
      console.error("Download failed:", e);
      showToast("Couldn't download image. Please try again.", "error");
    } finally {
      setDownloadingIndices(prev => prev.filter(i => i !== index));
    }
  };

  const handleDownloadAll = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);

    let hasError = false;
    for (let i = 0; i < images.length; i++) {
      if (downloadedIndices.includes(i)) continue; // Skip already downloaded

      setDownloadingIndices(prev => [...prev, i]);
      try {
        const suffix = images.length > 1 ? `_${i + 1}` : '';
        await downloadPostImage(images[i], `${post.title}${suffix}`);
        setDownloadedIndices(prev => [...prev, i]);
      } catch (e) {
        console.error(`Download failed for image ${i + 1}:`, e);
        hasError = true;
      } finally {
        setDownloadingIndices(prev => prev.filter(idx => idx !== i));
      }
      // Wait 300ms between downloads to avoid popup blockers
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsDownloadingAll(false);
    if (hasError) {
      showToast("Some images couldn't be downloaded.", "error");
    } else {
      onClose(); // Automatically close when all succeed
    }
  };

  if (!mounted || !isOpen || images.length === 0) return null;

  const hasDownloadedAny = downloadedIndices.length > 0;
  const allDownloaded = downloadedIndices.length === images.length;

  return createPortal(
    <div 
      className="fixed inset-0 z-60 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
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
          if (!isDownloadingAll && downloadingIndices.length === 0) onClose();
        }}
      />

      {/* Modal Content */}
      <div className="w-full sm:max-w-100 bg-white rounded-t-4xl sm:rounded-4xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-xl font-medium text-black mb-1">Download Images</h2>
          <p className="text-sm text-gray-500">Save images to your device</p>
        </div>

        {/* Scrollable vertical list */}
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 hide-scrollbar -mx-2 px-2 pb-2">
          {images.map((url, index) => {
            const isDownloading = downloadingIndices.includes(index);
            const isDownloaded = downloadedIndices.includes(index);
            
            return (
              <div 
                key={index}
                className={cn(
                  "flex items-center justify-between p-2 rounded-2xl transition-colors",
                  "border border-transparent hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className={cn(
                    "relative w-14 h-14 rounded-xl overflow-hidden shrink-0"
                  )}>
                    <img 
                      src={getThumbUrl(url)} 
                      alt={`Image ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Label */}
                  <div className="flex flex-col justify-center">
                    <span className="text-sm font-medium text-gray-900">
                      Image {index + 1}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleDownloadSingle(url, index)}
                  disabled={isDownloading || isDownloaded || isDownloadingAll}
                  aria-label={`Download image ${index + 1}`}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                    isDownloaded 
                      ? "bg-green-100 text-green-600" 
                      : "bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-white hover:text-black active:scale-95 disabled:opacity-50"
                  )}
                >
                  {isDownloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isDownloaded ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-gray-100 shrink-0 flex flex-col gap-3">
            <Button 
                variant='outline'
                onClick={handleDownloadAll}
                disabled={isDownloadingAll || allDownloaded}
                className={cn(
                  "h-12 w-full rounded-full flex items-center justify-center gap-2 transition-all",
                  allDownloaded ? "bg-green-500 text-white hover:bg-green-600" : ""
                )}
            >
                {isDownloadingAll ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Downloading...
                  </>
                ) : allDownloaded ? (
                  <>
                    <Check className="w-5 h-5" strokeWidth={3} />
                    All Downloaded
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download All
                  </>
                )}
            </Button>
            
            <Button 
                variant="ghost"
                className="h-10 w-full rounded-full text-sm font-medium text-gray-500 transition-all"
                onClick={onClose}
                disabled={isDownloadingAll}
            >
                {hasDownloadedAny ? "Done" : "Cancel"}
            </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

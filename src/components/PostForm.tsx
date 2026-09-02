"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Check, FileUp, Lock, CloudUpload, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from './ui/Input';
import { UserAvatar } from './UserAvatar';
import { Textarea } from './ui/Textarea';
import { RichTextarea } from './ui/RichTextarea';
import type { Post, Category } from '@/types';
import { AI_TOOLS } from '@/types';
import type { UploadProgressEvent } from '@/lib/cloudinary/uploads';
import { CATEGORIES } from '@/constants/categories';
import { useAuthState } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { AuthOverlay } from './AuthOverlay';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from 'next/link';
import { AmbientSuccessText } from './AmbientSuccessText';
import { showToast } from './GlobalOverlays';
import { compressImage } from '@/lib/image/compress';
import { perf } from '@/utils/perf';

const lobeIconMap: Record<string, string> = {
  chatgpt: 'openai',
  midjourney: 'midjourney',
  gemini: 'gemini',
  claude: 'claude',
  'stable-diffusion': 'stability',
  dalle: 'dalle',
  'nano-banana': 'nanobanana',
  ideogram: 'ideogram'
};

function getAiToolLogo(toolId: string) {
  const lobeId = lobeIconMap[toolId];
  if (lobeId) {
    const isMonoOnly = lobeId === 'openai' || lobeId === 'midjourney' || lobeId === 'ideogram';
    const suffix = isMonoOnly ? '' : '-color';
    return `/ai-tools/${lobeId}${suffix}.svg`;
  }
  return `/ai-tools/${toolId}.svg`;
}

interface PostFormProps {
  initialPost?: Post | null;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
  isOverlay?: boolean;
}

export function PostForm({ initialPost, mode, onSuccess, onCancel, isOverlay = false }: PostFormProps) {
  const formMode = mode || (initialPost ? 'edit' : 'create');
  const isEditMode = formMode === 'edit';
  const isEditing = !!initialPost;

  // FORM STATE
  const [title, setTitle] = useState(initialPost?.title || '');
  const [category, setCategory] = useState<Category | ''>(initialPost?.category || '');

  // CATEGORY AUTOCOMPLETE STATE
  const [categoryInputValue, setCategoryInputValue] = useState(initialPost?.category || '');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [categoryError, setCategoryError] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const filteredCategories = useMemo(() => {
    if (!categoryInputValue.trim()) return CATEGORIES;
    return CATEGORIES.filter(c =>
      c.toLowerCase().includes(categoryInputValue.toLowerCase())
    );
  }, [categoryInputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [description, setDescription] = useState(initialPost?.description || '');

  // AI FIELDS
  const [usesAI, setUsesAI] = useState(
    Boolean(initialPost?.uses_ai || initialPost?.ai_tool || initialPost?.ai_prompt)
  );
  const [aiTool, setAiTool] = useState<string>(
    initialPost?.ai_tool 
      ? (AI_TOOLS.some(t => t.id === initialPost.ai_tool) ? initialPost.ai_tool : 'other') 
      : ''
  );
  const [customAiTool, setCustomAiTool] = useState<string>(
    initialPost?.ai_tool && !AI_TOOLS.some(t => t.id === initialPost.ai_tool) 
      ? initialPost.ai_tool 
      : ''
  );
  const [aiPrompt, setAiPrompt] = useState(initialPost?.ai_prompt ?? '');
  const [isAiToolDropdownOpen, setIsAiToolDropdownOpen] = useState(false);

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>(
    initialPost ? (initialPost.media ? initialPost.media.map(m => m.url) : [initialPost.image_url]) : []
  );
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // IDENTITY STATE
  const { currentProfile } = useAuthState();
  const { addPost, updatePost } = usePosts();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dotLottie, setDotLottie] = useState<any>(null);

  // UPLOAD PROGRESS STATE
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null);
  const [inlineUploadError, setInlineUploadError] = useState<string | null>(null);

  // Duplicate submission guard — prevents double-tap / double-click
  const isSubmitLockedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Trigger onSuccess only after Lottie plays once or fallback timeout
  useEffect(() => {
    if (!isSuccess) return;

    let fallbackTimeout: NodeJS.Timeout;
    let completed = false;

    const handleComplete = () => {
      if (completed) return;
      completed = true;
      clearTimeout(fallbackTimeout);
      onSuccess?.();
    };

    // Fallback: If Lottie fails to load or play within 4.0s, close anyway
    fallbackTimeout = setTimeout(() => {
      handleComplete();
    }, 4000);

    if (dotLottie) {
      dotLottie.addEventListener('complete', handleComplete);
    }

    return () => {
      clearTimeout(fallbackTimeout);
      if (dotLottie) {
        dotLottie.removeEventListener('complete', handleComplete);
      }
    };
  }, [isSuccess, dotLottie, onSuccess]);

  // --- DRAFT PERSISTENCE ---
  useEffect(() => {
    if (formMode === 'create') {
      const saved = localStorage.getItem('rater_post_form_draft');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.title) setTitle(draft.title);
          if (draft.description) setDescription(draft.description);
          if (draft.categoryInputValue) {
            setCategoryInputValue(draft.categoryInputValue);
            if (CATEGORIES.includes(draft.categoryInputValue as Category)) {
              setCategory(draft.categoryInputValue as Category);
            }
          }
        } catch (e) {
          console.error('Failed to parse post draft', e);
        }
      }
    }
  }, [formMode]);

  useEffect(() => {
    if (formMode !== 'create') return;

    const timeout = setTimeout(() => {
      const draft = { title, description, categoryInputValue };
      const hasContent = title.trim() || description.trim() || categoryInputValue.trim();
      if (hasContent) {
        localStorage.setItem('rater_post_form_draft', JSON.stringify(draft));
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [title, description, categoryInputValue, formMode]);

  const hasChanges = useMemo(() => {
    if (!initialPost) return true;
    
    // Check if media changed (added, deleted, or reordered)
    const originalMediaUrls = initialPost.media?.map(m => m.url) || [initialPost.image_url];
    const mediaChanged = 
      mediaPreviews.length !== originalMediaUrls.length ||
      mediaPreviews.some((url, i) => url !== originalMediaUrls[i]);

    const originalUsesAI = Boolean(initialPost.uses_ai || initialPost.ai_tool || initialPost.ai_prompt);
    const originalAiTool = initialPost.ai_tool 
      ? (AI_TOOLS.some(t => t.id === initialPost.ai_tool) ? initialPost.ai_tool : 'other') 
      : '';
    const originalCustomAiTool = initialPost.ai_tool && !AI_TOOLS.some(t => t.id === initialPost.ai_tool) 
      ? initialPost.ai_tool 
      : '';
    
    return (
      title !== initialPost.title ||
      category !== initialPost.category ||
      description !== (initialPost.description || '') ||
      mediaFiles.length > 0 ||
      mediaChanged ||
      usesAI !== originalUsesAI ||
      (usesAI && aiTool !== originalAiTool) ||
      (usesAI && aiTool === 'other' && customAiTool !== originalCustomAiTool) ||
      (usesAI && aiPrompt !== (initialPost.ai_prompt || ''))
    );
  }, [initialPost, title, category, description, mediaFiles, mediaPreviews, usesAI, aiTool, customAiTool, aiPrompt]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Compression cache keyed by file signature to avoid re-compressing
  const compressionCacheRef = useRef<Map<string, Promise<File>>>(new Map());
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Upload progress UI state
  const [uploadingIndexes, setUploadingIndexes] = useState<Set<number>>(new Set());
  const [imageUploadPercents, setImageUploadPercents] = useState<Record<number, number>>({});

  // Helper to get file signature
  const getFileSignature = useCallback((file: File) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }, []);

  const validateAndAddImages = (files: FileList | File[]) => {
    setUploadError(null);
    const newFiles = [...mediaFiles];
    const newPreviews = [...mediaPreviews];
    let hasError = false;

    // Start timing from initial selection if not already timing
    if (newFiles.length === 0) {
      perf.mark('Total Time from Selection to Post');
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (newFiles.length >= 5) {
        setUploadError("Maximum 5 images allowed.");
        hasError = true;
        break;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (file.type === 'image/gif' || fileExtension === '.gif') {
        setUploadError("GIFs are not supported.");
        hasError = true;
        continue;
      }

      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        setUploadError("Unsupported image format. Allowed: PNG, JPG, WebP, AVIF.");
        hasError = true;
        continue;
      }

      if (file.size > 8 * 1024 * 1024) {
        setUploadError("Each image must be under 8MB.");
        hasError = true;
        continue;
      }

      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));

      // Schedule background compression
      const sig = getFileSignature(file);
      if (!compressionCacheRef.current.has(sig)) {
        if (debounceTimersRef.current.has(sig)) {
          clearTimeout(debounceTimersRef.current.get(sig));
        }
        const timer = setTimeout(() => {
          perf.mark(`Background Compress - ${file.name}`);
          const compressionPromise = compressImage(file).then(res => {
            perf.end(`Background Compress - ${file.name}`);
            return res;
          });
          compressionCacheRef.current.set(sig, compressionPromise);
          debounceTimersRef.current.delete(sig);
        }, 200);
        debounceTimersRef.current.set(sig, timer);
      }
    }

    if (!hasError) setUploadError(null);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
    if (newPreviews.length > mediaPreviews.length) {
      setActivePreviewIndex(newPreviews.length - 1);
    }
  };

  const removeMedia = (index: number) => {
    const previewToRemove = mediaPreviews[index];
    const fileToRemove = mediaFiles[index];
    
    // Revoke object URL if it's a blob to free memory
    if (previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }
    
    // Cancel any pending compression
    if (fileToRemove) {
      const sig = getFileSignature(fileToRemove);
      if (debounceTimersRef.current.has(sig)) {
        clearTimeout(debounceTimersRef.current.get(sig));
        debounceTimersRef.current.delete(sig);
      }
      // Note: we don't necessarily delete from compressionCacheRef here, 
      // as the promise might already be running and removing it wouldn't stop the CPU work.
      // But clearing the timeout prevents it from starting if it hasn't yet.
    }
    
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (activePreviewIndex >= next.length) {
        setActivePreviewIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleDragStartThumbnail = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOverThumbnail = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const activeItem = mediaPreviews[activePreviewIndex];

    const reorderedPreviews = [...mediaPreviews];
    const reorderedFiles = [...mediaFiles];

    const [draggedPreview] = reorderedPreviews.splice(draggedIndex, 1);
    reorderedPreviews.splice(index, 0, draggedPreview);

    if (reorderedFiles.length > 0) {
      const [draggedFile] = reorderedFiles.splice(draggedIndex, 1);
      reorderedFiles.splice(index, 0, draggedFile);
      setMediaFiles(reorderedFiles);
    }

    setDraggedIndex(index);
    setMediaPreviews(reorderedPreviews);

    const newActiveIndex = reorderedPreviews.indexOf(activeItem);
    if (newActiveIndex !== -1) {
      setActivePreviewIndex(newActiveIndex);
    }
  };

  const handleDragEndThumbnail = () => {
    setDraggedIndex(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddImages(e.target.files);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null) return;
    
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null) return;
    
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (draggedIndex !== null) {
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddImages(e.dataTransfer.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerFileInput();
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!currentProfile) return;

    // Duplicate-submission guard
    if (isSubmitLockedRef.current) return;
    isSubmitLockedRef.current = true;

    if (!title.trim() || !categoryInputValue.trim()) {
      showToast("Title and Category are required.", "error");
      isSubmitLockedRef.current = false;
      return;
    }

    if (!category || !CATEGORIES.includes(category as Category)) {
      setCategoryError(true);
      isSubmitLockedRef.current = false;
      return;
    }
    setCategoryError(false);

    if (usesAI) {
      if (!aiTool) {
        showToast("Please select the AI tool you used.", "error");
        isSubmitLockedRef.current = false;
        return;
      }
      if (aiTool === 'other' && !customAiTool.trim()) {
        showToast("Please specify the custom AI tool you used.", "error");
        isSubmitLockedRef.current = false;
        return;
      }
      if (aiPrompt.length > 8000) {
        showToast("AI Prompt exceeds the 8,000 character limit.", "error");
        isSubmitLockedRef.current = false;
        return;
      }
    }

    if (mediaFiles.length === 0 && mediaPreviews.length === 0) {
      showToast("At least one image is required.", "error");
      isSubmitLockedRef.current = false;
      return;
    }

    // Stop the selection timer if it was running
    try { perf.end('Total Time from Selection to Post'); } catch (e) {}
    perf.mark('Total Pipeline Execution');

    setIsSubmitting(true);
    setInlineUploadError(null);
    setUploadProgress({ total: mediaFiles.length || 1, completed: 0, percent: 0, stage: 'preparing' });

    let newlyUploadedAssets: import('@/types').MediaAsset[] = [];
    try {
      const finalAssets: import('@/types').MediaAsset[] = [];
      const { uploadMediaBatch } = await import('@/lib/cloudinary/uploads');

      const blobCount = mediaPreviews.filter(p => p.startsWith('blob:')).length;

      const filesToUpload: { file: File, order: number }[] = [];
      let fileIndex = 0;

      for (let i = 0; i < mediaPreviews.length; i++) {
        const previewUrl = mediaPreviews[i];
        if (previewUrl.startsWith('blob:')) {
          const file = mediaFiles[fileIndex];
          if (file) {
            filesToUpload.push({ file, order: i });
          }
          fileIndex++;
        } else {
          const existing = initialPost?.media?.find(m => m.url === previewUrl);
          if (existing) {
            finalAssets.push({ ...existing, order: i });
          } else {
            finalAssets.push({
              id: crypto.randomUUID(),
              type: 'image',
              url: previewUrl,
              public_id: '',
              width: 800,
              height: 600,
              aspect_ratio: 800 / 600,
              format: 'jpg',
              bytes: 0,
              order: i
            });
          }
        }
      }

      if (filesToUpload.length > 0) {
        perf.mark('Wait for Compression');
        setUploadProgress({ total: blobCount, completed: 0, percent: 10, stage: 'compressing' });
        
        const compressedFiles = await Promise.all(
          filesToUpload.map(async (item) => {
            const sig = getFileSignature(item.file);
            if (compressionCacheRef.current.has(sig)) {
              return await compressionCacheRef.current.get(sig)!;
            }
            // Fallback
            perf.mark(`Inline Compress - ${item.file.name}`);
            const res = await compressImage(item.file);
            perf.end(`Inline Compress - ${item.file.name}`);
            return res;
          })
        );
        perf.end('Wait for Compression');

        perf.mark('Cloudinary Upload Batch');
        setUploadProgress({ total: blobCount, completed: 0, percent: 20, stage: 'uploading' });
        
        const uploadingSet = new Set<number>();
        filesToUpload.forEach(f => uploadingSet.add(f.order));
        setUploadingIndexes(uploadingSet);

        let overallProgress = 20;
        const folder = currentProfile ? `rater/posts/${currentProfile.id.trim()}` : undefined;
        abortControllerRef.current = new AbortController();
        const batchResults = await uploadMediaBatch(compressedFiles, folder, (indexInBatch, percent) => {
          const globalOrder = filesToUpload[indexInBatch].order;
          setImageUploadPercents(prev => {
            const newPercents = { ...prev, [globalOrder]: percent };
            const totalPercent = filesToUpload.reduce((sum, f) => sum + (newPercents[f.order] || 0), 0);
            const avgPercent = totalPercent / filesToUpload.length;
            overallProgress = 20 + (avgPercent * 0.7);
            setUploadProgress(curr => curr ? { ...curr, percent: Math.round(overallProgress), stage: 'uploading' } : null);
            return newPercents;
          });
        }, abortControllerRef.current.signal);
        
        setUploadingIndexes(new Set());
        perf.end('Cloudinary Upload Batch');

        let hasFailures = false;
        let hasAbortError = false;
        batchResults.forEach((res, idx) => {
          if (res.status === 'fulfilled') {
            const asset = res.value;
            asset.order = filesToUpload[idx].order;
            finalAssets.push(asset);
            newlyUploadedAssets.push(asset);
          } else {
            hasFailures = true;
            if (res.reason?.name === 'AbortError' || res.reason?.message?.toLowerCase().includes('abort')) {
              hasAbortError = true;
            }
            console.error('Upload failed for image:', filesToUpload[idx].file.name, res.reason);
          }
        });

        if (hasFailures) {
          if (hasAbortError) {
            const err = new Error('Upload aborted');
            err.name = 'AbortError';
            throw err;
          }
          throw new Error('Some images failed to upload. Please try again or remove the failed images.');
        }
      }

      // Ensure correctly ordered based on UI arrangement
      finalAssets.sort((a, b) => a.order - b.order);

      setUploadProgress(prev => prev ? { ...prev, percent: 90, stage: 'saving' } : null);

      perf.mark('Database Write');
      if (isEditing && initialPost) {
        const success = await updatePost(initialPost.id, {
          title,
          category: category as Category,
          description,
          image_url: finalAssets[0]?.url || initialPost.image_url,
          media: finalAssets,
          uses_ai: usesAI,
          ai_tool: usesAI ? (aiTool === 'other' ? customAiTool.trim() : aiTool) : null,
          ai_prompt: usesAI ? (aiPrompt.trim() || null) : null,
        });
        if (success) {
          setUploadProgress(prev => prev ? { ...prev, percent: 100, stage: 'publishing' } : null);
          setIsSuccess(true);
        } else {
          throw new Error("Failed to update your post. Please try again.");
        }
      } else {
        const newPost = {
          title,
          description,
          category: category as Category,
          image_url: finalAssets[0]?.url || '',
          media: finalAssets,
          avatar_id: currentProfile.id,
          uses_ai: usesAI,
          ai_tool: usesAI ? (aiTool === 'other' ? customAiTool.trim() : aiTool) : null,
          ai_prompt: usesAI ? (aiPrompt.trim() || null) : null,
        };
        setUploadProgress(prev => prev ? { ...prev, percent: 95, stage: 'publishing' } : null);
        const success = await addPost(newPost);
        if (success) {
          localStorage.removeItem('rater_post_form_draft');
          setUploadProgress(prev => prev ? { ...prev, percent: 100, stage: 'publishing' } : null);
          setIsSuccess(true);
        } else {
          throw new Error("Failed to save your post. Please try again.");
        }
      }
      perf.end('Database Write');
      try { perf.end('Total Pipeline Execution'); } catch(e){}
    } catch (err: any) {
      const isCancellation = err?.name === 'AbortError' || err?.message?.toLowerCase().includes('abort');
      
      if (!isCancellation) {
        const normalized = await import('@/lib/errors/normalizeError').then(m => m.normalizeError(err, {
          fallbackCode: 'RATER_UPLOAD_001',
          fallbackMessage: 'Upload failed. Please check your connection and try again.'
        }));
        setInlineUploadError(normalized.userMessage);
      } else {
        setInlineUploadError(null);
      }
      setUploadProgress(null);
      
      // Background cleanup of any orphaned Cloudinary assets
      if (newlyUploadedAssets.length > 0) {
        import('@/lib/cloudinary/uploads').then(({ deleteMedia }) => {
          newlyUploadedAssets.forEach(asset => {
            if (asset.public_id) {
              deleteMedia(asset.public_id).catch(e => console.error('Cleanup failed:', e));
            }
          });
        });
      }
    } finally {
      setIsSubmitting(false);
      isSubmitLockedRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile, title, categoryInputValue, category, mediaPreviews, mediaFiles, isEditing, initialPost, description, usesAI, aiTool, customAiTool, aiPrompt, addPost, updatePost]);

  if (!currentProfile) {
    return (
      <div className="min-h-[60vh] w-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
        <Lock className="w-16 h-16 text-gray-200 mb-6" />
        <h1 className="text-3xl font-semibold mb-4 text-black">Log in to Publish</h1>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          You must be logged in to publish your work and receive structured critique.
        </p>
        <div className="flex gap-4 mt-10">
          <Button
            className="h-12 px-8 rounded-full text-lg font-medium text-white"
            variant="primary"
            onClick={() => setShowAuthOverlay(true)}
          >
            Log In / Sign Up
          </Button>
        </div>
        {showAuthOverlay && <AuthOverlay onClose={() => setShowAuthOverlay(false)} />}
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={cn(
        "w-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500 max-w-2xl mx-auto",
        isOverlay ? "p-4 min-h-100" : "p-8 min-h-[60vh]"
      )}>
        <div className="w-48 h-48">
          <DotLottieReact
            src="https://lottie.host/a059d513-00d2-44a4-82a1-3d15c5bad2fc/OWXtqqeGsX.lottie"
            loop={false}
            autoplay
            dotLottieRefCallback={(instance) => {
              setDotLottie(instance);
            }}
          />
        </div>
        <h1 className="text-2xl font-semibold mb-4 text-black">
          {isEditing ? "Work Updated!" : "Work Published!"}
        </h1>
        <div className="text-gray-500 max-w-md mx-auto leading-relaxed">
          {isEditing
            ? <AmbientSuccessText />
            : <p>Your work is live! Redirecting you to the studio feed...</p>}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={isOverlay ? { opacity: 0, y: 20 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "mx-auto",
        isOverlay ? "w-full max-w-3xl" : "max-w-300 pb-32 pt-8 px-6"
      )}
    >

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-medium mb-1.5 text-black">
            {isEditing ? "Edit Work" : "Publish Work"}
          </h1>
          <p className="text-sm text-gray-400">
            {isEditing ? "Update your work details." : "Share your creative work for structured critique."}
          </p>
        </div>

        {/* IDENTITY INDICATOR */}
        <Link
          href={`/@${currentProfile.username}`}
          scroll={false}
          className="block shrink-0 transition-all hover:scale-105 active:scale-95 self-start sm:self-center"
        >
          <UserAvatar avatarUrl={currentProfile.avatar_url} className="w-10 h-10 shadow-sm" />
        </Link>
      </div>

      <div className={cn(
        "grid gap-12 lg:gap-20 items-start",
        isOverlay ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[1fr_380px]"
      )}>

        {/* LEFT COLUMN: Inputs */}
        <div className="space-y-10">

          {/* IMAGE UPLOAD & PREVIEW */}
          <div className={cn("grid gap-8 w-full", mediaPreviews.length > 0 && !isEditMode ? "grid-cols-1 md:grid-cols-5 items-stretch" : "grid-cols-1 items-start")}>
            <div className={cn("space-y-2 flex flex-col h-full", mediaPreviews.length > 0 && !isEditMode ? "md:col-span-3" : "")}>
            <div
              className={cn(
                "group relative rounded-3xl flex flex-col items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                !isEditMode ? "flex-1 w-full bg-[#F2F2F2] border-2 border-dashed border-[#CCCCCC] hover:bg-[#FFF6DD] hover:border-primary transition-all cursor-pointer" : "h-95 w-full max-w-125 mx-auto bg-gray-50 border-2 border-solid border-gray-200 cursor-default",
                !isEditMode && mediaPreviews.length === 0 ? "aspect-video" : "",
                isDragging && !isEditMode && "bg-[#FFF6DD] border-primary shadow-[0_0_20px_rgba(254,195,18,0.15)]"
              )}
              onDragEnter={!isEditMode ? handleDragEnter : undefined}
              onDragOver={!isEditMode ? handleDragOver : undefined}
              onDragLeave={!isEditMode ? handleDragLeave : undefined}
              onDrop={!isEditMode ? handleDrop : undefined}
              onClick={!isEditMode ? triggerFileInput : undefined}
              onKeyDown={!isEditMode ? handleKeyDown : undefined}
              tabIndex={!isEditMode ? 0 : undefined}
              role={!isEditMode ? "button" : "img"}
              aria-label={!isEditMode ? "Upload design image" : "Uploaded design image"}
            >
              {!isEditMode && mediaFiles.length < 5 && (
                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp, image/avif"
                  className="hidden"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
              )}

              {isDragging && !isEditMode && mediaFiles.length < 5 ? (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#FFF6DD]/80 backdrop-blur-sm pointer-events-none transition-opacity duration-200">
                  <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                    <FileUp strokeWidth={2} className="w-12 h-12 text-primary mb-3" />
                    <p className="text-xl font-semibold text-black">Drop images here (Max 5)</p>
                  </div>
                </div>
              ) : null}

              {mediaPreviews.length > 0 ? (
                <div className="w-full h-full relative overflow-hidden bg-black/5 flex flex-col flex-1">
                  {/* Main Preview (active image) */}
                  <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black/5 max-md:aspect-4/3">
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-lg scale-110 opacity-60 pointer-events-none"
                      style={{ backgroundImage: `url(${mediaPreviews[activePreviewIndex] || mediaPreviews[0]})` }}
                    />
                    <img
                      src={mediaPreviews[activePreviewIndex] || mediaPreviews[0]}
                      alt="Preview"
                      className={cn(
                        "z-10 pointer-events-none object-contain",
                        isEditMode ? "h-full w-auto max-w-full relative" : "absolute inset-0 w-full h-full"
                      )}
                    />
                  </div>

                  {/* Horizontal Thumbnail Row */}
                  {mediaPreviews.length > 1 && (
                    <div className="w-full bg-white px-3 pt-2.5 text-[9px] text-gray-400 font-semibold tracking-wider select-none border-t border-gray-100 flex items-center gap-1.5">
                      <span>Drag to reorder</span>
                      <span>•</span>
                      <span className="normal-case tracking-normal">(First image is cover)</span>
                    </div>
                  )}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "w-full bg-white p-2 flex gap-2 overflow-x-auto shrink-0 relative z-20",
                      (mediaPreviews.length > 1) ? "" : "border-t border-gray-100"
                    )}
                  >
                    {mediaPreviews.map((preview, idx) => (
                      <div
                        key={preview}
                        draggable={true}
                        onDragStart={(e) => handleDragStartThumbnail(e, idx)}
                        onDragOver={(e) => handleDragOverThumbnail(e, idx)}
                        onDragEnd={handleDragEndThumbnail}
                        onClick={() => setActivePreviewIndex(idx)}
                        className={cn(
                          "relative w-16 h-16 shrink-0 rounded-md overflow-hidden border cursor-pointer group/thumb transition-all duration-150 select-none",
                          activePreviewIndex === idx
                            ? "border-primary ring-2 ring-primary/20 scale-95"
                            : "border-gray-200 hover:border-gray-300",
                          draggedIndex === idx && "opacity-40 scale-90"
                        )}
                      >
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        
                        {/* Per-thumbnail upload progress ring */}
                        {uploadingIndexes.has(idx) && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-40 flex items-center justify-center">
                            <svg className="w-8 h-8 -rotate-90 transform">
                              <circle cx="16" cy="16" r="14" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" fill="none" />
                              <circle 
                                cx="16" 
                                cy="16" 
                                r="14" 
                                stroke="white" 
                                strokeWidth="2.5" 
                                fill="none" 
                                strokeDasharray="88"
                                strokeDashoffset={88 - (88 * (imageUploadPercents[idx] || 0) / 100)}
                                className="transition-all duration-300 ease-out"
                              />
                            </svg>
                          </div>
                        )}

                        {mediaPreviews.length > 1 && !uploadingIndexes.has(idx) && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeMedia(idx); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white opacity-100 md:opacity-0 md:group-hover/thumb:opacity-100 transition-opacity z-30"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {idx === 0 && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm text-[8px] font-bold text-white text-center py-0.5 uppercase tracking-wider z-20 pointer-events-none">
                            Cover
                          </div>
                        )}
                      </div>
                    ))}
                    {!isEditMode && mediaFiles.length < 5 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                        className="w-16 h-16 shrink-0 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-colors"
                      >
                        +
                      </button>
                    )}
                  </div>



                  <div className={cn("absolute z-20 flex gap-2", isEditMode ? "top-3 right-3" : "top-4 right-4")}>
                    {isEditMode ? (
                      <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-semibold text-white uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <Lock className="w-2.5 h-2.5" /> Uploaded
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-semibold text-white uppercase tracking-widest">Preview</div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-6 pointer-events-none">
                  <div className="w-16 h-16 mb-4 flex items-center justify-center">
                    <FileUp strokeWidth={1.5} className="w-15 h-15 opacity-40 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <p className="text-lg font-medium text-black mb-1">Drop your Design</p>
                  <p className="text-sm text-gray-400">Supports PNG, JPG, WEBP, AVIF (Up to 5 images, Max 8MB per image)</p>
                </div>
              )}
            </div>
            {uploadError && !isEditMode && (
              <p className="text-red-500 text-sm font-medium animate-in fade-in pl-4">
                {uploadError}
              </p>
            )}
            </div>

            {/* Skeleton Card Preview (Desktop Only) */}
            {!isEditMode && mediaPreviews.length > 0 && (
              <div className="hidden md:block md:col-span-2 pt-0 sticky top-8">
                <div className="bg-[#ebebeb] p-1.5 rounded-3xl overflow-hidden w-full mx-auto shadow-sm transition-all duration-300">
                  <div className="relative z-10 flex flex-col">
                    <div className="w-full aspect-4/3 rounded-3xl overflow-hidden bg-gray-200 mb-4 relative">
                      <img src={mediaPreviews[0]} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="px-2 pt-0 pb-2 flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <div className="h-4 w-12 bg-[#d1d5db] rounded-full" />
                        <div className="h-3 w-10 bg-[#d1d5db] rounded-full" />
                      </div>
                      <div className="h-5 w-3/4 bg-[#d1d5db] rounded-lg mb-3" />
                      <div className="space-y-2 mb-6">
                        <div className="h-3 w-full bg-[#d1d5db] rounded" />
                        <div className="h-3 w-11/12 bg-[#d1d5db] rounded" />
                        <div className="h-3 w-2/3 bg-[#d1d5db] rounded" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-[#d1d5db]" />
                        <div className="h-3 w-20 bg-[#d1d5db] rounded" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 font-medium text-center mt-3 tracking-wider">Feed Preview</p>
              </div>
            )}
          </div>

          {/* TITLE & DESCRIPTION */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="font-medium text-[16px] text-black">Title</h3>
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 text-base px-4 rounded-xl border focus-visible:border-primary placeholder:text-gray-400 font-medium"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-[16px] text-black">Description</h3>
              <div className="relative">
                <RichTextarea
                  placeholder="Description"
                  value={description}
                  maxLength={400}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-45 text-sm p-4 pb-8 rounded-xl border focus-visible:border-primary placeholder:text-gray-400 resize-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="space-y-2" ref={categoryRef}>
            <h3 className="font-medium text-[16px] text-black">Category Tag</h3>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search or select a creative category..."
                value={categoryInputValue}
                onChange={(e) => {
                  setCategoryInputValue(e.target.value);
                  setCategory('');
                  setCategoryError(false);
                  setIsCategoryDropdownOpen(true);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => {
                  setIsCategoryDropdownOpen(true);
                  setCategoryError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex(prev => Math.min(prev + 1, filteredCategories.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex(prev => Math.max(prev - 1, -1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < filteredCategories.length) {
                      const selected = filteredCategories[highlightedIndex];
                      setCategory(selected as Category);
                      setCategoryInputValue(selected);
                      setIsCategoryDropdownOpen(false);
                    }
                  } else if (e.key === 'Escape') {
                    setIsCategoryDropdownOpen(false);
                  }
                }}
                className={cn(
                  "h-12 text-base px-4 rounded-xl border focus-visible:border-primary placeholder:text-gray-400 font-medium",
                  categoryError && "border-red-500 focus-visible:border-red-500"
                )}
              />

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat, index) => {
                      const isHighlighted = index === highlightedIndex;
                      const isSelected = category === cat;

                      // Highlight matching text (simple case-insensitive match)
                      const regex = new RegExp(`(${categoryInputValue})`, 'gi');
                      const parts = cat.split(regex);

                      return (
                        <div
                          key={cat}
                          className={cn(
                            "px-4 py-3 cursor-pointer text-sm font-medium transition-colors flex items-center justify-between",
                            isHighlighted ? "bg-gray-50" : "hover:bg-gray-50",
                            isSelected && "bg-primary/10"
                          )}
                          onClick={() => {
                            setCategory(cat as Category);
                            setCategoryInputValue(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                        >
                          <div>
                            {categoryInputValue.trim() ? (
                              parts.map((part, i) =>
                                regex.test(part) ? (
                                  <span key={i} className="text-primary font-medium">{part}</span>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )
                            ) : (
                              cat
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 font-medium">
                      No categories found
                    </div>
                  )}
                </div>
              )}
            </div>
            {categoryError && (
              <p className="text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                Please select a category from the suggestions.
              </p>
            )}
          </div>

          {/* AI PROMPT SHARING */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 13.97 13.97" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 shrink-0"
                  >
                    <defs>
                      <linearGradient id="rater-star-grad-title" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fec312" />
                        <stop offset="33%" stopColor="#ff4f6d" />
                        <stop offset="66%" stopColor="#c400d2" />
                        <stop offset="100%" stopColor="#7c3bed" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M13.9697 6.98486C13.9697 7.43872 13.6035 7.80695 13.1476 7.80695C11.7244 7.80695 10.3809 8.3623 9.37354 9.37354C8.3623 10.3807 7.80701 11.7223 7.80701 13.1476C7.80701 13.6014 7.44067 13.9697 6.98486 13.9697C6.52905 13.9697 6.16284 13.6034 6.16284 13.1476C6.16284 10.2035 3.76611 7.80695 0.822144 7.80695C0.370361 7.80695 0 7.44067 0 6.98486C0 6.52899 0.370361 6.16272 0.822144 6.16272C3.76611 6.16272 6.16284 3.76611 6.16284 0.822083C6.16284 0.370239 6.53296 0 6.98486 0C7.43665 0 7.80701 0.370239 7.80701 0.822083C7.81885 3.77808 10.2135 6.16272 13.1476 6.16272C13.3687 6.16272 13.5756 6.24835 13.731 6.40363C13.8842 6.55688 13.9697 6.76587 13.9697 6.98486Z" 
                      fill="url(#rater-star-grad-title)" 
                    />
                  </svg>
                  <h3 className="font-medium text-[16px] text-black">AI Disclosure</h3>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Disclose if you used AI to create or assist with this work.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label="Disclose AI assistance"
                aria-checked={usesAI}
                onClick={() => {
                  setUsesAI(!usesAI);
                }}
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  usesAI ? "bg-primary" : "bg-gray-200"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    usesAI ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            <AnimatePresence>
              {usesAI && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24, transitionEnd: { overflow: 'visible' } }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }}
                  className="w-full"
                >
                  <div className="space-y-6 pl-4 border-l-2 border-gray-100">
                    {/* AI Tool Dropdown */}
                    <div className="space-y-2 relative">
                      <h3 className="font-medium text-[15px] text-black">AI Tool <span className="text-red-500">*</span></h3>
                      <button
                        type="button"
                        onClick={() => setIsAiToolDropdownOpen(!isAiToolDropdownOpen)}
                        className={cn(
                          "w-full h-12 text-base text-left px-4 rounded-xl border focus-visible:border-primary font-medium flex items-center justify-between transition-colors bg-white",
                          isAiToolDropdownOpen ? "border-primary" : "border-gray-200",
                          aiTool ? "text-black" : "text-gray-400"
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          {aiTool && (
                            <img 
                              src={getAiToolLogo(aiTool)} 
                              alt={aiTool} 
                              className="w-5 h-5 rounded-sm object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `/ai-tools/${aiTool}.svg`;
                              }}
                            />
                          )}
                          {aiTool 
                            ? (aiTool === 'other' ? 'Other' : AI_TOOLS.find(t => t.id === aiTool)?.label || aiTool)
                            : "Select AI tool used..."}
                        </span>
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={cn("transition-transform duration-200", isAiToolDropdownOpen && "rotate-180")}>
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </button>

                      {isAiToolDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40"
                            onClick={() => setIsAiToolDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                            {AI_TOOLS.map(tool => (
                              <button
                                key={tool.id}
                                type="button"
                                onClick={() => {
                                  setAiTool(tool.id);
                                  if (tool.id !== 'other') setCustomAiTool('');
                                  setIsAiToolDropdownOpen(false);
                                }}
                                className={cn(
                                  "px-4 py-3 cursor-pointer text-sm font-medium transition-colors flex items-center justify-between w-full text-left",
                                  aiTool === tool.id ? "bg-primary/10" : "hover:bg-gray-50"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <img 
                                    src={getAiToolLogo(tool.id)} 
                                    alt={tool.label} 
                                    className="w-5 h-5 rounded-sm object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `/ai-tools/${tool.id}.svg`;
                                    }}
                                  />
                                  <span>{tool.label}</span>
                                </div>
                                {aiTool === tool.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Custom Tool Name Input */}
                    <AnimatePresence>
                      {aiTool === 'other' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          <h3 className="font-medium text-[15px] text-black">Custom Tool Name <span className="text-red-500">*</span></h3>
                          <Input
                            placeholder="e.g. ComfyUI, Custom Model"
                            value={customAiTool}
                            onChange={(e) => setCustomAiTool(e.target.value)}
                            className="h-12 text-base px-4 rounded-xl border focus-visible:border-primary placeholder:text-gray-400 font-medium"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* AI Prompt Textarea */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-[15px] text-black flex items-center justify-between">
                        Prompt <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </h3>
                      <div className="relative">
                        <Textarea
                          placeholder="Describe the prompt used to generate this image..."
                          value={aiPrompt}
                          maxLength={8000}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="min-h-30 text-sm p-4 pb-8 rounded-xl border focus-visible:border-primary placeholder:text-gray-400 font-medium font-mono"
                        />
                        <div className="absolute bottom-4 right-4 text-xs font-medium text-gray-400 pointer-events-none">
                          {aiPrompt.length.toLocaleString()} / 8,000 chars
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 pt-1">
                        Prompt sharing helps others study your creative process. Optional.
                      </p>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN: Onboarding & Actions */}
        {!isOverlay && (
          <div className="space-y-8 sticky top-32 lg:max-w-sm">
            <div className="bg-gray-50/50 border border-gray-200/60 rounded-3xl p-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CloudUpload className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-medium text-lg text-black">Share your craft</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Share your creative work and receive structured critique.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 5 images per work (Max 8MB each)",
                  "Focus on visual work; UI, branding, or prints",
                  "Give it a sharp title to tell your story"
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <span className="text-xs font-medium text-gray-500 leading-normal tracking-wide">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              {/* Inline error with retry */}
              <AnimatePresence>
                {inlineUploadError && !isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex flex-col gap-2"
                  >
                    <p className="text-sm text-red-700 font-medium leading-snug">{inlineUploadError}</p>
                    <button
                      onClick={() => { setInlineUploadError(null); handleSubmit(); }}
                      className="flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900 transition-colors w-fit"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Try again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Animated progress Post button */}
              <button
                disabled={!title || (mediaFiles.length === 0 && !isEditing) || isSubmitting || (isEditing && !hasChanges)}
                onClick={handleSubmit}
                className={cn(
                  "group relative min-w-40 h-12 rounded-full text-lg font-medium transition-colors overflow-hidden border-2 border-primary",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                  !isSubmitting && "hover:bg-primary"
                )}
              >
                {/* Fill layer */}
                {isSubmitting && uploadProgress && (
                  <motion.span
                    className="absolute inset-0 bg-primary origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: uploadProgress.percent / 100 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ transformOrigin: 'left' }}
                  />
                )}
                {/* Shimmer on fill */}
                {isSubmitting && (
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer-sweep 1.6s ease-in-out infinite',
                    }}
                  />
                )}
                {/* Label */}
                <span
                  className={cn(
                    "relative z-10 flex items-center justify-center gap-2 transition-colors",
                    isSubmitting && uploadProgress && uploadProgress.percent > 50
                      ? 'text-white'
                      : 'text-black group-hover:text-white group-disabled:text-black!'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[15px]">
                        {uploadProgress?.stage === 'preparing' && 'Preparing...'}
                        {uploadProgress?.stage === 'compressing' && 'Compressing...'}
                        {uploadProgress?.stage === 'uploading' && uploadProgress.total > 1
                          ? `Publishing work (${uploadProgress.total} items)... ${uploadProgress.percent}%`
                          : uploadProgress?.stage === 'uploading' ? `Publishing... ${uploadProgress.percent}%` : null
                        }
                        {uploadProgress?.stage === 'saving' && 'Saving...'}
                        {uploadProgress?.stage === 'publishing' && 'Publishing...'}
                      </span>
                    </>
                  ) : (
                    isEditing ? 'Update Work' : 'Publish Work'
                  )}
                </span>
              </button>

              {isSubmitting && (
                <Button
                  variant="primary"
                  className="bg-red-500! hover:bg-red-600! rounded-full h-12 px-6 font-medium border-0 transition-colors shadow-none"
                  onClick={(e) => {
                    e.preventDefault();
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                    }
                  }}
                >
                  Cancel Upload
                </Button>
              )}

              {isEditing && (
                <Button
                  variant="ghost"
                  className="h-12 rounded-full text-gray-500 font-medium"
                  onClick={() => {
                    if (formMode === 'create') localStorage.removeItem('rater_post_form_draft');
                    onCancel?.();
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {isOverlay && (
          <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
            {/* Inline error with retry */}
            <AnimatePresence>
              {inlineUploadError && !isSubmitting && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex flex-col gap-2"
                >
                  <p className="text-sm text-red-700 font-medium leading-snug">{inlineUploadError}</p>
                  <button
                    onClick={() => { setInlineUploadError(null); handleSubmit(); }}
                    className="flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900 transition-colors w-fit"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                className="h-12 px-8 rounded-full text-gray-500 font-medium"
                onClick={() => {
                  if (formMode === 'create') localStorage.removeItem('rater_post_form_draft');
                  onCancel?.();
                }}
              >
                Cancel
              </Button>

              {isSubmitting && (
                <Button
                  variant="primary"
                  className="bg-red-500! hover:bg-red-600! rounded-full h-12 px-6 font-medium border-0 transition-colors shadow-none"
                  onClick={(e) => {
                    e.preventDefault();
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                    }
                  }}
                >
                  Cancel Upload
                </Button>
              )}

              {/* Animated progress Post button */}
              <button
                disabled={!title || (mediaFiles.length === 0 && !isEditing) || isSubmitting || (isEditing && !hasChanges)}
                onClick={handleSubmit}
                className={cn(
                  "group relative min-w-40 h-12 rounded-full text-lg font-medium overflow-hidden border-2 border-primary transition-colors",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                  !isSubmitting && "hover:bg-primary"
                )}
              >
                {/* Fill layer */}
                {isSubmitting && uploadProgress && (
                  <motion.span
                    className="absolute inset-0 bg-primary origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: uploadProgress.percent / 100 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ transformOrigin: 'left' }}
                  />
                )}
                {/* Shimmer on fill */}
                {isSubmitting && (
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer-sweep 1.6s ease-in-out infinite',
                    }}
                  />
                )}
                {/* Label */}
                <span
                  className={cn(
                    "relative z-10 flex items-center justify-center gap-2 transition-colors",
                    isSubmitting && uploadProgress && uploadProgress.percent > 50
                      ? 'text-white'
                      : 'text-black group-hover:text-white group-disabled:text-black!'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[15px]">
                        {uploadProgress?.stage === 'preparing' && 'Preparing...'}
                        {uploadProgress?.stage === 'compressing' && 'Compressing...'}
                        {uploadProgress?.stage === 'uploading' && uploadProgress.total > 1
                          ? `Publishing work (${uploadProgress.total} items)... ${uploadProgress.percent}%`
                          : uploadProgress?.stage === 'uploading' ? `Publishing... ${uploadProgress.percent}%` : null
                        }
                        {uploadProgress?.stage === 'saving' && 'Saving...'}
                        {uploadProgress?.stage === 'publishing' && 'Publishing...'}
                      </span>
                    </>
                  ) : (
                    isEditing ? 'Update Work' : 'Publish Work'
                  )}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

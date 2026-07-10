"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Check, FileUp, Lock, CloudUpload, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import type { Post, Category } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { AuthOverlay } from './AuthOverlay';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AmbientSuccessText } from './AmbientSuccessText';
import { showToast } from './GlobalOverlays';

interface PostFormProps {
  initialPost?: Post | null;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
  isOverlay?: boolean;
}

export function PostForm({ initialPost, mode, onSuccess, onCancel, isOverlay = false }: PostFormProps) {
  const router = useRouter();
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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>(
    initialPost ? (initialPost.media ? initialPost.media.map(m => m.url) : [initialPost.image_url]) : []
  );
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // IDENTITY STATE
  const { currentProfile } = useAuth();
  const { addPost, updatePost } = usePosts();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dotLottie, setDotLottie] = useState<any>(null);

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
    return (
      title !== initialPost.title ||
      category !== initialPost.category ||
      description !== (initialPost.description || '') ||
      mediaFiles.length > 0
    );
  }, [initialPost, title, category, description, mediaFiles]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateAndAddImages = (files: FileList | File[]) => {
    setUploadError(null);
    const newFiles = [...mediaFiles];
    const newPreviews = [...mediaPreviews];
    let hasError = false;

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
    
    // Revoke object URL if it's a blob to free memory
    if (previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
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

  const handleSubmit = async () => {
    if (!currentProfile) return;

    if (!title.trim() || !categoryInputValue.trim()) {
      showToast("Title and Category are required.", "error");
      return;
    }

    if (!category || !CATEGORIES.includes(category as Category)) {
      setCategoryError(true);
      return;
    }
    setCategoryError(false);

    if (mediaFiles.length === 0 && mediaPreviews.length === 0) {
      showToast("At least one image is required.", "error");
      return;
    }

    setIsSubmitting(true);
    let newlyUploadedAssets: import('@/types').MediaAsset[] = [];
    try {
      // 1. Upload new media files
      // We will keep a map of the final assets.
      const finalAssets: import('@/types').MediaAsset[] = [];
      let fileIndex = 0;
      
      const { uploadMedia } = await import('@/lib/cloudinary/uploads');

      for (let i = 0; i < mediaPreviews.length; i++) {
        const previewUrl = mediaPreviews[i];
        if (previewUrl.startsWith('blob:')) {
           const file = mediaFiles[fileIndex];
           if (file) {
             const result = await uploadMedia(file);
             result.order = i;
             finalAssets.push(result);
             newlyUploadedAssets.push(result);
           }
           fileIndex++;
        } else {
           // It's an existing image. Find it in initialPost.
           const existing = initialPost?.media?.find(m => m.url === previewUrl);
           if (existing) {
             finalAssets.push({ ...existing, order: i });
           } else {
             // Fallback for backwards compatibility if media array didn't exist
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

      if (isEditing && initialPost) {
        const success = await updatePost(initialPost.id, {
          title,
          category: category as Category,
          description,
          image_url: finalAssets[0]?.url || initialPost.image_url,
          media: finalAssets
        });
        if (success) {
          setIsSuccess(true);
        } else {
          throw new Error("Failed to update post in database");
        }
      } else {
        const newPost = {
          title,
          description,
          category: category as Category,
          image_url: finalAssets[0]?.url || '',
          media: finalAssets,
          avatar_id: currentProfile.id
        };
        const success = await addPost(newPost);
        if (success) {
          localStorage.removeItem('rater_post_form_draft');
          setIsSuccess(true);
        } else {
          throw new Error("Failed to save post to database");
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Upload failed. Please check your connection.", "error");
      // Background Cleanup for orphaned newly uploaded media
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
    }
  };

  if (!currentProfile) {
    return (
      <div className="min-h-[60vh] w-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
        <Lock className="w-16 h-16 text-gray-200 mb-6" />
        <h1 className="text-3xl font-semibold mb-4 text-black">Login Required</h1>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          You must be logged in to post your work and receive feedback from the community.
        </p>
        <div className="flex gap-4 mt-10">
          <Button
            className="h-12 px-8 rounded-full text-lg font-medium text-white"
            variant="primary"
            onClick={() => setShowAuthOverlay(true)}
          >
            Login / Sign up
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
        isOverlay ? "p-4 min-h-[400px]" : "p-8 min-h-[60vh]"
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
          {isEditing ? "Post Updated!" : "Post Submitted!"}
        </h1>
        <div className="text-gray-500 max-w-md mx-auto leading-relaxed">
          {isEditing
            ? <AmbientSuccessText />
            : <p>Your design is live! Redirecting you to the recent feed to see your post...</p>}
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
        isOverlay ? "w-full max-w-4xl" : "max-w-[1200px] pb-32 pt-8 px-6"
      )}
    >

      {/* HEADER */}
      {!isOverlay && (
        <div className="mb-6 md:mb-8">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="rounded-full gap-2 pl-3 pr-5 bg-white border-2 border-gray-100 font-semibold hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-black" />
            Back
          </Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-medium mb-1.5 text-black">
            {isEditing ? "Edit your Work" : "Post your Work"}
          </h1>
          <p className="text-sm text-gray-400">
            {isEditing ? "Update your design details." : "Finalize your design and prepare it for review."}
          </p>
        </div>

        {/* IDENTITY INDICATOR */}
        <Link
          href={`/@${currentProfile.username}`}
          scroll={false}
          className="block shrink-0 transition-all hover:scale-105 active:scale-95 self-start sm:self-center"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-sm"
            style={{ backgroundColor: currentProfile.bg_color }}
          >
            {currentProfile.avatar_url ? (
              <img src={currentProfile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              currentProfile.name.charAt(0).toUpperCase()
            )}
          </div>
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
                "group relative rounded-[24px] flex flex-col items-center justify-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex-1",
                !isEditMode ? "w-full bg-[#F2F2F2] border-2 border-dashed border-[#CCCCCC] hover:bg-[#FFF6DD] hover:border-primary transition-all cursor-pointer" : "h-[180px] w-fit min-w-[200px] max-w-full bg-gray-50 border-2 border-solid border-gray-200 cursor-default",
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
                  {!isEditMode && mediaPreviews.length > 1 && (
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
                      (!isEditMode && mediaPreviews.length > 1) ? "" : "border-t border-gray-100"
                    )}
                  >
                    {mediaPreviews.map((preview, idx) => (
                      <div
                        key={preview}
                        draggable={!isEditMode}
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
                        {!isEditMode && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeMedia(idx); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] opacity-0 group-hover/thumb:opacity-100 transition-opacity z-30"
                          >
                            ×
                          </button>
                        )}
                        {!isEditMode && idx === 0 && (
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
                <div className="bg-[#ebebeb] p-1.5 rounded-[24px] overflow-hidden w-full mx-auto shadow-sm transition-all duration-300">
                  <div className="relative z-10 flex flex-col">
                    <div className="w-full aspect-4/3 rounded-[24px] overflow-hidden bg-gray-200 mb-4 relative">
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
                <Textarea
                  placeholder="Description"
                  value={description}
                  maxLength={400}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[180px] text-sm p-4 pb-8 rounded-xl border focus-visible:border-primary placeholder:text-gray-400 resize-none font-medium"
                />
                <div className="absolute bottom-4 right-4 text-xs font-medium text-gray-400 pointer-events-none">
                  {description.length} / 400 chars
                </div>
              </div>
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="space-y-2" ref={categoryRef}>
            <h3 className="font-medium text-[16px] text-black">Category Tag</h3>
            <div className="relative">
              <Input
                type="text"
                placeholder="What kind of work is this?"
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
                Please select a valid category from the suggestions
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Onboarding & Actions */}
        {!isOverlay && (
          <div className="space-y-8 sticky top-32 lg:max-w-sm">
            <div className="bg-gray-50/50 border border-gray-200/60 rounded-[24px] p-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CloudUpload className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-medium text-lg text-black">Show what you're cooking</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Share your creative work and get rated by the community.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 5 images per post (Max 8MB each)",
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
              <Button
                className="min-w-[160px] h-12 rounded-full text-lg font-medium transition-all"
                variant="outline"
                disabled={!title || (mediaFiles.length === 0 && !isEditing) || isSubmitting || (isEditing && !hasChanges)}
                onClick={handleSubmit}
                isLoading={isSubmitting}
              >
                {isEditing ? "Update Post" : "Post"}
              </Button>
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
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
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
            <Button
              className="min-w-[160px] h-12 rounded-full text-lg font-medium transition-all"
              variant="outline"
              disabled={!title || (mediaFiles.length === 0 && !isEditing) || isSubmitting || (isEditing && !hasChanges)}
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {isEditing ? "Update Post" : "Post"}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

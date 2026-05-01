"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Check, FileUp, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { CATEGORIES, type Post, type Category } from '../logic/mockData';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { AuthOverlay } from './AuthOverlay';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface PostFormProps {
  initialPost?: Post | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isOverlay?: boolean;
}

export function PostForm({ initialPost, onSuccess, onCancel, isOverlay = false }: PostFormProps) {
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
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialPost?.image_url || null);

  // IDENTITY STATE
  const { currentAvatar } = useAuth();
  const { addPost, updatePost } = usePosts();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges = useMemo(() => {
    if (!initialPost) return true;
    return (
      title !== initialPost.title ||
      category !== initialPost.category ||
      description !== (initialPost.description || '') ||
      image !== null
    );
  }, [initialPost, title, category, description, image]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleSubmit = async () => {
    if (!currentAvatar) return;
    
    if (!category || !CATEGORIES.includes(category as Category)) {
      setCategoryError(true);
      return;
    }
    setCategoryError(false);
    
    setIsSubmitting(true);

    try {
      if (isEditing && initialPost) {
        const success = await updatePost(initialPost.id, {
          title,
          category: category as Category,
          description,
          image_url: imagePreview || initialPost.image_url // In a real app, upload image first
        });
        if (success) {
          setIsSuccess(true);
          setTimeout(() => onSuccess?.(), 1500);
        }
      } else {
        // Create new post
        const newPost: Post = {
          id: `post_${Math.random().toString(36).substr(2, 9)}`,
          title,
          description,
          category: category as Category,
          image_url: imagePreview || '',
          avatar_id: currentAvatar.id,
          created_at: new Date().toISOString()
        };
        addPost(newPost);
        setIsSuccess(true);
        setTimeout(() => onSuccess?.(), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentAvatar) {
    return (
      <div className="min-h-[60vh] w-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
        <Lock className="w-16 h-16 text-gray-200 mb-6" />
        <h1 className="text-3xl font-semibold mb-4 text-[#111111]">Login Required</h1>
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
            loop
            autoplay
          />
        </div>
        <h1 className="text-2xl font-semibold mb-4 text-[#111111]">
          {isEditing ? "Post Updated!" : "Post Submitted!"}
        </h1>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          {isEditing 
            ? "Your changes have been saved." 
            : "Your design has been posted successfully. The community will start reviewing it shortly."}
        </p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-semibold mb-1.5 text-[#111111]">
            {isEditing ? "Edit your Work" : "Post your Work"}
          </h1>
          <p className="text-sm text-gray-400">
            {isEditing ? "Update your design details." : "Finalize your design and prepare it for review."}
          </p>
        </div>

        {/* IDENTITY INDICATOR */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 self-start sm:self-center">
          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-sm border border-white">
            {currentAvatar.avatar_url ? (
              <img src={currentAvatar.avatar_url} alt={currentAvatar.name} className="w-full h-full object-cover" />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold"
                style={{ backgroundColor: currentAvatar.bg_color }}
              >
                {currentAvatar.name.substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">@{currentAvatar.name}</span>
        </div>
      </div>

      <div className={cn(
        "grid gap-12 lg:gap-20 items-start",
        isOverlay ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[1fr_380px]"
      )}>
           
        {/* LEFT COLUMN: Inputs */}
        <div className="space-y-10">
        
          {/* IMAGE UPLOAD */}
          <div className="group relative w-full aspect-video bg-[#F2F2F2] border-2 border-dashed border-[#CCCCCC] rounded-[32px] flex flex-col items-center justify-center hover:bg-[#FFF6DD] hover:border-[#FEC312] transition-all cursor-pointer overflow-hidden">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleImageUpload}
            />
            
            {imagePreview ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/5">
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-lg scale-110 opacity-60"
                  style={{ backgroundImage: `url(${imagePreview})` }}
                />
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="relative z-10 max-w-full max-h-full object-contain" 
                />
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                   <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest">Preview</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 mb-4 flex items-center justify-center">
                  <FileUp strokeWidth={1.5} className="w-15 h-15 opacity-40 group-hover:opacity-60 transition-opacity" />
                </div>
                <p className="text-lg font-medium text-[#111111] mb-1">Drop your Design</p>
                <p className="text-sm text-gray-400">Supports PNG, JPG (Max 10MB)</p>
              </div>
            )}
          </div>

          {/* TITLE & DESCRIPTION */}
          <div className="space-y-6">
            <div>
              <Input 
                placeholder="Title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 text-base px-4 rounded-xl border focus-visible:border-[#FEC312] placeholder:text-gray-400 font-medium"
              />
            </div>
            
            <div className="relative">
              <Textarea 
                placeholder="Description" 
                value={description}
                maxLength={400}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[180px] text-sm p-4 pb-8 rounded-xl border focus-visible:border-[#FEC312] placeholder:text-gray-400 resize-none font-medium"
              />
              <div className="absolute bottom-4 right-4 text-xs font-medium text-gray-400 pointer-events-none">
                {description.length} / 400 chars
              </div>
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="space-y-4" ref={categoryRef}>
            <h3 className="font-medium text-lg text-[#111111]">Enter a Category</h3>
            <div className="relative">
              <Input
                type="text"
                placeholder="Select a category"
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
                  "h-12 text-base px-4 rounded-xl border focus-visible:border-[#FEC312] placeholder:text-gray-400 font-medium",
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
                            isSelected && "bg-[#FEC312]/10"
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
                                  <span key={i} className="text-[#FEC312] font-medium">{part}</span>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )
                            ) : (
                              cat
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#FEC312]" />}
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
            <div className="bg-gray-50/50 border border-gray-200/60 rounded-[28px] p-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#FEC312]/10 flex items-center justify-center shrink-0">
                  <FileUp className="w-4 h-4 text-[#FEC312]" />
                </div>
                <h3 className="font-semibold text-lg text-[#111111]">Upload Your Work</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Share your design and get rated by the community.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Upload one image per post (for now)",
                  "Focus on visual work (UI, branding, etc.)",
                  "Add a clear title for better feedback"
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
                className="px-8 h-12 rounded-full text-lg font-medium transition-transform active:scale-[0.98]" 
                variant="primary"
                disabled={!title || (!image && !isEditing) || isSubmitting || (isEditing && !hasChanges)}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Processing..." : isEditing ? "Update Post" : "Publish Design"}
              </Button>
              {isEditing && (
                <Button 
                  variant="ghost" 
                  className="h-12 rounded-full text-gray-500 font-medium"
                  onClick={onCancel}
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
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              className="px-10 h-12 rounded-full text-lg font-medium transition-transform active:scale-[0.98]" 
              variant="primary"
              disabled={!title || (!image && !isEditing) || isSubmitting || (isEditing && !hasChanges)}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Processing..." : isEditing ? "Update Post" : "Publish Design"}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

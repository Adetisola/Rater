"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { CATEGORIES } from '../logic/mockData';
import { FileUp, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext';
import { AuthOverlay } from './AuthOverlay';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';


export function SubmitPage() {
  // FORM STATE
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // IDENTITY STATE
  const { currentAvatar } = useAuth();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleSubmit = () => {
    // SUBMIT LOGIC HERE
    console.log("Submitting:", { title, category, description, image, avatar_id: currentAvatar?.id });
    setIsSuccess(true);
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
          <div className="min-h-[60vh] w-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
              <div className="w-48 h-48">
                  <DotLottieReact
                    src="https://lottie.host/a059d513-00d2-44a4-82a1-3d15c5bad2fc/OWXtqqeGsX.lottie"
                    loop
                    autoplay
                  />
              </div>
              <h1 className="text-2xl font-semibold mb-4 text-[#111111]">Post Submitted!</h1>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">Your design has been posted successfully. The community will start reviewing it shortly.</p>
              <Button className="mt-6 h-12 px-8 rounded-full text-[18px]" variant="outline" onClick={() => window.location.reload()}>Post Another Work</Button>
          </div>
      );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="max-w-[1200px] mx-auto pb-32 pt-8 px-6"
    >
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-semibold mb-1.5 text-[#111111]">Post your Work</h1>
          <p className="text-sm text-gray-400">Finalize your design and prepare it for review.</p>
        </div>

        {/* IDENTITY INDICATOR (Minimal) */}
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-20 items-start">
           
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
                           {/* Blurred Background filling the area */}
                           <div 
                               className="absolute inset-0 bg-cover bg-center blur-lg scale-110 opacity-60"
                               style={{ backgroundImage: `url(${imagePreview})` }}
                           />
                           {/* Fixed image centered and fitted */}
                           <img 
                               src={imagePreview} 
                               alt="Preview" 
                               className="relative z-10 max-w-full max-h-full object-contain" 
                           />
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
               <div className="space-y-4">
                    <h3 className="font-medium text-lg text-[#111111]">Pick a Category</h3>
                    <div className="flex flex-wrap gap-2.5">
                        {CATEGORIES.map(cat => {
                            const isSelected = category === cat;
                            return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={cn(
                                    "group pl-1.5 pr-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                                    isSelected 
                                        ? "bg-gray-100 border-gray-400 text-[#111111]" 
                                        : "bg-white border-[#E0E0E0] text-[#111111] hover:bg-[#fafafa]"
                                )}
                            >
                                {/* Toggle Circle Indicator */}
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
                                    isSelected
                                        ? "bg-[#FEC312]"
                                        : "border-[1.5px] border-[#E0E0E0]"
                                )}>
                                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                </div>
                                
                                {cat}
                            </button>
                        )})}
                    </div>
               </div>
           </div>

            {/* RIGHT COLUMN: Onboarding & Actions */}
            <div className="space-y-8 sticky top-32 lg:max-w-sm">
                 {/* ONBOARDING BLOCK */}
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

                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                            More fields are <span className="text-[#FEC312] font-light">coming soon</span>
                        </p>
                    </div>
                 </div>

                <Button 
                    className="px-8 h-12 rounded-full text-lg font-medium ransition-transform active:scale-[0.98]" 
                    variant="outline"
                    disabled={!title || !category || !image}
                    onClick={handleSubmit}
                >
                    Post Design
                </Button>
            </div>
        </div>
      
    </motion.div>
  );
}

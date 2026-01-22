import { useState, useEffect } from 'react';
import type { Post } from '../logic/mockData';
import { MOCK_AVATARS } from '../logic/mockData';
import { formatTimeAgo } from '../lib/utils';
// Using skeleton for loading state

interface PostCardProps {
  post: Post;
  badge?: 'top-rated' | 'most-discussed' | null;
  isLoading?: boolean;
}

export function PostCard({ post, badge, isLoading = false }: PostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setImageLoaded(false);
    
    const img = new Image();
    img.src = post.imageUrl;
    img.onload = () => {
      setImageLoaded(true);
    };
    img.onerror = () => {
      // Auto-retry after 3 seconds
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    };
  }, [post.imageUrl, retryCount]);

  const showSkeleton = isLoading || !imageLoaded;

  if (showSkeleton) {
      return (
        <div className="bg-[#ebebeb] p-1.5 rounded-[24px] overflow-hidden h-full">
            <div className="relative z-10 h-full flex flex-col">
                {/* SKELETON IMAGE */}
                <div className="w-full aspect-4/3 bg-[#d1d5db] rounded-[20px] animate-pulse mb-4" />
                
                <div className="px-4 pt-0 pb-2 flex-1 flex flex-col">
                    {/* META ROW */}
                    <div className="flex justify-between items-center mb-4">
                         <div className="h-5 w-20 bg-[#d1d5db] rounded-full animate-pulse" /> {/* Category */}
                         <div className="h-3 w-10 bg-[#d1d5db] rounded-full animate-pulse" /> {/* Timestamp */}
                    </div>
                    
                    {/* TITLE */}
                    <div className="h-7 w-3/4 bg-[#d1d5db] rounded-lg animate-pulse mb-3" />
                    
                    {/* DESCRIPTION */}
                    <div className="space-y-2 mb-6">
                        <div className="h-3 w-full bg-[#d1d5db] rounded animate-pulse" />
                        <div className="h-3 w-11/12 bg-[#d1d5db] rounded animate-pulse" />
                        <div className="h-3 w-2/3 bg-[#d1d5db] rounded animate-pulse" />
                    </div>
                    
                    <div className="flex-1" />

                    {/* AUTHOR */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 rounded-full bg-[#d1d5db] animate-pulse" />
                        <div className="h-3 w-20 bg-[#d1d5db] rounded animate-pulse" />
                    </div>
                    
                    {/* FOOTER */}
                    <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                         <div className="h-4 w-8 bg-[#d1d5db] rounded animate-pulse" /> {/* Count */}
                         
                         {/* SKELETON STARS */}
                         <div className="flex gap-0.5 animate-pulse">
                             {[1, 2, 3, 4, 5].map((i) => (
                                <img 
                                    key={i}
                                    src="/src/assets/icons/star-filled.svg" 
                                    className="w-3 h-3 opacity-30 grayscale invert-0"
                                    alt="" 
                                />
                             ))}
                         </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  const isTopRated = badge === 'top-rated';
  const isMostDiscussed = badge === 'most-discussed';

  return (
    <div className="group relative break-inside-avoid">
      {/* CARD CONTAINER */}
      <div className="bg-[#ebebeb] p-1.5 rounded-[24px] relative overflow-hidden transition-all duration-300">
        
        {/* HOVER BACKGROUND - Blurred Image */}
        <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center blur-lg scale-125 brightness-[0.6]"
              style={{ backgroundImage: `url(${post.imageUrl})` }}
            />
        </div>

        {/* CONTENT WRAPPER */}
        <div className="relative z-10">
            {/* IMAGE AREA (Inset) */}
            <div className={`relative w-full overflow-hidden rounded-[20px] ${isTopRated ? 'border-2 border-[#FEC312]' : isMostDiscussed ? 'border-2 border-[#7C3BED]' : ''}`}>
            
            <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 block"
            />
            
            {/* BADGES */}
            {/* 'Most Discussed' Badge - Purple Pill */}
            {isMostDiscussed && (
                <div className="absolute bottom-3 left-3 bg-[#7C3BED] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                    <span>💬 Most Discussed</span>
                </div>
            )}
            
            {/* 'Top Rated' Badge - Yellow Pill */}
            {isTopRated && (
                <div className="absolute bottom-3 left-3 bg-[#FEC312] text-[#111111] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                    <span>🏆 Top Rated</span>
                </div>
            )}
            </div>

            {/* CONTENT AREA */}
            <div className="px-4 pt-4 pb-2">
            
            {/* ROW 1: TAG & TIME */}
            <div className="flex justify-between items-center mb-3">
                <span className="bg-white text-[#111111] text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                    {post.category}
                </span>
                <span className="text-[10px] text-[#999999] font-semibold group-hover:text-white/80 transition-colors">
                    {formatTimeAgo(post.createdAt)}
                </span>
            </div>

            {/* ROW 2: TITLE */}
            <h3 className="font-bold text-lg text-[#111111] mb-2 leading-tight group-hover:text-white transition-colors">
                {post.title}
            </h3>

            {/* ROW 3: DESCRIPTION */}
            <p className="text-xs text-[#111111] leading-relaxed mb-4 line-clamp-3 group-hover:text-white/90 transition-colors">
                {post.description}
            </p>

            {/* ROW 4: AUTHOR */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.designerId}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-[#111111] group-hover:text-white transition-colors">{MOCK_AVATARS[post.designerId]?.name || 'Unknown'}</span>
            </div>

            {/* ROW 5: FOOTER (STATS) */}
            <div className="pt-4 border-t border-black/5 group-hover:border-white/20 flex items-center justify-between transition-colors">
                
                {/* LEFT: Count */}
                <div className="flex items-start gap-1.5">
                    <img src="/src/assets/icons/review-count.svg" alt="reviews" className="w-3.5 h-3.5 group-hover:brightness-0 group-hover:invert transition-all" />
                    <span className="text-xs font-semibold text-[#111111] group-hover:text-white transition-colors">{post.rating.reviewCount}</span>
                </div>

                {/* RIGHT: Ratings */}
                {/* RIGHT: Ratings */}
                <div className="flex items-center gap-1.5">
                    {post.rating.isLocked ? (
                        <span className="text-[10px] font-bold text-[#009241] group-hover:text-[#4ade80] transition-colors">
                            Rating Unlocks at 3 Reviews
                        </span>
                    ) : (
                        <>
                            <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(i => {
                                    const isActive = i <= Math.floor(post.rating.average);
                                    return (
                                        <img 
                                            key={i} 
                                            src={isActive ? "/src/assets/icons/star-active.svg" : "/src/assets/icons/star-inactive.svg"} 
                                            className={`w-3 h-3 ${isActive ? 'group-hover:brightness-0 group-hover:invert transition-all' : ''}`} 
                                            alt="" 
                                        />
                                    );
                                })}
                            </div>
                            <span className="text-sm font-bold text-[#111111] group-hover:text-white transition-colors">{post.rating.average}</span>
                        </>
                    )}
                </div>

            </div>
            </div>
        </div>
      </div>
    </div>
  );
}

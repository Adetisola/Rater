"use client";

import { useState, useEffect } from 'react';
import type { Post, BadgeType } from '@/types';
import { formatTimestamp, getFullTimestamp } from '../utils/dateUtils';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from 'next/link';
import { ImageFallback } from './ImageFallback';
import { usePostMetrics } from '../hooks/usePostMetrics';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { PostActionsMenu } from './PostActionsMenu';
import { useNow } from '../context/TimeContext';
import { Lock } from 'lucide-react';

/**
 * Props for the PostCard component.
 */
interface PostCardProps {
  /** The post object containing details like title, image, and metadata */
  post: Post;
  /** Optional badge to display on the card (e.g., 'top_rated_active') */
  badge?: BadgeType;
  /** Whether the post is currently "hot" based on recent engagement */
  isHot?: boolean;
  /** Whether to show a skeleton loading state instead of the actual card content */
  isLoading?: boolean;
  /** Optional click handler for when the card is pressed */
  onClick?: () => void;
}

/**
 * A highly visual card component that displays a summary of a design post.
 * Includes image loading fallbacks, interactive hover states, metadata, 
 * and Lottie animations for badges (Hot, Top Rated).
 */
export function PostCard({ post, badge, isHot = false, isLoading: parentLoading = false, onClick }: PostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [topRatedLottieLoaded, setTopRatedLottieLoaded] = useState(false);
  const [hotLottieLoaded, setHotLottieLoaded] = useState(false);

  const { allAvatars } = useAuth();
  const { metrics, loading: metricsLoading } = usePostMetrics(post.id);
  const router = useRouter();
  const now = useNow();

  useEffect(() => {
    if (retryCount === 0) {
        setImageLoaded(false);
        setHasError(false);
    }
    
    if (!post.image_url || post.image_url.trim() === '') {
        setHasError(true);
        setImageLoaded(true);
        return;
    }

    const img = new Image();
    img.src = post.image_url;
    img.onload = () => {
      setImageLoaded(true);
      setHasError(false);
    };
    img.onerror = () => {
      if (retryCount >= 2) {
        setHasError(true);
        setImageLoaded(true);
      } else {
        const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
        return () => clearTimeout(timer);
      }
    };
  }, [post.image_url, retryCount, post.id]);

  const showSkeleton = parentLoading || metricsLoading || (!imageLoaded && !hasError);

  if (showSkeleton) {
      return (
        <div className="bg-[#ebebeb] p-1.5 rounded-[24px] overflow-hidden h-full">
            <div className="relative z-10 h-full flex flex-col">
                <div className="w-full aspect-4/3 bg-[#d1d5db] rounded-[20px] animate-pulse mb-4" />
                <div className="px-2 xs:px-4 pt-0 pb-2 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                         <div className="h-5 w-20 bg-[#d1d5db] rounded-full animate-pulse" />
                         <div className="h-3 w-10 bg-[#d1d5db] rounded-full animate-pulse" />
                    </div>
                    <div className="h-5 xs:h-7 w-3/4 bg-[#d1d5db] rounded-lg animate-pulse mb-3" />
                    <div className="hidden min-[769px]:block space-y-2 mb-6">
                        <div className="h-3 w-full bg-[#d1d5db] rounded animate-pulse" />
                        <div className="h-3 w-11/12 bg-[#d1d5db] rounded animate-pulse" />
                        <div className="h-3 w-2/3 bg-[#d1d5db] rounded animate-pulse" />
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 rounded-full bg-[#d1d5db] animate-pulse" />
                        <div className="h-3 w-20 bg-[#d1d5db] rounded animate-pulse" />
                    </div>
                    <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                         <div className="hidden xs:block h-4 w-8 bg-[#d1d5db] rounded animate-pulse" />
                         <div className="flex gap-0.5 animate-pulse">
                             {[1, 2, 3, 4, 5].map((i) => (
                                <img 
                                    key={i}
                                    src="/icons/star-filled.svg" 
                                    className="w-4 h-4 xs:w-3 xs:h-3 opacity-30 grayscale invert-0"
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

  const isTopRated = badge === 'top_rated_active';
  const avatar = allAvatars[post.avatar_id];

  const isEdited = post.updated_at && 
    new Date(post.updated_at).getTime() > new Date(post.created_at).getTime();

  return (
    <Link 
      href={`/post/${post.id}`} 
      scroll={false} 
      className={`group ${!hasError ? 'group/card' : ''} relative break-inside-avoid block`}
      onClick={onClick}
    >
      <div className={`bg-[#ebebeb] p-1.5 rounded-[24px] relative overflow-hidden transition-all duration-500 ${isTopRated ? 'group-hover:scale-[1.015] group-hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)]' : ''}`}>
        {!hasError && (
          <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-lg scale-125 brightness-[0.6]"
                style={{ backgroundImage: `url(${post.image_url})` }}
              />
          </div>
        )}

        <div className="relative z-10">
            <div className={`relative w-full rounded-[20px] ${isTopRated ? 'p-[2px]' : 'overflow-hidden'}`}>
                {isTopRated && (
                    <div className="absolute inset-0 z-0 rounded-[20px] overflow-hidden pointer-events-none">
                        <div className="mesh-gradient-layer" />
                    </div>
                )}
                <div className={`relative z-10 w-full h-full overflow-hidden ${isTopRated ? 'rounded-[18px]' : 'rounded-[20px]'}`}>
                    {hasError ? (
                      <div className="w-full aspect-4/3">
                        <ImageFallback
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-auto object-cover transition-transform duration-500 block"
                          fallbackClassName={`w-full h-full ${isTopRated ? 'rounded-[18px]' : 'rounded-[20px]'}`}
                          onErrorChange={(err) => setHasError(err)}
                          onLoadChange={(loaded) => setImageLoaded(loaded)}
                        />
                      </div>
                    ) : (
                      <img 
                          src={post.image_url} 
                          alt={post.title} 
                          className="w-full h-auto object-cover transition-transform duration-500 block"
                      />
                    )}
                    
                    {isTopRated && (
                        <div className="absolute top-3 left-3 z-20 group/toprated cursor-help">
                            <div className="bg-white text-black text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <div className="w-6 h-6 -my-1 -ml-0.5 relative flex items-center justify-center shrink-0">
                                    {!topRatedLottieLoaded && <span className="absolute text-[12px]">🏆</span>}
                                    <DotLottieReact
                                        src="https://lottie.host/9f381d99-a012-4ffb-83c6-f00e5ce0495f/JD28EvSg2I.lottie"
                                        loop
                                        autoplay
                                        dotLottieRefCallback={(dotLottie) => {
                                            if (dotLottie) {
                                                dotLottie.addEventListener('load', () => setTopRatedLottieLoaded(true));
                                            }
                                        }}
                                        className="relative z-10 w-full h-full"
                                    />
                                </div>
                                <span>Top Rated</span>
                            </div>
                            <div className="absolute top-full left-0 mt-3 w-48 p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl pointer-events-none opacity-0 invisible -translate-y-2 group-hover/toprated:opacity-100 group-hover/toprated:visible group-hover/toprated:translate-y-0 transition-all duration-200 hidden md:block">
                                <p className="leading-relaxed text-center">Top 3 highest-rated posts this week</p>
                            </div>
                        </div>
                    )}

                    <PostActionsMenu 
                        post={post} 
                        isCardContext={true}
                        className="absolute top-3 right-3 z-30 opacity-0 md:group-hover:opacity-100 max-md:opacity-100 transition-opacity duration-200"
                        buttonClassName="w-8 h-8 border-none transition-all max-md:bg-black/20 max-md:backdrop-blur-md max-md:text-white md:bg-white md:backdrop-blur-md md:hover:bg-white/80 md:text-black"
                    />
                </div>
            </div>

            <div className="px-2 xs:px-4 pt-2 xs:pt-4 pb-2">
                <div className="flex justify-between items-center mb-3">
                    <span className="bg-white text-black text-[10px] uppercase font-semibold tracking-wider px-3 py-1 rounded-full truncate max-w-[100px] xs:max-w-none block">
                        {post.category}
                    </span>
                    <span 
                        className="text-[12px] text-[#999999] font-medium group-hover/card:text-white/80 transition-colors shrink-0 ml-2"
                        title={getFullTimestamp(post.created_at)}
                    >
                        {formatTimestamp(post.created_at, now)}
                        {isEdited && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Edited</span>
                          </>
                        )}
                    </span>
                </div>

                <h3 className="font-medium text-sm xs:text-[16px] text-black leading-tight group-hover/card:text-white transition-colors truncate">
                    {post.title}
                </h3>

                <div className="hidden md:block mb-3">
                    <p className="text-xs text-black leading-relaxed line-clamp-3 group-hover/card:text-white/90 transition-colors truncate">
                        {post.description}
                    </p>
                </div>

                <div 
                    className="flex items-center gap-2 mb-2 sm:mb-3 group/avatar pointer-events-auto cursor-pointer relative z-20 max-w-full"
                    data-no-route-loader
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (avatar?.username) {
                            router.push(`/@${avatar.username}`, { scroll: false });
                        }
                    }}
                >
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-200 overflow-hidden ring-0 group-hover/avatar:ring-1 ring-[#FEC312] transition-all shrink-0">
                        <img 
                            src={avatar?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.avatar_id}`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="flex-1 min-w-0 truncate text-black group-hover/card:text-white transition-colors">
                        <span className="text-xs font-medium text-black leading-tight group-hover/card:text-white group-hover/avatar:text-[#FEC312] transition-colors">
                            {avatar?.name || 'Unknown'}
                        </span>
                        <span className="ml-1.5 text-[10px] text-gray-400 font-medium tracking-wider leading-tight group-hover/card:text-white/70 transition-colors">
                            @{avatar?.username || post.avatar_id}
                        </span>
                    </div>
                </div>

                <div className="pt-2 sm:pt-3 border-t border-black/5 group-hover/card:border-white/20 flex items-center justify-between transition-colors">
                    <div className="relative group/tooltip cursor-help">
                        <div className="flex items-start gap-1 xs:gap-1.5">
                            <img src="/icons/review-count.svg" alt="reviews" className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 group-hover/card:brightness-0 group-hover/card:invert transition-all" />
                            <span className="text-xs md:text-sm font-medium text-black group-hover/card:text-white transition-colors flex items-center gap-0.5 xs:gap-1">
                                {metrics?.review_count || 0}
                                {isHot && (
                                    <div className="w-5 h-5 md:w-6 md:h-6 -ml-1 -mr-0.5 -mt-2 relative flex items-center justify-center shrink-0">
                                        {!hotLottieLoaded && <span className="absolute text-[11px] md:text-[13px]">🔥</span>}
                                        <DotLottieReact
                                            src="https://lottie.host/0051bccf-4dba-4f76-8d09-42856cd7e0a6/g2u4ipRES7.lottie"
                                            loop
                                            autoplay
                                            dotLottieRefCallback={(dotLottie) => {
                                                if (dotLottie) {
                                                    dotLottie.addEventListener('load', () => setHotLottieLoaded(true));
                                                }
                                            }}
                                            className="relative z-10 w-full h-full"
                                        />
                                    </div>
                                )}
                            </span>
                        </div>
                        <div className="absolute bottom-full left-0 mb-3 w-64 p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:translate-y-0 transition-all duration-200 hidden md:block">
                            <p className="leading-relaxed text-center">
                                {isHot 
                                    ? "This design is getting high attention based on recent reviews" 
                                    : "Number of structured reviews this design has received"
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 w-auto justify-end">
                        {!metrics?.rating_unlocked ? (
                            <div className="relative group/lock cursor-help flex items-center gap-1 pl-2">
                                <img src="/icons/star-inactive.svg" alt="rating locked" className="w-3 h-3 sm:w-4 sm:h-4 group-hover/card:brightness-0 group-hover/card:invert transition-all" />
                                <Lock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-black group-hover/card:brightness-0 group-hover/card:invert transition-all" />
                                <div className="absolute bottom-full right-0 mb-3 w-48 p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover/lock:opacity-100 group-hover/lock:visible group-hover/lock:translate-y-0 transition-all duration-200 hidden md:block">
                                    <p className="leading-relaxed text-center font-medium">Rating Unlocks at 3 Reviews</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(i => {
                                        const isActive = i <= Math.floor(metrics.average_score);
                                        return (
                                            <img
                                                key={i} 
                                                src={isActive ? "/icons/star-active.svg" : "/icons/star-inactive.svg"} 
                                                className={`w-3 h-3 sm:w-4 sm:h-4 ${isActive ? 'group-hover/card:brightness-0 group-hover/card:invert transition-all' : ''}`} 
                                                alt="" 
                                            />
                                        );
                                    })}
                                </div>
                                <span className="text-sm font-medium text-black group-hover/card:text-white transition-colors">
                                    {metrics.average_score}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Link>
  );
}

"use client";

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { formatTimestamp, getFullTimestamp } from '../utils/dateUtils';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { usePostStore } from '../store/postStore';
import Link from 'next/link';
import { ImageFallback } from './ImageFallback';
import { MediaCarousel } from './MediaCarousel';
import { generateResponsiveUrls, extractPublicId, generateThumbnail } from '@/lib/cloudinary/transforms';
import { useViewTracker } from '@/hooks/useViewTracker';

import { useAuthState } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { PostActionsMenu } from './PostActionsMenu';
import { useNow } from '../context/TimeContext';
import { Lock, Eye } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { UserAvatar } from './UserAvatar';

/**
 * Props for the PostCard component.
 */
interface PostCardProps {
    postId: string;
    /** Whether to show a skeleton loading state instead of the actual card content */
    isLoading?: boolean;
    onClick?: () => void;
}

/**
 * A highly visual card component that displays a summary of a design post.
 * Includes image loading fallbacks, interactive hover states, metadata, 
 * and Lottie animations for badges (Hot, Top Rated).
 */
export function PostCard({ postId, isLoading: parentLoading = false, onClick }: PostCardProps) {
    const post = usePostStore(state => state.posts[postId]);
    const badge = usePostStore(state => state.badgeMap[postId]);
    const isHot = usePostStore(state => state.hotPostIds.has(postId));

    const { trackView, containerRef } = useViewTracker(postId);

    const [hasError, setHasError] = useState(false);
    const [topRatedLottieLoaded, setTopRatedLottieLoaded] = useState(false);
    const [hotLottieLoaded, setHotLottieLoaded] = useState(false);

    const { profileMap } = useAuthState();
    
    // Derive metrics directly from the post object (which is kept fresh by PostContext Realtime)
    const metrics = {
        review_count: post?.review_count || 0,
        average_score: post?.average_score || 0,
        rating_unlocked: (post?.review_count || 0) >= 3,
        view_count: post?.view_count || 0,
    };
    const metricsLoading = false;
    const router = useRouter();
    const now = useNow();



    const showSkeleton = parentLoading || metricsLoading;

    if (showSkeleton) {
        return (
            <div className="bg-[#ebebeb] p-1.5 rounded-3xl overflow-hidden h-full">
                <div className="relative z-10 h-full flex flex-col">
                    <div className="w-full aspect-4/3 bg-[#d1d5db] rounded-3xl animate-pulse mb-4" />
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

    const optimizedFallback = useMemo(() => {
        const mediaData = post?.media?.[0];
        const publicId = mediaData?.public_id || (post?.image_url ? extractPublicId(post.image_url) : null);
        if (publicId) {
            return generateResponsiveUrls(publicId);
        }
        return null;
    }, [post?.media, post?.image_url]);

    const bgUrl = useMemo(() => {
        const mediaData = post?.media?.[0];
        const publicId = mediaData?.public_id || (post?.image_url ? extractPublicId(post.image_url) : null);
        if (publicId) {
            return generateThumbnail(publicId, 400, 300);
        }
        return post?.image_url;
    }, [post?.media, post?.image_url]);

    if (!post) return null;

    const isTopRated = badge === 'top_rated_active';
    let avatar = profileMap[post.avatar_id] || post.author;

    // Background fetch if avatar is completely missing (e.g., Algolia search results)
    const { data: fetchedAvatar } = useSWR(
        !avatar ? `profile_${post.avatar_id}` : null,
        () => import('@/lib/profiles').then(m => m.getProfileById(post.avatar_id)),
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );
    
    if (!avatar && fetchedAvatar) {
        avatar = fetchedAvatar;
    }

    const isEdited = !!post.edited_at;

    return (
        <motion.div
            ref={containerRef}
            layout
            initial={{ opacity: 1, scale: 1, height: 'auto' }}
            animate={
                post.is_deleted 
                ? { opacity: 0, scale: 0.9, height: 0, overflow: 'hidden', margin: 0, padding: 0 } 
                : { opacity: 1, scale: 1, height: 'auto' }
            }
            transition={{ duration: 0.3 }}
            className={post.is_deleted ? 'pointer-events-none' : ''}
            style={{ originY: 0.5 }}
        >
            <Link
                href={`/post/${post.id}`}
                        scroll={false}
                        className={`group ${!hasError ? 'group/card' : ''} relative break-inside-avoid block`}
                        onClick={() => {
                            trackView('action');
                            if (onClick) onClick();
                        }}
                    >
            <div className={`bg-[#ebebeb] p-1.5 rounded-3xl relative overflow-hidden transition-all duration-500 ${isTopRated ? 'group-hover:scale-[1.015] group-hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)]' : ''}`}>
                {!hasError && bgUrl && (
                    <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-lg scale-125 brightness-[0.6]"
                            style={{ backgroundImage: `url(${bgUrl})` }}
                        />
                    </div>
                )}

                <div className="relative z-10">
                    <div className={`relative w-full rounded-[20px] ${isTopRated ? 'p-0.5' : 'overflow-hidden'}`}>
                        {isTopRated && (
                            <div className="absolute inset-0 z-0 rounded-[20px] overflow-hidden pointer-events-none">
                                <div className="mesh-gradient-layer" />
                            </div>
                        )}
                        <div className={`relative z-10 w-full h-full overflow-hidden ${isTopRated ? 'rounded-[18px]' : 'rounded-[20px]'}`}>
                            {hasError ? (
                                <div className="w-full aspect-4/3">
                                    <ImageFallback
                                        src={optimizedFallback ? optimizedFallback.src : post.image_url}
                                        srcSet={optimizedFallback?.srcSet}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        placeholderSrc={optimizedFallback?.placeholder}
                                        alt={post.title}
                                        className="w-full h-auto object-cover transition-transform duration-500 block"
                                        fallbackClassName={`w-full h-full ${isTopRated ? 'rounded-[18px]' : 'rounded-[20px]'}`}
                                        onErrorChange={(err) => setHasError(err)}
                                    />
                                </div>
                            ) : (
                                <MediaCarousel
                                    media={post.media || [{ type: 'image', url: post.image_url } as import('@/types').MediaAsset]}
                                    variant="thumbnail"
                                    className="w-full h-auto block"
                                    imageClassName="w-full h-auto object-cover transition-transform duration-500 block"
                                    onErrorChange={(err) => setHasError(err)}
                                />
                            )}

                            {isTopRated && (
                                <div className="absolute top-3 left-3 z-20">
                                    <Tooltip
                                        position="bottom"
                                        gapClass="pt-1"
                                        width="w-48"
                                        contentClassName="p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl"
                                        content={<p className="leading-relaxed text-center">Top 3 highest-rated posts this week</p>}
                                    >
                                        <div className="bg-white text-black text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm cursor-help">
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
                                    </Tooltip>
                                </div>
                            )}

                            <PostActionsMenu
                                post={post}
                                isCardContext={true}
                                trackView={trackView}
                                className="absolute top-3 right-3 z-30 opacity-0 md:group-hover:opacity-100 max-md:opacity-100 transition-opacity duration-200"
                                buttonClassName="w-8 h-8 border-none transition-all max-md:bg-black/20 max-md:backdrop-blur-md max-md:text-white md:bg-white md:backdrop-blur-md md:hover:bg-white/80 md:text-black"
                            />
                        </div>
                    </div>

                    <div className="px-2 xs:px-4 pt-2 xs:pt-2 pb-1">
                        <div className="flex justify-between items-center mb-2">
                            <span className="bg-transparent text-gray-500 text-[8px] md:text-[9px] font-semibold tracking-wider px-2 py-1 md:px-3 rounded-full border border-gray-300 truncate group-hover/card:text-gray-200 group-hover/card:border-gray-300/30 transition-colors max-w-25 xs:max-w-none block">
                                {post.category}
                            </span>
                            <span
                                className="text-[12px] text-muted font-medium group-hover/card:text-white/80 transition-colors shrink-0 ml-2"
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

                        <h3 className="font-medium mb-1 text-sm xs:text-[12px] text-black leading-tight group-hover/card:text-white transition-colors truncate">
                            {post.title}
                        </h3>

                        <div className="hidden mb-2">
                            <p className="text-xs text-black leading-relaxed line-clamp-3 group-hover/card:text-white/90 transition-colors truncate">
                                {post.description}
                            </p>
                        </div>

                        <div
                            className="flex items-center gap-2 mb-2 sm:mb-2 group/avatar pointer-events-auto cursor-pointer relative z-20 max-w-full"
                            data-no-route-loader
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (avatar?.username) {
                                    router.push(`/@${avatar.username}`, { scroll: false });
                                }
                            }}
                        >
                            <UserAvatar 
                                avatarUrl={avatar?.avatar_url} 
                                className="w-5 h-5 md:w-5 md:h-5 ring-0 group-hover/avatar:ring-1 ring-primary transition-all shrink-0" 
                                iconClassName="w-3/4 h-3/4"
                            />
                            <div className="flex-1 min-w-0 truncate text-black group-hover/card:text-white transition-colors">
                                <span className="text-xs font-medium sm:text-[10px] text-black leading-tight group-hover/card:text-white group-hover/avatar:text-primary transition-colors">
                                    {avatar?.name || 'Unknown'}
                                </span>
                                <span className="ml-1.5 text-[10px] text-gray-400 font-medium tracking-wider leading-tight group-hover/card:text-white/70 transition-colors">
                                    @{avatar?.username || post.avatar_id}
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 sm:pt-1 border-t border-black/5 group-hover/card:border-white/20 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3 xs:gap-3">
                                    {/* View Count */}
                                    {metrics?.view_count !== undefined && (
                                        <Tooltip
                                            position="top"
                                            gapClass="pb-1"
                                            width="w-48"
                                            contentClassName="p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl"
                                            triggerClassName="group/tooltip relative inline-flex items-center cursor-help py-1"
                                            content={<p className="leading-relaxed text-center">Total number of intentional views</p>}
                                        >
                                            <div className="flex items-center gap-1 xs:gap-1">
                                                <Eye className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-black group-hover/card:text-white transition-colors" strokeWidth={1.5} />
                                                <span className="text-xs md:text-sm font-medium text-black group-hover/card:text-white transition-colors">
                                                    {metrics?.view_count || 0}
                                                </span>
                                            </div>
                                        </Tooltip>
                                    )}
                                    {/* Review Count */}
                                    <Tooltip
                                        position="top"
                                        gapClass="pb-1"
                                        width="w-64"
                                        contentClassName="p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl"
                                        triggerClassName="group/tooltip relative inline-flex items-center cursor-help py-1"
                                        content={
                                            <p className="leading-relaxed text-center">
                                                {isHot
                                                    ? "This design is getting high attention based on recent reviews"
                                                    : "Number of structured reviews this design has received"
                                                }
                                            </p>
                                        }
                                    >
                                        <div className="flex items-center gap-1 xs:gap-1">
                                            <img src="/icons/review-count.svg" alt="reviews" className="w-3.5 h-3.5 md:w-4 md:h-4 md:-mt-0.5 group-hover/card:brightness-0 group-hover/card:invert transition-all" />
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
                                    </Tooltip>
                                </div>

                            <div className="flex items-center gap-1.5 w-auto justify-end">
                                {!metrics?.rating_unlocked ? (
                                    <Tooltip
                                        position="top"
                                        align="end"
                                        gapClass="pb-1"
                                        width="w-48"
                                        contentClassName="p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl"
                                        triggerClassName="group relative inline-flex items-center cursor-help flex items-center gap-1 pl-2 py-1"
                                        content={<p className="leading-relaxed text-center font-medium">Rating Unlocks at 3 Reviews</p>}
                                    >
                                        <img src="/icons/star-inactive.svg" alt="rating locked" className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/card:brightness-0 group-hover/card:invert transition-all" />
                                        <Lock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-black group-hover/card:brightness-0 group-hover/card:invert transition-all" />
                                    </Tooltip>
                                ) : (
                                    <>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => {
                                                const isActive = i <= Math.floor(metrics.average_score);
                                                return (
                                                    <img
                                                        key={i}
                                                        src={isActive ? "/icons/star-active.svg" : "/icons/star-inactive.svg"}
                                                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isActive ? 'group-hover/card:brightness-0 group-hover/card:invert transition-all' : ''}`}
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
    </motion.div>
    );
}


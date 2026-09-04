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

function CritiqueCountIcon({ className }: { className?: string }) {
    return (
        <svg width="84" height="80" viewBox="0 0 84 80" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M38.1866 53.7346C37.4745 53.7346 36.7659 53.4637 36.2206 52.9218L29.683 46.3842C28.5992 45.3004 28.5992 43.5393 29.683 42.4554C30.7668 41.3716 32.528 41.3716 33.6118 42.4554L38.1832 47.0268L51.2199 33.9901C52.3037 32.9063 54.0648 32.9063 55.1487 33.9901C56.2325 35.074 56.2325 36.8351 55.1487 37.9189L40.1493 52.9182C39.6074 53.4601 38.8953 53.7311 38.1833 53.7311L38.1866 53.7346Z" />
            <path d="M20.376 79.9991C18.8927 79.9991 17.4199 79.5336 16.1485 78.6096C13.8315 76.9284 12.7512 74.139 13.3244 71.3322L17.2288 52.2618C17.3434 51.6956 17.1524 51.1016 16.7251 50.7125L2.35449 37.5754C0.242478 35.644 -0.52176 32.7504 0.360573 30.027C1.24637 27.3036 3.56337 25.4139 6.40832 25.0908L25.7535 22.9094C26.3266 22.8434 26.8303 22.4786 27.07 21.9506L35.1221 4.2275C36.3066 1.62221 38.8217 0 41.6839 0C44.5462 0 47.0613 1.61874 48.2492 4.2275L56.3013 21.9506C56.541 22.4752 57.0447 22.8434 57.6179 22.9094L76.963 25.0908C79.8115 25.4104 82.1284 27.3036 83.0143 30.027C83.9 32.7504 83.1358 35.644 81.0203 37.5754L66.6497 50.7099C66.2225 51.0989 66.0314 51.693 66.146 52.2592L70.0505 71.3331C70.6271 74.1398 69.5433 76.9258 67.2263 78.6105C64.9093 80.2918 61.9255 80.4585 59.4348 79.0482L42.504 69.4397C42.0038 69.1548 41.3751 69.1548 40.8749 69.4397L23.9441 79.0482C22.8186 79.6839 21.5959 80 20.3766 80L20.376 79.9991ZM41.6909 5.56105C41.3713 5.56105 40.5862 5.65484 40.1868 6.53017L32.1347 24.2533C31.0926 26.5494 28.8868 28.1508 26.3822 28.4356L7.03348 30.6171C6.0817 30.7248 5.74822 31.4438 5.64747 31.746C5.5502 32.0517 5.39736 32.8263 6.10599 33.4759L20.473 46.6104C22.335 48.3126 23.1791 50.9039 22.6719 53.3772L18.7675 72.4476C18.573 73.389 19.1566 73.9275 19.4136 74.115C19.6741 74.3026 20.3654 74.6882 21.1991 74.2157L38.1334 64.6072C40.3289 63.3636 43.0522 63.3636 45.2476 64.6072L62.1819 74.2157C63.0156 74.6882 63.7069 74.3061 63.964 74.115C64.221 73.9274 64.8046 73.389 64.6101 72.4476L60.7056 53.3737C60.1985 50.9039 61.0391 48.309 62.9011 46.6069L77.2717 33.4724C77.9803 32.8263 77.8275 32.0481 77.7267 31.7425C77.6294 31.4368 77.296 30.7212 76.3442 30.6135L56.999 28.4321C54.491 28.1472 52.2852 26.5458 51.243 24.2498L43.191 6.52662C42.795 5.65124 42.0065 5.55749 41.6869 5.55749L41.6909 5.56105Z" />
        </svg>
    );
}

function RatingStarIcon({ className }: { className?: string }) {
    return (
        <svg width="83" height="80" viewBox="0 0 83 80" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M33.4429 5.87036C35.9789 -1.9568 47.0211 -1.95678 49.5571 5.87037L53.5461 18.1821C54.6803 21.6825 57.933 24.0525 61.6032 24.0525H74.5121C82.7188 24.0525 86.131 34.5838 79.4916 39.4213L69.0481 47.0303C66.0789 49.1937 64.8365 53.0284 65.9706 56.5288L69.9596 68.8405C72.4957 76.6677 63.5624 83.1764 56.923 78.3389L46.4796 70.7299C43.5103 68.5665 39.4897 68.5665 36.5204 70.7299L26.077 78.339C19.4376 83.1764 10.5043 76.6676 13.0404 68.8405L17.0294 56.5288C18.1635 53.0284 16.9211 49.1937 13.9519 47.0303L3.5084 39.4213C-3.131 34.5838 0.281216 24.0525 8.48797 24.0525H21.3968C25.067 24.0525 28.3197 21.6825 29.4539 18.1821L33.4429 5.87036Z" />
        </svg>
    );
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

    const { trackView, containerRef } = useViewTracker(postId, () => {
        const currentPost = usePostStore.getState().posts[postId];
        if (currentPost) {
            usePostStore.getState().updatePostMetrics(postId, {
                view_count: (currentPost.view_count || 0) + 1
            });
        }
    });

    const [hasError, setHasError] = useState(false);
    const [topRatedLottieLoaded, setTopRatedLottieLoaded] = useState(false);
    const [hotLottieLoaded, setHotLottieLoaded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    const optimizedFallback = useMemo(() => {
        const mediaData = post?.media?.[0];
        const publicId = mediaData?.public_id || (post?.image_url ? extractPublicId(post.image_url) : null);
        if (publicId) {
            return generateResponsiveUrls(publicId);
        }
        return null;
    }, [post]);

    const bgUrl = useMemo(() => {
        const mediaData = post?.media?.[0];
        const publicId = mediaData?.public_id || (post?.image_url ? extractPublicId(post.image_url) : null);
        if (publicId) {
            return generateThumbnail(publicId, 400, 300);
        }
        return post?.image_url;
    }, [post]);

    const cachedAvatar = post ? profileMap[post.avatar_id] || post.author : undefined;

    // Background fetch if avatar is completely missing (e.g., Algolia search results)
    const { data: fetchedAvatar } = useSWR(
        post && !cachedAvatar ? `profile_${post.avatar_id}` : null,
        () => post
            ? import('@/lib/profiles').then(m => m.getProfileById(post.avatar_id))
            : Promise.resolve(null),
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

    const showSkeleton = parentLoading || metricsLoading;

    if (showSkeleton) {
        return (
            <div className="bg-surface-primary border border-border-default p-1.5 rounded-3xl overflow-hidden h-full">
                <div className="relative z-10 h-full flex flex-col">
                    <div className="w-full aspect-4/3 bg-surface-interactive rounded-3xl animate-pulse mb-4" />
                    <div className="px-2 xs:px-4 pt-0 pb-2 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div className="h-5 w-20 bg-surface-interactive rounded-full animate-pulse" />
                            <div className="h-3 w-10 bg-surface-interactive rounded-full animate-pulse" />
                        </div>
                        <div className="h-5 xs:h-7 w-3/4 bg-surface-interactive rounded-lg animate-pulse mb-3" />
                        <div className="hidden min-[769px]:block space-y-2 mb-6">
                            <div className="h-3 w-full bg-surface-interactive rounded animate-pulse" />
                            <div className="h-3 w-11/12 bg-surface-interactive rounded animate-pulse" />
                            <div className="h-3 w-2/3 bg-surface-interactive rounded animate-pulse" />
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-5 h-5 rounded-full bg-surface-interactive animate-pulse" />
                            <div className="h-3 w-20 bg-surface-interactive rounded-full animate-pulse" />
                        </div>
                        <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                            <div className="hidden xs:block h-4 w-8 bg-surface-interactive rounded animate-pulse" />
                            <div className="flex gap-0.5 animate-pulse">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <img key={i} src="/icons/star-filled.svg" className="w-4 h-4 xs:w-3 xs:h-3 opacity-30 grayscale invert-0" alt="" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) return null;

    const isTopRated = badge === 'top_rated_active';
    const avatar = cachedAvatar || fetchedAvatar || undefined;

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
            <div className={`bg-surface-primary border border-border-default p-1.5 rounded-3xl relative overflow-hidden transition-all duration-500 ${isTopRated ? 'group-hover:scale-[1.015] group-hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)]' : ''}`}>
                {!hasError && bgUrl && (
                    <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-lg scale-125 brightness-[0.6]"
                            style={{ backgroundImage: `url(${bgUrl})` }}
                        />
                    </div>
                )}

                <div className="relative z-10">
                    <div className={`relative w-full rounded-[20px] ${isTopRated ? 'p-0.5' : ''}`}>
                        {isTopRated && (
                            <div className="absolute inset-0 z-0 rounded-[20px] overflow-hidden pointer-events-none">
                                <div className="mesh-gradient-layer" />
                            </div>
                        )}
                        <div className={`relative z-10 w-full h-full ${isTopRated ? 'rounded-[18px]' : 'rounded-[20px]'}`}>
                            <div className="w-full h-full overflow-hidden rounded-[inherit]">
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
                            </div>

                            {isTopRated && (
                                <div className="absolute top-3 left-3 z-20">
                                    <Tooltip
                                        position="bottom"
                                        gapClass="pt-1"
                                        width="w-48"
                                        contentClassName="p-3 bg-surface-elevated border-2 border-[#FEC312] text-text-primary text-[11px] rounded-xl shadow-xl"
                                        content={<p className="leading-relaxed text-center">Top 3 highest-rated works this week</p>}
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
                                onOpenChange={setIsMenuOpen}
                                className={`absolute top-3 right-3 z-30 transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-0 md:group-hover/card:opacity-100 max-md:opacity-100'}`}
                                buttonClassName="w-8 h-8 border border-border-default transition-all max-md:bg-black/20 max-md:backdrop-blur-md max-md:text-white max-md:border-transparent md:bg-surface-primary md:backdrop-blur-md md:hover:bg-surface-hover md:text-text-primary"
                            />
                        </div>
                    </div>

                    <div className="px-2 xs:px-4 pt-2 xs:pt-2 pb-1">
                        <div className="flex justify-between items-center mb-2">
                            <span className="bg-transparent text-text-muted text-[8px] md:text-[9px] font-semibold tracking-wider px-2 py-1 md:px-3 rounded-full border border-border-default truncate group-hover/card:text-white/80 group-hover/card:border-white/20 transition-colors max-w-25 xs:max-w-none block">
                                {post.category}
                            </span>
                            <span
                                className="text-[12px] text-text-muted font-medium group-hover/card:text-white/80 transition-colors shrink-0 ml-2"
                                title={getFullTimestamp(post.created_at)}
                                suppressHydrationWarning
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

                        <h3 className="font-medium mb-1 text-sm xs:text-[12px] text-text-primary leading-tight group-hover/card:text-white transition-colors truncate">
                            {post.title}
                        </h3>

                        <div className="hidden mb-2">
                            <p className="text-xs text-text-primary leading-relaxed line-clamp-3 group-hover/card:text-white/90 transition-colors truncate">
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
                                size="xs"
                                className="w-5 h-5 md:w-5 md:h-5 ring-0 group-hover/avatar:ring-1 ring-primary transition-all shrink-0" 
                                iconClassName="w-3/4 h-3/4"
                            />
                            <div className="flex-1 min-w-0 truncate text-text-primary group-hover/card:text-white transition-colors">
                                <span className="text-xs font-medium sm:text-[10px] text-text-primary leading-tight group-hover/card:text-white group-hover/avatar:text-primary transition-colors">
                                    {avatar?.name || 'Unknown'}
                                </span>
                                <span className="ml-1.5 text-[10px] text-text-muted font-medium tracking-wider leading-tight group-hover/card:text-white/70 transition-colors">
                                    @{avatar?.username || post.avatar_id}
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 sm:pt-1 border-t border-border-subtle group-hover/card:border-white/20 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-2 xs:gap-3">
                                    {/* Review Count */}
                                    <Tooltip
                                        position="top"
                                        gapClass="pb-1"
                                        width="w-64"
                                        contentClassName="p-3 bg-surface-elevated border-2 border-[#FEC312] text-text-primary text-[11px] rounded-xl shadow-xl"
                                        triggerClassName="group/tooltip relative inline-flex items-center cursor-help py-1"
                                        content={
                                            <p className="leading-relaxed text-center">
                                                {isHot
                                                    ? "This work is receiving high attention based on recent critiques"
                                                    : "Number of structured critiques this work has received"
                                                }
                                            </p>
                                        }
                                    >
                                        <div className="flex items-center gap-1 xs:gap-1">
                                            <CritiqueCountIcon className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 -mt-0.5 text-text-primary group-hover/card:text-white transition-colors" />
                                            <span className="text-xs md:text-xs font-medium text-text-primary group-hover/card:text-white transition-colors flex items-center gap-0.5 xs:gap-1">
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

                                    {/* View Count */}
                                    {metrics?.view_count !== undefined && (
                                        <Tooltip
                                            position="top"
                                            gapClass="pb-1"
                                            width="w-48"
                                            contentClassName="p-3 bg-surface-elevated border-2 border-[#FEC312] text-text-primary text-[11px] rounded-xl shadow-xl"
                                            triggerClassName="group/tooltip relative inline-flex items-center cursor-help py-1"
                                            content={<p className="leading-relaxed text-center">Total number of intentional views</p>}
                                        >
                                            <div className="flex items-center gap-1 xs:gap-1">
                                                <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-primary group-hover/card:text-white transition-colors" strokeWidth={1.3} />
                                                <span className="text-xs md:text-xs font-medium text-text-primary group-hover/card:text-white transition-colors">
                                                    {metrics?.view_count || 0}
                                                </span>
                                            </div>
                                        </Tooltip>
                                    )}
                                </div>

                            <div className="flex items-center gap-1.5 w-auto">
                                {!metrics?.rating_unlocked ? (
                                    <Tooltip
                                        position="top"
                                        gapClass="pb-1"
                                        contentClassName="p-3 bg-surface-elevated border-2 border-[#FEC312] text-text-primary text-[11px] rounded-xl shadow-xl"
                                        triggerClassName="group relative inline-flex items-center cursor-help flex items-center gap-1 pl-2 py-1"
                                        content={<p className="leading-relaxed text-center font-medium">Overall score unlocks after 3 critiques</p>}
                                    >
                                        <RatingStarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-muted group-hover/card:text-white/80 transition-colors" />
                                        <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-muted group-hover/card:text-white/80 transition-colors" />
                                    </Tooltip>
                                ) : (
                                    <>
                                        <div className="flex items-center">
                                            <RatingStarIcon
                                                className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 text-text-primary group-hover/card:text-white transition-colors"
                                            />
                                        </div>
                                        <span className="text-sm md:text-[12px] font-medium text-text-primary group-hover/card:text-white transition-colors">
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

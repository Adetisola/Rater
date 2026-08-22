"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Review, Post, PostMetrics } from '@/types';
import { AI_TOOLS } from '@/types';
import { getReviewsByPostId, getReviewerName as getReviewerDisplayName, submitReview, updateReview, deleteReview } from '@/lib/reviews';
import { getPostMetrics as calculatePostMetrics } from '@/lib/metrics';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAuthState } from '@/context/AuthContext';
import { usePosts } from '@/context/PostContext';
import { usePostStore } from '../store/postStore';
import { useNavigationStore } from '@/store/navigationStore';
import { useNow } from '@/context/TimeContext';
import { AppErrorState } from '@/components/AppErrorState';
import Link from 'next/link';
import gsap from 'gsap';
import { PostActionsMenu } from './PostActionsMenu';
import { sharePost } from '../lib/postActions';
import { ReviewForm } from './ReviewForm';
import { getReviewMode } from '../config/reviewModes';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { UserAvatar } from './UserAvatar';
import { ImageFallback } from './ImageFallback';
import { formatTimestamp, getFullTimestamp } from '../utils/dateUtils';
import { generateResponsiveUrls, extractPublicId } from '@/lib/cloudinary/transforms';
import { SharePostOverlay } from './SharePostOverlay';
import { ReportPostOverlay } from './ReportPostOverlay';
import { AmbientLoadingText } from './AmbientLoadingText';
import { RelatedSection } from './RelatedSection';
import { MediaCarousel } from './MediaCarousel';
import { PulseTab, shouldShowPulseTab } from './PulseTab';
import { InsightsTab } from './InsightsTab';
import { showToast } from './GlobalOverlays';
import { AuthOverlay } from '@/components/AuthOverlay';
import { useRouter } from 'next/navigation';
import { cn } from '../lib/utils';


import { useViewTracker } from '@/hooks/useViewTracker';
import { motion, useMotionValue, useAnimation, AnimatePresence, type PanInfo } from 'framer-motion';
import {
    Download,
    Share2,
    X,
    Plus,
    Minus,
    Lock,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check,
    Eye
} from 'lucide-react';


const REVIEWS_PER_PAGE = 5;

const getVisibleTextLength = (markdown: string) => {
    if (!markdown) return 0;
    // Strip markdown links and images: [text](url) or ![alt](url) -> text/alt
    return markdown.replace(/!?(?:\[([^\]]*)\])\([^)]+\)/g, '$1').length;
};

/**
 * Props for the PostDetailOverlay and PostDetailCore components.
 */
interface PostDetailOverlayProps {
    /** The post object to display details for */
    post: Post;
    /** Optional callback to fire when closing the detail view */
    onClose?: () => void;
    /** Optional callback to disable swipe navigation, used when interactable child overlays are open */
    onDisableSwipe?: (disabled: boolean) => void;
    /** Initial mobile state passed from the server */
    initialIsMobile?: boolean;
}

/**
 * Responsive wrapper for the post detail view.
 * Handles mobile swipe-to-navigate gestures while delegating rendering to PostDetailCore.
 */
export function PostDetailContent({ post, initialIsMobile = false }: PostDetailOverlayProps) {
    const [isMobile, setIsMobile] = useState(initialIsMobile);

    // Hydrate the store with the server-provided post data
    useEffect(() => {
        usePostStore.getState().addOrUpdatePosts([post]);
    }, [post]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const posts = usePostStore(state => state.posts);
    const displayPost = posts[post.id] || post;
    const nextPostId = useNavigationStore(state => state.getNextPostId(post.id));
    const prevPostId = useNavigationStore(state => state.getPrevPostId(post.id));

    const nextPost = useMemo(() => nextPostId ? posts[nextPostId] : null, [nextPostId, posts]);
    const prevPost = useMemo(() => prevPostId ? posts[prevPostId] : null, [prevPostId, posts]);

    const router = useRouter();
    const pageX = useMotionValue(0);
    const controls = useAnimation();

    const handleDragEnd = async (_e: any, info: PanInfo) => {
        document.body.style.overflow = '';
        const threshold = window.innerWidth * 0.25;
        const velocityThreshold = 500;

        const isRightSwipe = info.offset.x > threshold || info.velocity.x > velocityThreshold;
        const isLeftSwipe = info.offset.x < -threshold || info.velocity.x < -velocityThreshold;

        if (isRightSwipe && prevPostId) {
            await controls.start({ x: window.innerWidth, transition: { type: 'spring', bounce: 0, duration: 0.3 } });
            window.dispatchEvent(new Event('app-navigation-start'));
            router.replace(`/post/${prevPostId}`, { scroll: false });
        }
        else if (isLeftSwipe && nextPostId) {
            await controls.start({ x: -window.innerWidth, transition: { type: 'spring', bounce: 0, duration: 0.3 } });
            window.dispatchEvent(new Event('app-navigation-start'));
            router.replace(`/post/${nextPostId}`, { scroll: false });
        }
        else {
            controls.start({ x: 0, transition: { type: 'spring', bounce: 0.1, duration: 0.4 } });
        }
    };

    useEffect(() => {
        controls.set({ x: 0 });
        pageX.set(0);
    }, [displayPost.id, controls, pageX]);

    useEffect(() => {
        const unsubscribe = pageX.on("change", (v) => {
            if (Math.abs(v) > 5) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        return () => {
            unsubscribe();
            document.body.style.overflow = '';
        };
    }, [pageX]);

    const [isSwipeDisabled, setIsSwipeDisabled] = useState(false);

    if (!isMobile) {
        return <PostDetailCore post={displayPost} />;
    }

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black">
            <motion.div
                drag={isMobile && !isSwipeDisabled ? "x" : false}
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                style={{ x: pageX, touchAction: 'pan-y' }}
                animate={controls}
                className="flex w-full min-h-screen"
            >
                {/* Previous Post */}
                {prevPost && (
                    <div className="w-screen shrink-0 absolute left-[-100vw] top-0 h-full pointer-events-none">
                        <PostDetailCore post={prevPost} isAdjacent />
                    </div>
                )}

                {/* Current Post */}
                <div className="w-screen shrink-0 relative z-10">
                    <PostDetailCore post={displayPost} onDisableSwipe={setIsSwipeDisabled} disableEntryAnimation />
                </div>

                {/* Next Post */}
                {nextPost && (
                    <div className="w-screen shrink-0 absolute left-[100vw] top-0 h-full pointer-events-none">
                        <PostDetailCore post={nextPost} isAdjacent />
                    </div>
                )}
            </motion.div>
        </div>
    );
}

/**
 * The core detail view for a post, displaying images, metadata, metrics, and the review form.
 * Contains complex interactive logic for zooming, reviewing, and adjacent post navigation.
 */
export function PostDetailCore({ post, isAdjacent, onDisableSwipe, disableEntryAnimation }: PostDetailOverlayProps & { isAdjacent?: boolean, disableEntryAnimation?: boolean }) {
    const router = useRouter();
    const { optimisticUpdateMetrics } = usePosts();
    const [topRatedLottieLoaded, setTopRatedLottieLoaded] = useState(false);
    const [hotLottieLoaded, setHotLottieLoaded] = useState(false);
    const badgeMap = usePostStore(state => state.badgeMap);
    const hotPostIds = usePostStore(state => state.hotPostIds);
    const posts = usePostStore(state => state.posts);
    const { currentProfile: currentAvatar, profileMap: allAvatars } = useAuthState();
    const now = useNow();

    // Data State
    const modeConfig = getReviewMode(post.category);
    const [dbReviews, setDbReviews] = useState<Review[]>([]);
    const [userReviews, setUserReviews] = useState<Review[]>([]);
    const [metrics, setMetrics] = useState<PostMetrics>({
        post_id: post.id,
        review_count: post.review_count || 0,
        view_count: post.view_count || 0,
        average_score: post.average_score || 0,
        rating_unlocked: (post.review_count || 0) >= 3,
        criteria_scores: post.criteria_scores || {},
    });

    // UI State
    const [hasReviewed, setHasReviewed] = useState(false);
    const isFreshReviewRef = useRef(false);
    const successStarRef = useRef<SVGPathElement>(null);
    const successCheckRef = useRef<SVGPathElement>(null);
    const [isSelfPost, setIsSelfPost] = useState(false);
    const [showAuthOverlay, setShowAuthOverlay] = useState(false);
    const critiquesSectionRef = useRef<HTMLDivElement>(null);

    const scrollToCritiques = () => {
        critiquesSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // GSAP animation for review success card
    useEffect(() => {
        if (hasReviewed && successStarRef.current && successCheckRef.current) {
            const star = successStarRef.current;
            const check = successCheckRef.current;

            if (isFreshReviewRef.current) {
                isFreshReviewRef.current = false;

                // Set initial values for fresh animation
                gsap.set(check, { strokeDasharray: 35, strokeDashoffset: 35, opacity: 0 });
                gsap.set(star, { transformOrigin: "50% 50%" });

                const tl = gsap.timeline();

                // Star spins fast, slows down and stops
                tl.fromTo(star,
                    { rotation: -720, scale: 0.2, opacity: 0 },
                    { rotation: 0, scale: 1, opacity: 1, duration: 1.2, ease: "power4.out" }
                );

                // Checkmark animates / draws in place
                tl.to(check, {
                    strokeDashoffset: 0,
                    opacity: 1,
                    duration: 0.6,
                    ease: "power2.out"
                }, "-=0.3");
            } else {
                // If loaded in static already-reviewed state, make sure they are immediately in final static frame!
                gsap.set(star, { rotation: 0, scale: 1, opacity: 1, transformOrigin: "50% 50%" });
                gsap.set(check, { strokeDasharray: 35, strokeDashoffset: 0, opacity: 1 });
            }
        }
    }, [hasReviewed]);
    const [isFetchingReviews, setIsFetchingReviews] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [isAiPromptExpanded, setIsAiPromptExpanded] = useState(false);
    const [aiPromptCopied, setAiPromptCopied] = useState(false);

    // External Metadata (Badges, Hot Status)
    const badge = badgeMap[post.id];
    const isHot = hotPostIds.has(post.id);
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 1;

    // 1. Initial Data Load
    useEffect(() => {
        let isMounted = true;
        
        if (retryCount === 0) {
           setIsFetchingReviews(true);
           setLoadError(null);
        }

        const loadData = async () => {
            try {
                const reviews = await getReviewsByPostId(post.id);
                if (isMounted) {
                    setDbReviews(reviews);
                    setIsFetchingReviews(false);
                    setRetryCount(0);

                    // 1. Backend is the source of truth for "hasReviewed"
                    const hasExistingReview = reviews.some(r => 
                        currentAvatar && r.reviewer_id === currentAvatar.id
                    );

                    if (hasExistingReview) {
                        setHasReviewed(true);
                    }
                }
            } catch (err) {
                const normalized = await import('@/lib/errors/normalizeError').then(m => m.normalizeError(err, {
                    fallbackCode: 'RATER_NETWORK_003',
                    fallbackMessage: 'Failed to load reviews.'
                }));
                if (isMounted) {
                    if (retryCount < MAX_RETRIES) {
                        setRetryCount(prev => prev + 1);
                    } else {
                        setLoadError(normalized);
                        // Fast fallback on network error
                        // Removing guest cache completely as per user request
                    }
                }
            }
        };

        loadData();

        // Check self-post
        if (currentAvatar && post.avatar_id === currentAvatar.id) {
            setIsSelfPost(true);
        } else {
            setIsSelfPost(false);
        }

        return () => { isMounted = false; };
    }, [post.id, currentAvatar?.id, post.avatar_id, retryCount]);

    // 2. Derive metrics locally when userReviews change (Optimistic UI)
    useEffect(() => {
        if (userReviews.length > 0) {
            calculatePostMetrics(post.id, userReviews).then(freshMetrics => setMetrics(prev => ({ 
                ...freshMetrics, 
                view_count: freshMetrics.view_count !== undefined ? freshMetrics.view_count : prev.view_count 
            })));
        }
    }, [userReviews, post.id]);

    // 3. View Tracking
    const { trackView, containerRef: viewTrackerRef } = useViewTracker(post.id, () => {
        setMetrics(prev => ({
            ...prev,
            view_count: (prev.view_count || 0) + 1
        }));
        optimisticUpdateMetrics(post.id, { view_count: (metrics.view_count || 0) + 1 });
    });

    // 4. Live Metrics Refresh (Event-driven)
    // Refreshes the database metrics only when the user returns to the tab.
    // This provides fresh data without constantly polling the DB in the background.
    useEffect(() => {
        let isMounted = true;
        
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                calculatePostMetrics(post.id).then(freshMetrics => {
                    if (!isMounted) return;
                    
                    setMetrics(prev => ({
                        ...freshMetrics,
                        view_count: freshMetrics.view_count !== undefined ? freshMetrics.view_count : prev.view_count
                    }));
                    
                    // Silently sync the latest polled data back to the global feed store
                    optimisticUpdateMetrics(post.id, {
                        review_count: freshMetrics.review_count,
                        view_count: freshMetrics.view_count,
                        average_score: freshMetrics.average_score,
                        criteria_scores: freshMetrics.criteria_scores,
                    });
                }).catch(() => {
                    // Silently ignore errors
                });
            }
        };

        document.addEventListener('visibilitychange', onVisible);

        return () => {
            isMounted = false;
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [post.id]);

    const [isExpanded, setIsExpanded] = useState(false);
    const [sortBy, setSortBy] = useState('Recent');
    
    // Edit and Delete Review State
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'rate' | 'pulse' | 'insights'>('rate');
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isImageFullscreen, setIsImageFullscreen] = useState(false);
    const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
    const [isFullscreenImageLoading, setIsFullscreenImageLoading] = useState(true);

    useEffect(() => {
        setIsFullscreenImageLoading(true);
    }, [fullscreenImageIndex, isImageFullscreen]);
    const [zoomScale, setZoomScale] = useState(1);
    const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

    const displayMedia = useMemo(() => {
        return post.media && post.media.length > 0 ? post.media : [{
            id: post.id,
            type: 'image' as const,
            url: post.image_url,
            public_id: '',
            width: 1200,
            height: 800,
            aspect_ratio: 1.5,
            format: 'jpg',
            bytes: 0,
            alt: post.title,
            order: 0
        }];
    }, [post]);

    useEffect(() => {
        if (onDisableSwipe) {
            onDisableSwipe(isImageFullscreen || isReportOpen || isShareOpen);
        }
    }, [isImageFullscreen, isReportOpen, isShareOpen, onDisableSwipe]);

    useEffect(() => {
        if (isImageFullscreen || isReportOpen || isShareOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isImageFullscreen, isReportOpen, isShareOpen]);

    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastTapRef = useRef(0);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);

    const ZOOM_IN_SCALE = 2.5;

    const updateConstraints = useCallback((scale: number) => {
        if (!imgRef.current) return;
        const { offsetWidth: w, offsetHeight: h } = imgRef.current;
        const maxX = (w * (scale - 1)) / 2;
        const maxY = (h * (scale - 1)) / 2;
        setDragConstraints({ left: -maxX, right: maxX, top: -maxY, bottom: maxY });
        return { maxX, maxY };
    }, []);

    useEffect(() => {
        const bounds = updateConstraints(zoomScale);
        if (zoomScale === 1) {
            x.set(0);
            y.set(0);
        } else if (bounds) {
            x.set(Math.max(-bounds.maxX, Math.min(bounds.maxX, x.get())));
            y.set(Math.max(-bounds.maxY, Math.min(bounds.maxY, y.get())));
        }
    }, [zoomScale, updateConstraints, x, y]);

    useEffect(() => {
        if (!isImageFullscreen) return;
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            if (zoomScale <= 1) return;
            e.preventDefault();
            const { left: minX, right: maxX, top: minY, bottom: maxY } = dragConstraints;
            const newX = Math.max(minX, Math.min(maxX, x.get() - e.deltaX));
            const newY = Math.max(minY, Math.min(maxY, y.get() - e.deltaY));
            x.set(newX);
            y.set(newY);
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [isImageFullscreen, zoomScale, dragConstraints, x, y]);

    useEffect(() => {
        setVisibleCount(REVIEWS_PER_PAGE);
    }, [sortBy]);

    // Contextual Navigation
    const nextPostId = useNavigationStore(state => state.getNextPostId(post.id));
    const prevPostId = useNavigationStore(state => state.getPrevPostId(post.id));

    const handleNext = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (nextPostId) {
            window.dispatchEvent(new Event('app-navigation-start'));
            router.replace(`/post/${nextPostId}`, { scroll: false });
        }
    }, [nextPostId, router]);

    const handlePrev = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (prevPostId) {
            window.dispatchEvent(new Event('app-navigation-start'));
            router.replace(`/post/${prevPostId}`, { scroll: false });
        }
    }, [prevPostId, router]);

    // Keyboard Navigation
    useEffect(() => {
        if (isAdjacent) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (isImageFullscreen || isReportOpen || isShareOpen) return;
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleNext, handlePrev, isImageFullscreen, isReportOpen, isShareOpen, isAdjacent]);

    // Preload adjacent images
    useEffect(() => {
        if (nextPostId) {
            const p = posts[nextPostId];
            if (p?.image_url) new Image().src = p.image_url;
        }
        if (prevPostId) {
            const p = posts[prevPostId];
            if (p?.image_url) new Image().src = p.image_url;
        }
    }, [nextPostId, prevPostId, posts]);

    // Scroll to top on mount/post change
    useEffect(() => {
        if (!isAdjacent) {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [post.id, isAdjacent]);



    // Merged Collection
    const allReviews = useMemo(() => {
        return [...userReviews, ...dbReviews];
    }, [userReviews, dbReviews]);

    const sortedReviews = useMemo(() => {
        return [...allReviews].sort((a, b) => {
            const getAvg = (r: Review) => {
                let sum = 0;
                let count = 0;
                modeConfig.criteria.forEach(c => {
                    const val = r.ratings?.[c.dbKey];
                    if (typeof val === 'number') {
                        sum += val;
                        count++;
                    }
                });
                return count > 0 ? sum / count : 0;
            };

            const getTime = (r: Review) => new Date(r.created_at).getTime();

            if (sortBy === 'Top') return getAvg(b) - getAvg(a);
            if (sortBy === 'Critical') return getAvg(a) - getAvg(b);
            if (sortBy === 'Recent') return getTime(b) - getTime(a);
            if (sortBy === 'Oldest') return getTime(a) - getTime(b);
            return 0;
        });
    }, [allReviews, sortBy, modeConfig]);

    const visibleReviews = sortedReviews.slice(0, visibleCount);
    const hasMoreReviews = visibleCount < sortedReviews.length;
    const remainingReviews = sortedReviews.length - visibleCount;

    const handleReviewSubmit = async (ratings: Partial<Record<keyof Review, number>>, comment: string, reviewer_name: string) => {
        if (currentAvatar && post.avatar_id === currentAvatar.id) return;

        if (hasReviewed) {
            showToast("You've already reviewed this post.", "error");
            return;
        }

        const newReview = {
            id: `r_new_${Date.now()}`,
            post_id: post.id,
            ratings: ratings,
            comment,
            reviewer_id: currentAvatar?.id,
            reviewer_name: currentAvatar ? currentAvatar.name : reviewer_name,
            created_at: new Date().toISOString()
        } as Review;

        try {
            // Submit the review to the database first (Blocking UI)
            const result = await submitReview(newReview);
            
            if (!result.ok) {
                throw new Error(result.error);
            }

            // SUCCESS: Now apply updates strictly synchronized with the backend
            
            // 1. Merge the backend response to ensure full consistency
            const finalReview = result.review ? {
                ...newReview,
                id: result.review.id,
                created_at: result.review.created_at,
                updated_at: result.review.updated_at
            } : newReview;

            // 2. Update React State
            isFreshReviewRef.current = true;
            setUserReviews([finalReview, ...userReviews]);
            setHasReviewed(true);

            // 3. (Removed local storage cache)

            // 4. Calculate and update new global metrics
            const newEstimatedMetrics = await calculatePostMetrics(post.id, [finalReview, ...userReviews]);
            optimisticUpdateMetrics(post.id, {
                review_count: newEstimatedMetrics.review_count,
                view_count: newEstimatedMetrics.view_count,
                average_score: newEstimatedMetrics.average_score,
                criteria_scores: newEstimatedMetrics.criteria_scores,
            });

        } catch (err) {
            console.error('Failed to submit review:', err);
            // We just throw the error so the ReviewForm can catch it and display an inline message.
            throw err;
        }
    };

    const handleReviewUpdate = async (ratings: Partial<Record<keyof Review, number>>, comment: string, _reviewer_name: string) => {
        if (!editingReview) return;
        const oldReview = allReviews.find(r => r.id === editingReview.id);
        if (!oldReview) return;

        try {
            const result = await updateReview(editingReview.id, { ratings, comment });
            if (!result.ok) throw new Error(result.error);

            // Update both userReviews (if created this session) and dbReviews (if fetched on mount)
            const updated = { ...oldReview, ratings, comment };
            setUserReviews(prev => prev.map(r => r.id === editingReview.id ? updated : r));
            setDbReviews(prev => prev.map(r => r.id === editingReview.id ? updated : r));
            
            // Fetch fresh global metrics from DB (the server trigger handles recalculation instantly)
            const freshMetrics = await calculatePostMetrics(post.id);
            optimisticUpdateMetrics(post.id, {
                review_count: freshMetrics.review_count,
                view_count: freshMetrics.view_count,
                average_score: freshMetrics.average_score,
                criteria_scores: freshMetrics.criteria_scores,
            });
            
            setEditingReview(null);
            showToast("Review updated successfully", "success");
        } catch (err: any) {
            console.error('Failed to update review:', err);
            throw err; // Form will handle it
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        try {
            const result = await deleteReview(reviewId);
            if (!result.ok) {
                showToast(result.error, "error");
                return;
            }

            setUserReviews(prev => prev.filter(r => r.id !== reviewId));
            setDbReviews(prev => prev.filter(r => r.id !== reviewId));
            
            // Fetch fresh global metrics from DB (the server trigger handles recalculation instantly)
            const freshMetrics = await calculatePostMetrics(post.id);
            optimisticUpdateMetrics(post.id, {
                review_count: freshMetrics.review_count,
                view_count: freshMetrics.view_count,
                average_score: freshMetrics.average_score,
                criteria_scores: freshMetrics.criteria_scores,
            });

            showToast("Review deleted.", "success");
            setReviewToDelete(null);
        } catch (err: any) {
            showToast("Failed to delete review", "error");
        }
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + REVIEWS_PER_PAGE, sortedReviews.length));
    };

    const avatar = allAvatars[post.avatar_id] || post.author;

    return (
        <motion.div
            ref={viewTrackerRef}
            initial={{ opacity: (isAdjacent || disableEntryAnimation) ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full bg-white relative min-h-screen"
        >
            <div className="max-w-300 mx-auto px-4 sm:px-6 pt-4 md:pt-6 pb-8">

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-15 relative">

                    {/* LEFT COLUMN: Content */}
                    <div className="md:col-span-7 space-y-6">

                        {/* 1. Image Preview */}
                        <div className="w-full md:flex md:justify-center">
                            <div
                                className={`group relative w-full md:w-fit ${imageError ? 'aspect-video' : ''} rounded-3xl overflow-hidden bg-gray-50 ${!imageError ? 'cursor-zoom-in' : ''}`}
                                onClick={() => { if (!imageError) setIsImageFullscreen(true); }}
                                onPointerDownCapture={(e) => {
                                    // Stop propagation so Framer Motion doesn't intercept horizontal swipes on the carousel
                                    e.stopPropagation();
                                }}
                            >
                            {imageError ? (
                                <ImageFallback
                                    src={post.image_url}
                                    alt={post.title}
                                    className="w-full h-auto transition-transform duration-500"
                                    fallbackClassName="w-full h-full rounded-[24px]"
                                    onErrorChange={(err) => setImageError(err)}
                                />
                            ) : (
                                <>
                                    <MediaCarousel
                                        media={displayMedia}
                                        variant="detail"
                                        imageClassName="transition-transform duration-500"
                                        onErrorChange={(err) => setImageError(err)}
                                        onImageClick={(index) => {
                                            setFullscreenImageIndex(index);
                                            if (!imageError) setIsImageFullscreen(true);
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-transparent opacity-0 group-hover:opacity-100 duration-300 flex items-center justify-center pointer-events-none z-10">
                                        <span className="text-black font-semibold text-sm bg-white/80 px-4 py-2 rounded-full backdrop-blur-md">
                                            View Full Image
                                        </span>
                                    </div>
                                </>
                            )}


                            {/* Action Buttons */}
                            <div className="absolute top-6 right-6 z-20">
                                <PostActionsMenu
                                    post={post}
                                    className="flex gap-3"
                                    buttonClassName="w-10 h-10 bg-white hover:bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center transition-transform text-black"
                                    iconSizeClass="w-5 h-5"
                                    onReport={() => setIsReportOpen(true)}
                                    trackView={trackView}
                                />
                            </div>
                        </div>
                    </div>

                        {/* 2. Metadata Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 xs:gap-3">
                                <span className="text-[10px] font-semibold tracking-wider bg-transparent text-gray-600 px-3 py-1.5 rounded-full border border-gray-200">
                                    {post.category}
                                </span>
                                {badge && (
                                    <Tooltip
                                        content={<p className="leading-relaxed text-center">Top 3 highest-rated posts this week</p>}
                                        position="top"
                                        align="center"
                                        width="w-48"
                                        contentStyle={{
                                            background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #fec312, #ff4f6d, #c400d2, #7c3bed) border-box',
                                            border: '2px solid transparent'
                                        }}
                                    >
                                        <div 
                                            className="text-black text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 cursor-help"
                                            style={{
                                                background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #fec312, #ff4f6d, #c400d2, #7c3bed) border-box',
                                                border: '2px solid transparent'
                                            }}
                                        >
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
                                )}
                            </div>
                            <span
                                className="text-xs font-medium text-gray-400"
                                title={getFullTimestamp(post.created_at)}
                                suppressHydrationWarning
                            >
                                {formatTimestamp(post.created_at, now)}
                                {post.edited_at && (
                                    <>
                                        <span className="mx-1">•</span>
                                        <span>Edited</span>
                                    </>
                                )}
                            </span>
                        </div>

                        {/* 3. Title */}
                        <div className="flex items-center justify-between mb-2 gap-4">
                            <h1 className="text-lg xs:text-xl font-medium text-black leading-tight">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-3">
                                <Tooltip
                                    content={
                                        <p className="leading-relaxed text-center">
                                            {isHot ? "This work is receiving high attention based on recent critiques" : "Number of structured critiques this work has received"}
                                        </p>
                                    }
                                    position="top"
                                    align="end"
                                    width="w-[calc(100vw-3rem)] xs:w-64"
                                    triggerClassName="relative inline-flex items-center shrink-0"
                                >
                                    <button
                                        type="button"
                                        onClick={scrollToCritiques}
                                        aria-label="Scroll to critiques"
                                        className="text-sm font-medium text-gray-800 hover:text-primary transition-colors flex items-center whitespace-nowrap cursor-pointer focus:outline-none"
                                    >
                                        {isHot && (
                                            <div className="w-8 h-8 -ml-2 -mt-3 relative flex items-center justify-center shrink-0">
                                                {!hotLottieLoaded && <span className="absolute text-[16px]">🔥</span>}
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
                                        {metrics?.review_count || 0} {(metrics?.review_count === 1) ? 'critique' : 'critiques'}
                                    </button>
                                </Tooltip>
                                {metrics?.view_count !== undefined && (
                                    <Tooltip
                                        content={<p className="leading-relaxed text-center">Total number of intentional views</p>}
                                        position="top"
                                        align="end"
                                        width="w-[calc(100vw-3rem)] xs:w-48"
                                        triggerClassName="relative inline-flex items-center shrink-0"
                                    >
                                        <span className="text-sm font-medium sm:font-medium text-gray-800 flex items-center gap-1 whitespace-nowrap cursor-help">
                                            <Eye className="w-4 h-4" /> {metrics.view_count.toLocaleString()}
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        {/* 4. Description */}
                        <div className="text-sm leading-relaxed text-gray-600">
                            <div className={!isExpanded && (getVisibleTextLength(post.description) > 300 || post.description.trim().split(/\n+/).length > 4) ? 'line-clamp-4' : ''}>
                                <div className="markdown-content">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, href, children, ...props }) => {
                                                let url = href || '';
                                                // If it doesn't start with a protocol (http://, https://, mailto:, etc.) 
                                                // and doesn't start with a slash, prepend https://
                                                if (url && !url.match(/^[a-zA-Z]+:/) && !url.startsWith('/')) {
                                                    url = 'https://' + url;
                                                }
                                                return (
                                                    <a href={url} target="_blank" rel="noopener noreferrer" {...props}>
                                                        {children}
                                                    </a>
                                                );
                                            }
                                        }}
                                    >
                                        {post.description}
                                    </ReactMarkdown>
                                </div>
                                {isExpanded && (getVisibleTextLength(post.description) > 300 || post.description.trim().split(/\n+/).length > 4) && (
                                    <button
                                        onClick={() => setIsExpanded(false)}
                                        className="font-semibold text-gray-800 hover:text-primary transition-colors mt-1"
                                    >
                                        Show less
                                    </button>
                                )}
                            </div>
                            {!isExpanded && (getVisibleTextLength(post.description) > 300 || post.description.trim().split(/\n+/).length > 4) && (
                                <button
                                    onClick={() => setIsExpanded(true)}
                                    className="font-semibold text-gray-800 hover:text-primary transition-colors mt-1"
                                >
                                    Read more
                                </button>
                            )}
                        </div>

                        {/* AI Badge & Prompt */}
                        {post.uses_ai && (
                            <div className="flex flex-col gap-2 py-2">
                                <button
                                    onClick={() => post.ai_prompt && setIsAiPromptExpanded(!isAiPromptExpanded)}
                                    className={cn(
                                        "inline-flex self-start items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                                        post.ai_prompt ? "cursor-pointer hover:bg-gray-50 border-gray-200" : "cursor-default border-gray-100 bg-gray-50",
                                        isAiPromptExpanded && "bg-gray-50 border-gray-200"
                                    )}
                                >
                                    <svg 
                                        width="14" 
                                        height="14" 
                                        viewBox="0 0 13.97 13.97" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-3.5 h-3.5 shrink-0"
                                    >
                                        <defs>
                                            <linearGradient id="rater-star-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#fec312" />
                                                <stop offset="33%" stopColor="#ff4f6d" />
                                                <stop offset="66%" stopColor="#c400d2" />
                                                <stop offset="100%" stopColor="#7c3bed" />
                                            </linearGradient>
                                        </defs>
                                        <path 
                                            d="M13.9697 6.98486C13.9697 7.43872 13.6035 7.80695 13.1476 7.80695C11.7244 7.80695 10.3809 8.3623 9.37354 9.37354C8.3623 10.3807 7.80701 11.7223 7.80701 13.1476C7.80701 13.6014 7.44067 13.9697 6.98486 13.9697C6.52905 13.9697 6.16284 13.6034 6.16284 13.1476C6.16284 10.2035 3.76611 7.80695 0.822144 7.80695C0.370361 7.80695 0 7.44067 0 6.98486C0 6.52899 0.370361 6.16272 0.822144 6.16272C3.76611 6.16272 6.16284 3.76611 6.16284 0.822083C6.16284 0.370239 6.53296 0 6.98486 0C7.43665 0 7.80701 0.370239 7.80701 0.822083C7.81885 3.77808 10.2135 6.16272 13.1476 6.16272C13.3687 6.16272 13.5756 6.24835 13.731 6.40363C13.8842 6.55688 13.9697 6.76587 13.9697 6.98486Z" 
                                            fill="url(#rater-star-grad)" 
                                        />
                                    </svg>
                                    <span className="text-gray-700">
                                        AI-assisted • {post.ai_tool === 'other' || !post.ai_tool 
                                            ? 'Custom Tool' 
                                            : AI_TOOLS.find(t => t.id === post.ai_tool)?.label || post.ai_tool}
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {isAiPromptExpanded && post.ai_prompt && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-2 bg-gray-50 border border-gray-100 rounded-2xl p-4 relative group">
                                                <button
                                                    onClick={() => {
                                                        if (post.ai_prompt) {
                                                            navigator.clipboard.writeText(post.ai_prompt);
                                                            setAiPromptCopied(true);
                                                            showToast("Prompt copied to clipboard.", "success");
                                                            setTimeout(() => setAiPromptCopied(false), 2000);
                                                        }
                                                    }}
                                                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 active:scale-95"
                                                    title="Copy Prompt"
                                                >
                                                    {aiPromptCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                                                </button>
                                                <p className="text-sm font-mono text-gray-600 leading-relaxed whitespace-pre-wrap wrap-break-word pr-8">
                                                    {post.ai_prompt}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* 5. Avatar & Rating */}
                        <div className="flex items-center justify-between gap-4 w-full">
                            <Link
                                href={`/@${currentAvatar && post.avatar_id === currentAvatar.id ? currentAvatar.username : (avatar?.username ?? post.avatar_id)}`}
                                scroll={false}
                                className="flex items-center gap-3 group/author min-w-0 flex-1"
                            >
                                <UserAvatar 
                                    avatarUrl={avatar?.avatar_url} 
                                    size="sm"
                                    priority={true}
                                    className="w-10 h-10 shrink-0 ring-2 ring-transparent group-hover/author:ring-primary transition-all flex items-center justify-center" 
                                />
                                <div className="text-left flex flex-col min-w-0">
                                    <span className="block text-sm font-medium text-black group-hover/author:text-primary transition-colors truncate">{avatar?.name || 'Unknown'}</span>
                                    <span className="block text-[10px] text-gray-400 font-medium tracking-wider truncate mt-0.5">@{avatar?.username || post.avatar_id}</span>
                                </div>
                            </Link>

                            <div className="flex items-center gap-2 shrink-0">
                                {!metrics?.rating_unlocked ? (
                                    <div className="relative group/lock cursor-help flex items-center gap-1.5 pl-2">
                                        <img src="/icons/star-inactive.svg" alt="rating locked" className="w-5 h-5 group-hover/lock:opacity-80 transition-all" />
                                        <Lock className="w-4 h-4 text-gray-400 group-hover/lock:text-gray-500 transition-colors" />
                                        <div className="absolute bottom-full right-0 mb-3 w-48 p-3 bg-white border-2 border-primary text-black text-[11px] rounded-xl shadow-xl z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover/lock:opacity-100 group-hover/lock:visible group-hover/lock:translate-y-0 transition-all duration-200 hidden md:block">
                                            <p className="leading-relaxed text-center font-medium">Overall score unlocks after 3 critiques</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-0.5 md:gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <img
                                                    key={i}
                                                    src={i <= Math.floor(metrics.average_score) ? "/icons/star-active-yellow.svg" : "/icons/star-inactive.svg"}
                                                    alt="star"
                                                    className="w-4 h-4 md:w-5 md:h-5"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-lg md:text-xl font-semibold text-black">{metrics.average_score}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {isReportOpen && (
                            <ReportPostOverlay
                                postId={post.id}
                                onClose={() => setIsReportOpen(false)}
                            />
                        )}

                        {isShareOpen && <SharePostOverlay onClose={() => setIsShareOpen(false)} post_id={post.id} />}
                    </div>

                    {/* RIGHT COLUMN: Tabbed Rate / Pulse / Insights Hub */}
                    <div className="md:col-span-5 relative">
                        <div className="sticky top-24">
                            {/* Tab Bar */}
                            {(() => {
                                const showPulse = shouldShowPulseTab(post.id, isSelfPost);
                                const tabs = [
                                    { key: 'rate' as const, label: 'Rate' },
                                    ...(showPulse ? [{ key: 'pulse' as const, label: 'Pulse' }] : []),
                                    { key: 'insights' as const, label: 'Insights' },
                                ];

                                return (
                                    <div className="bg-white border-2 border-gray-100 rounded-3xl">
                                        {/* Tabs */}
                                        <div className="flex items-center border-b border-gray-100">
                                            {tabs.map((tab) => (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    onClick={() => setActiveTab(tab.key)}
                                                    className={`relative flex-1 py-3.5 text-[13px] font-medium transition-colors duration-150 flex items-center justify-center gap-1.5 ${activeTab === tab.key
                                                        ? 'text-black'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                >
                                                    {tab.label}
                                                    {(tab.key === 'pulse' || tab.key === 'insights') && (
                                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider leading-none mt-px ${activeTab === tab.key
                                                            ? 'bg-primary/20 text-[#D9A000]'
                                                            : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            Beta
                                                        </span>
                                                    )}
                                                    {/* Active underline */}
                                                    {activeTab === tab.key && (
                                                        <motion.div
                                                            layoutId="review-tab-underline"
                                                            className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                                                            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Tab Content */}
                                        <div className="p-5 xs:p-6">
                                            <AnimatePresence mode="wait" initial={false}>
                                                {activeTab === 'rate' && (
                                                    <motion.div
                                                        key="rate-tab"
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -6 }}
                                                        transition={{ duration: 0.15 }}
                                                    >
                                                        {isSelfPost ? (
                                                            <div className="bg-gray-50 p-12 rounded-3xl text-center border-2 border-dashed border-gray-200">
                                                                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚫</div>
                                                                <h3 className="font-semibold text-lg mb-1 text-gray-700">Self-Critique Locked</h3>
                                                                <p className="text-sm text-gray-500">You cannot critique your own work.</p>
                                                            </div>
                                                        ) : !currentAvatar ? (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 16 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="py-8 px-3 bg-gray-50 rounded-[20px] border border-gray-100 flex flex-col items-center text-center"
                                                            >
                                                                <img
                                                                    src="/icons/rater-logo-white-bg.svg"
                                                                    alt="Rater"
                                                                    className="w-12 h-12 mb-4"
                                                                />
                                                                <h3 className="text-md font-medium text-black mb-1.5">Have feedback?</h3>
                                                                <p className="text-xs text-gray-500 mb-6 max-w-65 leading-relaxed">
                                                                    Create a profile to submit a critique, join the conversation, and contribute to the overall score.
                                                                </p>
                                                                <Button onClick={() => setShowAuthOverlay(true)} variant="primary" className="px-6 h-10 rounded-full font-medium text-sm">
                                                                    Create Profile
                                                                </Button>
                                                            </motion.div>
                                                        ) : (!hasReviewed || editingReview) ? (
                                                                <ReviewForm
                                                                    onSubmit={editingReview ? handleReviewUpdate : handleReviewSubmit}
                                                                    isLoggedIn={!!currentAvatar}
                                                                    postId={post.id}
                                                                    userId={currentAvatar?.id}
                                                                    userName={currentAvatar?.name}
                                                                    postCategory={post.category}
                                                                    editingReview={editingReview}
                                                                    onCancelEdit={() => setEditingReview(null)}
                                                                />
                                                        ) : (
                                                            <div className="bg-gray-50 p-10 rounded-3xl text-center">
                                                                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-white border border-gray-100">
                                                                    <svg className="w-7 h-7 filter" viewBox="0 0 83 80">
                                                                        <defs>
                                                                            <linearGradient id="success-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                                <stop offset="0%" stopColor="#fec312" />
                                                                                <stop offset="33%" stopColor="#ff4f6d" />
                                                                                <stop offset="66%" stopColor="#c400d2" />
                                                                                <stop offset="100%" stopColor="#7c3bed" />
                                                                            </linearGradient>
                                                                        </defs>
                                                                        <path
                                                                            ref={successStarRef}
                                                                            d="M33.4429 5.87036C35.9789 -1.9568 47.0211 -1.95678 49.5571 5.87037L53.5461 18.1821C54.6803 21.6825 57.933 24.0525 61.6032 24.0525H74.5121C82.7188 24.0525 86.131 34.5838 79.4916 39.4213L69.0481 47.0303C66.0789 49.1937 64.8365 53.0284 65.9706 56.5288L69.9596 68.8405C72.4957 76.6677 63.5624 83.1764 56.923 78.3389L46.4796 70.7299C43.5103 68.5665 39.4897 68.5665 36.5204 70.7299L26.077 78.339C19.4376 83.1764 10.5043 76.6676 13.0404 68.8405L17.0294 56.5288C18.1635 53.0284 16.9211 49.1937 13.9519 47.0303L3.5084 39.4213C-3.131 34.5838 0.281216 24.0525 8.48797 24.0525H21.3968C25.067 24.0525 28.3197 21.6825 29.4539 18.1821L33.4429 5.87036Z"
                                                                            fill="url(#success-star-grad)"
                                                                            style={{
                                                                                opacity: isFreshReviewRef.current ? 0 : 1,
                                                                            }}
                                                                        />
                                                                        <path
                                                                            ref={successCheckRef}
                                                                            d="M32 40 L40 48 L52 32"
                                                                            stroke="white"
                                                                            strokeWidth="5"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            fill="none"
                                                                            style={{
                                                                                opacity: isFreshReviewRef.current ? 0 : 1,
                                                                                strokeDasharray: isFreshReviewRef.current ? 35 : undefined,
                                                                                strokeDashoffset: isFreshReviewRef.current ? 35 : undefined,
                                                                            }}
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <h3 className="font-medium text-xl mb-2">Critique submitted</h3>
                                                                <p className="text-gray-500">Your critique has been added to this work.</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}

                                                {activeTab === 'pulse' && (
                                                    <motion.div
                                                        key="pulse-tab"
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -6 }}
                                                        transition={{ duration: 0.15 }}
                                                    >
                                                        <PulseTab
                                                            postId={post.id}
                                                            isCreator={isSelfPost}
                                                            creatorId={currentAvatar?.id}
                                                            avatarId={currentAvatar?.id}
                                                        />
                                                    </motion.div>
                                                )}

                                                {activeTab === 'insights' && (
                                                    <motion.div
                                                        key="insights-tab"
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -6 }}
                                                        transition={{ duration: 0.15 }}
                                                    >
                                                        <InsightsTab reviews={allReviews} postCategory={post.category} postTitle={post.title} postDescription={post.description} postId={post.id} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                </div>

                {/* BOTTOM SECTION: Reviews List */}
                <div ref={critiquesSectionRef} id="critiques-section" className="border-t border-gray-100 pt-8 xs:pt-15 scroll-mt-6 sm:scroll-mt-10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                        <h2 className="text-lg font-medium text-black shrink-0">
                            Critiques ({isFetchingReviews ? (metrics.review_count ?? post.review_count ?? 0) : allReviews.length})
                        </h2>

                        <div className="flex flex-wrap gap-2 sm:ml-auto">
                            {['Recent', 'Top', 'Critical', 'Oldest'].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setSortBy(option)}
                                    className={`px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all duration-200 ${sortBy === option
                                        ? "bg-primary/10 border-primary/40 text-black"
                                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-black"
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isFetchingReviews ? (
                            <div className="py-20 text-center text-gray-400 font-medium"><AmbientLoadingText /></div>
                        ) : loadError ? (
                            <div className="w-full">
                               <AppErrorState
                                 title="Unable to load critiques"
                                 description={loadError.message || "We encountered an issue while loading critiques."}
                                 onRetry={() => setRetryCount(0)}
                               />
                            </div>
                        ) : allReviews.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-20 px-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Plus className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold text-black mb-2">Be the first to critique this work</h3>
                                <p className="text-gray-500 max-w-xs mx-auto text-[15px] leading-relaxed">
                                    Your critique helps the creator sharpen their craft and provides valuable insights for the studio.
                                </p>
                            </motion.div>
                        ) : visibleReviews.map((review) => {
                            // Calculate dynamic rating average based on mode criteria
                            let sum = 0;
                            let count = 0;
                            modeConfig.criteria.forEach(c => {
                                const val = review.ratings?.[c.dbKey];
                                if (typeof val === 'number') {
                                    sum += val;
                                    count++;
                                }
                            });
                            const ratingAvg = count > 0 ? sum / count : 0;

                            const timeLabel = formatTimestamp(review.created_at, now);
                            const fullTime = getFullTimestamp(review.created_at);

                            return (
                                <motion.div
                                    key={review.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                    className="bg-white border border-gray-200 rounded-[20px] p-5 xs:p-5 xs:px-6 flex flex-col gap-4"
                                >
                                    <div className="w-full">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                className={`transition-all ${review.reviewer_id && allAvatars[review.reviewer_id] ? 'cursor-pointer' : ''}`}
                                                onClick={(e) => {
                                                    if (review.reviewer_id && allAvatars[review.reviewer_id]?.username) {
                                                        e.stopPropagation();
                                                        router.push(`/@${allAvatars[review.reviewer_id].username}`, { scroll: false });
                                                    }
                                                }}
                                            >
                                                {review.reviewer_id && allAvatars[review.reviewer_id] ? (
                                                    <UserAvatar 
                                                        avatarUrl={allAvatars[review.reviewer_id].avatar_url} 
                                                        size="xs"
                                                        className="w-7 h-7 hover:ring-1 ring-primary transition-all"
                                                        iconClassName="w-3/4 h-3/4"
                                                    />
                                                ) : (
                                                    <UserAvatar 
                                                        avatarUrl={null} 
                                                        size="xs"
                                                        className="w-7 h-7"
                                                        iconClassName="w-3/4 h-3/4"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col xs:flex-row xs:items-center gap-0.5 xs:gap-3 min-w-0 flex-1 xs:flex-none">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className={`font-medium text-sm text-black truncate max-w-37.5 xs:max-w-none transition-colors ${review.reviewer_id && allAvatars[review.reviewer_id] ? 'cursor-pointer hover:text-primary' : ''}`}
                                                        onClick={(e) => {
                                                            if (review.reviewer_id && allAvatars[review.reviewer_id]?.username) {
                                                                e.stopPropagation();
                                                                router.push(`/@${allAvatars[review.reviewer_id].username}`, { scroll: false });
                                                            }
                                                        }}
                                                    >
                                                        {getReviewerDisplayName(review)}
                                                    </span>
                                                    {!review.reviewer_id && (
                                                        <span className="bg-gray-100 text-gray-400 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md select-none shrink-0">
                                                            Guest
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex gap-0.5">
                                                        <img src="/icons/star-active-yellow.svg" className="w-3.5 h-3.5" alt="" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-500 tabular-nums select-none">
                                                        {ratingAvg.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 ml-auto xs:ml-0 shrink-0 self-start xs:self-center mt-1 xs:mt-0">
                                                <span
                                                    className="text-xs text-gray-400 font-medium"
                                                    title={fullTime}
                                                    suppressHydrationWarning
                                                >
                                                    {timeLabel}
                                                </span>
                                                {currentAvatar?.id === review.reviewer_id && (
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                                                        <button 
                                                            onClick={() => {
                                                                if (editingReview && editingReview.id !== review.id) {
                                                                    if (!window.confirm("You have unsaved changes. Discard and edit this review instead?")) {
                                                                        return;
                                                                    }
                                                                }
                                                                setEditingReview(review);
                                                                setReviewToDelete(null);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className="hover:text-primary transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <span>•</span>
                                                        {reviewToDelete === review.id ? (
                                                            <div className="flex items-center gap-1 text-red-500">
                                                                <span>Are you sure?</span>
                                                                <button onClick={() => handleDeleteReview(review.id)} className="hover:underline">Yes</button>
                                                                <span>/</span>
                                                                <button onClick={() => setReviewToDelete(null)} className="hover:underline text-gray-400">No</button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => setReviewToDelete(review.id)}
                                                                className="hover:text-red-500 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {review.comment && (
                                            <div className="text-sm text-black leading-relaxed mb-4">
                                                <div className="markdown-content text-sm wrap-break-word">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {review.comment}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 pt-3 xs:pt-0 border-t xs:border-t-0 border-gray-100 mt-2">
                                            <div className="flex flex-wrap gap-3 xs:gap-4">
                                                {modeConfig.criteria.map(c => (
                                                    <div key={c.dbKey} className="flex items-center gap-1.5 text-sm font-semibold text-black" title={c.label}>
                                                        <img src={c.iconUrl} alt={c.label} className="w-5 h-5 object-contain" />
                                                        {review.ratings?.[c.dbKey] || '-'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>


                    {hasMoreReviews && (
                        <div className="flex justify-center mt-8">
                            <Button variant='ghost' onClick={handleLoadMore} className="group relative px-8 py-3.5 bg-transparent text-sm font-medium transition-all duration-200 flex items-center gap-2">
                                Load More
                                <span className="text-xs font-medium">({remainingReviews} remaining)</span>
                            </Button>
                        </div>
                    )}
                    {!hasMoreReviews && sortedReviews.length > REVIEWS_PER_PAGE && (
                        <div className="flex justify-center mt-10"><span className="text-sm text-gray-400 font-medium">All reviews shown</span></div>
                    )}
                </div>

                {/* RELATED DESIGNS SECTION */}
                <RelatedSection currentPost={post} />
            </div>

            {/* Fullscreen Image Overlay */}
            {isImageFullscreen && typeof document !== 'undefined' && createPortal(
                <>
                {displayMedia.length > 1 && (
                    <div style={{ display: 'none' }}>
                        <span ref={() => {
                            // Inline keyboard listener setup to avoid finding the top of the component
                            window.onkeydown = (e) => {
                                if (!isImageFullscreen) return;
                                if (e.key === 'ArrowRight' && fullscreenImageIndex < displayMedia.length - 1) {
                                    setFullscreenImageIndex(prev => prev + 1);
                                    setZoomScale(1);
                                }
                                if (e.key === 'ArrowLeft' && fullscreenImageIndex > 0) {
                                    setFullscreenImageIndex(prev => prev - 1);
                                    setZoomScale(1);
                                }
                            };
                        }} />
                    </div>
                )}
                <div
                    ref={containerRef}
                    className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-hidden"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsImageFullscreen(false);
                            setZoomScale(1);
                        }
                    }}
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-none" />
                    <div className="absolute bottom-6 left-6 md:top-4 md:right-4 md:bottom-auto md:left-auto flex md:flex-col flex-row gap-4 z-50 pointer-events-auto">
                        <button className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95" onClick={(e) => { e.stopPropagation(); setIsImageFullscreen(false); setZoomScale(1); }}>
                            <X className="w-6 h-6" />
                        </button>
                        <button onClick={async (e) => {
                            e.stopPropagation();
                            const currentUrl = displayMedia[fullscreenImageIndex]?.url || post.image_url;
                            try {
                                const response = await fetch(currentUrl);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${post.title.replace(/\s+/g, '_')}_${fullscreenImageIndex + 1}.jpg`;
                                document.body.appendChild(link); link.click();
                                document.body.removeChild(link); window.URL.revokeObjectURL(url);
                            } catch (err) { window.open(currentUrl, '_blank'); }
                        }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"><Download className="w-5 h-5 text-black" /></button>
                        <button onClick={async (e) => {
                            e.stopPropagation();
                            const handledNatively = await sharePost(post.id, post.title);
                            if (!handledNatively) setIsShareOpen(true);
                        }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"><Share2 className="w-5 h-5 text-black" /></button>
                    </div>
                    <div className="absolute bottom-6 right-6 flex md:flex-col flex-row gap-3 z-50 pointer-events-auto">
                        <button onClick={(e) => { e.stopPropagation(); setZoomScale(ZOOM_IN_SCALE); }} className={`w-12 h-12 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${zoomScale >= ZOOM_IN_SCALE ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={zoomScale >= ZOOM_IN_SCALE}><Plus className="w-6 h-6 text-black" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setZoomScale(1); }} className={`w-12 h-12 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${zoomScale <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={zoomScale <= 1}><Minus className="w-6 h-6 text-black" /></button>
                    </div>

                    {/* Navigation Controls */}
                    {displayMedia.length > 1 && (
                        <div className="absolute top-12 md:top-auto md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 pointer-events-auto">
                            {fullscreenImageIndex > 0 ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(prev => prev - 1); setZoomScale(1); }}
                                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                                >
                                    <ChevronLeft className="w-6 h-6 text-black" />
                                </button>
                            ) : (
                                <div className="w-12 h-12" />
                            )}
                            
                            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium tracking-wide">
                                {fullscreenImageIndex + 1} / {displayMedia.length}
                            </div>

                            {fullscreenImageIndex < displayMedia.length - 1 ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(prev => prev + 1); setZoomScale(1); }}
                                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                                >
                                    <ChevronRight className="w-6 h-6 text-black" />
                                </button>
                            ) : (
                                <div className="w-12 h-12" />
                            )}
                        </div>
                    )}
                    {(() => {
                      const currentFullscreenItem = displayMedia[fullscreenImageIndex];
                      const currentFullscreenRawUrl = currentFullscreenItem?.url || post.image_url;
                      const currentFullscreenPublicId = currentFullscreenItem?.public_id || (currentFullscreenRawUrl ? extractPublicId(currentFullscreenRawUrl) : null);
                      const fullscreenOptimizedSet = currentFullscreenPublicId ? generateResponsiveUrls(currentFullscreenPublicId) : null;
                      return (
                        <>
                            {isFullscreenImageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center z-[5]">
                                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                            <motion.img
                                ref={imgRef}
                                src={fullscreenOptimizedSet?.src || currentFullscreenRawUrl}
                                srcSet={fullscreenOptimizedSet?.srcSet}
                                sizes="100vw"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl relative z-10"
                                style={{ x, y, cursor: zoomScale > 1 ? 'grab' : 'default' }}
                                whileDrag={{ cursor: 'grabbing' }}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: zoomScale }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                drag={zoomScale > 1 ? true : (displayMedia.length > 1 ? "x" : false)}
                                dragConstraints={zoomScale > 1 ? dragConstraints : { left: 0, right: 0 }}
                                dragMomentum={false}
                                dragElastic={zoomScale > 1 ? 0 : 0.5}
                                onDragEnd={(_e, info) => {
                                    if (zoomScale === 1 && displayMedia.length > 1) {
                                        if (info.offset.x < -50 && fullscreenImageIndex < displayMedia.length - 1) {
                                            setFullscreenImageIndex(prev => prev + 1);
                                        } else if (info.offset.x > 50 && fullscreenImageIndex > 0) {
                                            setFullscreenImageIndex(prev => prev - 1);
                                        }
                                    }
                                }}
                                onLoad={() => {
                                    setIsFullscreenImageLoading(false);
                                    updateConstraints(zoomScale);
                                }}
                                onPointerDown={() => {
                                    const now = Date.now();
                                    if (now - lastTapRef.current < 300) { setZoomScale(prev => prev > 1 ? 1 : ZOOM_IN_SCALE); lastTapRef.current = 0; }
                                    else { lastTapRef.current = now; }
                                }}
                            />
                        </>
                      );
                    })()}
                </div>
                </>,
                document.body
            )}
            {showAuthOverlay && <AuthOverlay initialTab="signup" redirectOnSuccess={false} onClose={() => setShowAuthOverlay(false)} />}
        </motion.div>
    );
}

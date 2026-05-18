"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
    getReviewsByPostId, 
    getReviewerDisplayName, 
    calculatePostMetrics, 
    type Review, 
    type Post, 
    type PostMetrics 
} from '../logic/mockData';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { useNow } from '../context/TimeContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PostActionsMenu } from './PostActionsMenu';
import { sharePost } from '../lib/postActions';

import { ReviewForm } from './ReviewForm';
import { Button } from './ui/Button';
import { ImageFallback } from './ImageFallback';
import { formatTimestamp, getFullTimestamp } from '../logic/dateUtils';
import { SharePostOverlay } from './SharePostOverlay';
import { ReportPostOverlay } from './ReportPostOverlay';
import { AmbientLoadingText } from './AmbientLoadingText';
import { useBadges } from '../hooks/useBadges';
import { useHotPosts } from '../hooks/useHotPosts';
import { useNavigationStore } from '../store/navigationStore';

import { getDeviceId, hasReviewedPost, markPostAsReviewed } from '../utils/deviceTracking';
import { motion, useMotionValue, useAnimation, type PanInfo } from 'framer-motion';
import { 
    ArrowLeft, 
    Download, 
    Share2, 
    ChevronDown, 
    X, 
    Plus, 
    Minus,
    Lock,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const REVIEWS_PER_PAGE = 5;
const RATE_LIMIT_KEY = 'rater_review_timestamps';

interface PostDetailOverlayProps {
  post: Post;
  onClose?: () => void;
  onDisableSwipe?: (disabled: boolean) => void;
}

export function PostDetailContent({ post, onClose }: PostDetailOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { posts } = usePosts();
  const nextPostId = useNavigationStore(state => state.getNextPostId(post.id));
  const prevPostId = useNavigationStore(state => state.getPrevPostId(post.id));
  
  const nextPost = useMemo(() => posts.find(p => p.id === nextPostId), [nextPostId, posts]);
  const prevPost = useMemo(() => posts.find(p => p.id === prevPostId), [prevPostId, posts]);

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
  }, [post.id, controls, pageX]);

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
    return <PostDetailCore post={post} onClose={onClose} />;
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
          <PostDetailCore post={post} onClose={onClose} onDisableSwipe={setIsSwipeDisabled} disableEntryAnimation />
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

export function PostDetailCore({ post, onClose, isAdjacent, onDisableSwipe, disableEntryAnimation }: PostDetailOverlayProps & { isAdjacent?: boolean, disableEntryAnimation?: boolean }) {
  const { currentAvatar, allAvatars } = useAuth();
  const { posts } = usePosts();
  const now = useNow();
  const router = useRouter();

  const handleClose = onClose || (() => router.back());
  
  // Data State
  const [dbReviews, setDbReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]); 
  const [metrics, setMetrics] = useState<PostMetrics | null>(null);
  
  // UI State
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isSelfPost, setIsSelfPost] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [isFetchingReviews, setIsFetchingReviews] = useState(true);
  const [imageError, setImageError] = useState(false);

  // External Metadata (Badges, Hot Status)
  const { badgeMap } = useBadges(posts);
  const { hotPostIds } = useHotPosts(posts);
  const badge = badgeMap[post.id];
  const isHot = hotPostIds.has(post.id);
  const [topRatedLottieLoaded, setTopRatedLottieLoaded] = useState(false);
  const [hotLottieLoaded, setHotLottieLoaded] = useState(false);

  // 1. Initial Data Load
  useEffect(() => {
    let isMounted = true;
    setIsFetchingReviews(true);

    const loadData = async () => {
        const [reviews, initialMetrics] = await Promise.all([
            getReviewsByPostId(post.id),
            calculatePostMetrics(post.id)
        ]);

        if (isMounted) {
            setDbReviews(reviews);
            setMetrics(initialMetrics);
            setIsFetchingReviews(false);
        }
    };

    loadData();

    // Check self-post
    if (currentAvatar && post.avatar_id === currentAvatar.id) {
        setIsSelfPost(true);
    } else {
        setIsSelfPost(false);
    }

    // Check device-based review history
    if (hasReviewedPost(post.id)) {
        setHasReviewed(true);
    }

    return () => { isMounted = false; };
  }, [post.id, currentAvatar, post.avatar_id]);

  // 2. Derive metrics locally when userReviews change (Optimistic UI)
  useEffect(() => {
    if (userReviews.length > 0) {
        calculatePostMetrics(post.id, userReviews).then(setMetrics);
    }
  }, [userReviews, post.id]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('Recent');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  useEffect(() => {
    if (onDisableSwipe) {
      onDisableSwipe(isImageFullscreen || isReportOpen || isShareOpen);
    }
  }, [isImageFullscreen, isReportOpen, isShareOpen, onDisableSwipe]);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);
  const [isReviewCountTooltipVisible, setIsReviewCountTooltipVisible] = useState(false);
  const reviewCountTooltipRef = useRef<HTMLDivElement>(null);
  const [isTopRatedTooltipVisible, setIsTopRatedTooltipVisible] = useState(false);
  const topRatedTooltipRef = useRef<HTMLDivElement>(null);

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
      const p = posts.find(p => p.id === nextPostId);
      if (p?.image_url) new Image().src = p.image_url;
    }
    if (prevPostId) {
      const p = posts.find(p => p.id === prevPostId);
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
      const getAvg = (r: Review) => (r.clarity + r.purpose + r.aesthetics) / 3;
      const getTime = (r: Review) => new Date(r.created_at).getTime();

      if (sortBy === 'Top') return getAvg(b) - getAvg(a);
      if (sortBy === 'Critical') return getAvg(a) - getAvg(b);
      if (sortBy === 'Recent') return getTime(b) - getTime(a);
      if (sortBy === 'Oldest') return getTime(a) - getTime(b);
      return 0;
    });
  }, [allReviews, sortBy]);

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMoreReviews = visibleCount < sortedReviews.length;
  const remainingReviews = sortedReviews.length - visibleCount;

  const handleReviewSubmit = async (ratings: any, comment: string, reviewer_name: string) => {
    if (currentAvatar && post.avatar_id === currentAvatar.id) return;
    
    const device_id = getDeviceId();
    const hasDuplicate = allReviews.some(r => 
        (currentAvatar && r.reviewer_id === currentAvatar.id) || 
        (!currentAvatar && r.device_id === device_id)
    );

    if (hasDuplicate || hasReviewedPost(post.id)) {
        alert("You've already reviewed this post.");
        return;
    }

    const now = Date.now();
    const timestamps: number[] = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
    const validTimestamps = timestamps.filter(t => now - t < 60000);
    
    if (validTimestamps.length >= 5) {
        setRateLimitMessage("You're reviewing too fast, slow down a bit.");
        await new Promise(resolve => setTimeout(resolve, 30000));
        setRateLimitMessage(null);
    }

    const newReview: Review = {
        id: `r_new_${Date.now()}`,
        post_id: post.id,
        clarity: ratings.clarity,
        purpose: ratings.purpose,
        aesthetics: ratings.aesthetics,
        comment,
        reviewer_id: currentAvatar?.id,
        reviewer_name: currentAvatar ? undefined : reviewer_name,
        created_at: new Date().toISOString(),
        device_id: device_id
    };

    setUserReviews([newReview, ...userReviews]);
    setHasReviewed(true);
    markPostAsReviewed(post.id);

    const updatedTimestamps = [...validTimestamps, Date.now()];
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(updatedTimestamps));
  };

  useEffect(() => {
    if (!isReviewCountTooltipVisible && !isTopRatedTooltipVisible) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (isReviewCountTooltipVisible && reviewCountTooltipRef.current && !reviewCountTooltipRef.current.contains(target)) {
        setIsReviewCountTooltipVisible(false);
      }
      if (isTopRatedTooltipVisible && topRatedTooltipRef.current && !topRatedTooltipRef.current.contains(target)) {
        setIsTopRatedTooltipVisible(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isReviewCountTooltipVisible, isTopRatedTooltipVisible]);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + REVIEWS_PER_PAGE, sortedReviews.length));
  };

  const avatar = allAvatars[post.avatar_id];

  return (
    <motion.div 
      initial={{ opacity: (isAdjacent || disableEntryAnimation) ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full bg-white relative min-h-screen"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        
        {/* HEADER: Back Button & Navigation Controls */}
        <div className="mb-8 flex items-center justify-between">
            <Button 
                variant="secondary" 
                onClick={handleClose}
                className="rounded-full gap-2 pl-3 pr-5 border-2 border-gray-100 font-semibold hover:bg-gray-50"
            >
                <ArrowLeft className="w-5 h-5 text-black" />
                Back
            </Button>

            {/* Desktop Navigation Controls */}
            <div className="hidden md:flex items-center gap-2">
                <Button
                    variant="secondary"
                    onClick={handlePrev}
                    disabled={!prevPostId}
                    className="w-10 h-10 p-0 rounded-full border-2 border-gray-100 hover:bg-gray-50 flex items-center justify-center disabled:opacity-20 transition-all"
                    aria-label="Previous post"
                >
                    <ChevronLeft className="w-5 h-5 text-black" />
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleNext}
                    disabled={!nextPostId}
                    className="w-10 h-10 p-0 rounded-full border-2 border-gray-100 hover:bg-gray-50 flex items-center justify-center disabled:opacity-20 transition-all"
                    aria-label="Next post"
                >
                    <ChevronRight className="w-5 h-5 text-black" />
                </Button>
            </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 relative">
            
            {/* LEFT COLUMN: Content */}
            <div className="md:col-span-7 space-y-6">
                
                {/* 1. Image Preview */}
                <div 
                    className={`group relative w-full ${imageError ? 'aspect-video' : 'aspect-auto xs:aspect-video'} rounded-[32px] overflow-hidden bg-gray-50 ${!imageError ? 'cursor-zoom-in' : ''}`}
                    onClick={() => { if (!imageError) setIsImageFullscreen(true); }}
                >
                    {imageError ? (
                      <ImageFallback
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-auto xs:h-full xs:object-cover transition-transform duration-500"
                        fallbackClassName="w-full h-full rounded-[32px]"
                        onErrorChange={(err) => setImageError(err)}
                      />
                    ) : (
                      <>
                        <img 
                            src={post.image_url} 
                            alt={post.title} 
                            className="w-full h-auto xs:h-full xs:object-cover transition-transform duration-500" 
                            onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-transparent opacity-0 group-hover:opacity-100 duration-300 flex items-center justify-center">
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
                            buttonClassName="w-12 h-12 bg-white hover:bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center transition-transform text-black"
                            iconSizeClass="w-6 h-6"
                            onReport={() => setIsReportOpen(true)}
                        />
                    </div>
                </div>

                {/* 2. Metadata Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 xs:gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider bg-black text-white px-3 py-1.5 rounded-full">
                            {post.category}
                        </span>
                        {badge === 'top_rated_active' && (
                            <div 
                                ref={topRatedTooltipRef}
                                className="relative group/toprated cursor-help"
                                onClick={() => setIsTopRatedTooltipVisible(!isTopRatedTooltipVisible)}
                            >
                                <span 
                                    className="text-[10px] font-bold uppercase tracking-wider text-black px-2.5 py-1 rounded-full flex items-center gap-1 border-2 border-transparent"
                                    style={{
                                        background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #fec312, #ff4f6d, #c400d2, #7c3bed) border-box',
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
                                    Top Rated
                                </span>

                                <div 
                                    className={`absolute bottom-full left-0 mb-3 w-48 p-3 bg-white border-2 border-transparent text-black text-[11px] rounded-xl shadow-xl z-50 pointer-events-none transform transition-all duration-200
                                    ${isTopRatedTooltipVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2 md:group-hover/toprated:opacity-100 md:group-hover/toprated:visible md:group-hover/toprated:translate-y-0'}`}
                                    style={{
                                        background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #fec312, #ff4f6d, #c400d2, #7c3bed) border-box',
                                    }}
                                >
                                    <p className="leading-relaxed text-center">Top 3 highest-rated posts this week</p>
                                </div>
                            </div>
                        )}
                        {badge === 'top_rated_previous' && (
                            <div 
                                className="relative group/prevrated cursor-help"
                            >
                                <span className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#FEC312] border border-gray-200 flex items-center gap-1.5 transition-colors group-hover/prevrated:bg-gray-100">
                                    <span className="opacity-70">🏆</span> Prev Top Rated
                                </span>
                                <div className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-white border-2 border-gray-100 text-black text-[12px] rounded-2xl shadow-2xl pointer-events-none opacity-0 invisible -translate-y-2 group-hover/prevrated:opacity-100 group-hover/prevrated:visible group-hover/prevrated:translate-y-0 transition-all duration-200 hidden md:block z-50">
                                    <p className="leading-relaxed text-center font-medium">This design was among the top rated in a previous period</p>
                                    <div className="absolute top-full left-6 border-8 border-transparent border-t-white" />
                                </div>
                            </div>
                        )}
                    </div>
                    <span 
                      className="text-xs font-medium text-gray-400"
                      title={getFullTimestamp(post.created_at)}
                    >
                      {formatTimestamp(post.created_at, now)}
                      {post.updated_at && new Date(post.updated_at).getTime() > new Date(post.created_at).getTime() && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Edited</span>
                        </>
                      )}
                    </span>
                </div>

                {/* 3. Title */}
                <div className="flex items-center justify-between mb-2 gap-4">
                    <h1 className="text-lg xs:text-xl font-semibold text-black leading-tight">
                        {post.title}
                    </h1>
                    <div 
                        ref={reviewCountTooltipRef}
                        className="relative group/tooltip cursor-help shrink-0"
                        onClick={() => setIsReviewCountTooltipVisible(!isReviewCountTooltipVisible)}
                    >
                        <span className="text-sm font-medium sm:font-semibold text-gray-800 flex items-center whitespace-nowrap">
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
                            {metrics?.review_count || 0} {(metrics?.review_count === 1) ? 'review' : 'reviews'}
                        </span>

                        <div className={`absolute bottom-full right-0 mb-3 w-[calc(100vw-3rem)] xs:w-64 p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl z-50 pointer-events-none transform transition-all duration-200
                            ${isReviewCountTooltipVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2 md:group-hover/tooltip:opacity-100 md:group-hover/tooltip:visible md:group-hover/tooltip:translate-y-0'}`}
                        >
                            <p className="leading-relaxed text-center">
                                {isHot ? "This design is getting high attention based on recent reviews" : "Number of structured reviews this design has received"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Description */}
                <div>
                    <p className={`text-sm text-gray-600 leading-relaxed transition-all duration-300 ${!isExpanded ? 'line-clamp-3' : ''}`}>
                        {post.description}
                    </p>
                    {post.description.length > 160 && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs font-bold text-black mt-3 flex items-center gap-1.5 hover:text-[#FEC312] transition-colors uppercase tracking-widest group"
                        >
                            <span>{isExpanded ? 'Show Less' : 'Read more'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} group-hover:translate-y-0.5`} />
                        </button>
                    )}
                </div>

                {/* 5. Avatar & Rating */}
                <div className="flex items-center justify-between">
                    <Link 
                        href={`/@${currentAvatar && post.avatar_id === currentAvatar.id ? currentAvatar.username : (avatar?.username ?? post.avatar_id)}`}
                        scroll={false}
                        className="flex items-center gap-3 group/author"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-transparent group-hover/author:ring-[#FEC312] transition-all">
                            <img 
                                src={avatar?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.avatar_id}`} 
                                className="w-full h-full object-cover group-hover/author:scale-110 transition-transform duration-300" 
                                alt="Avatar" 
                            />
                        </div>
                        <div className="text-left flex flex-col min-w-0">
                            <span className="block text-sm font-semibold text-black group-hover/author:text-[#FEC312] transition-colors truncate">{avatar?.name || 'Unknown'}</span>
                            <span className="block text-[10px] text-gray-400 font-medium tracking-wider truncate mt-0.5">@{avatar?.username || post.avatar_id}</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                         {!metrics?.rating_unlocked ? (
                             <div className="relative group/lock cursor-help flex items-center gap-1.5 pl-2">
                                 <img src="/icons/star-inactive.svg" alt="rating locked" className="w-5 h-5 group-hover/lock:opacity-80 transition-all" />
                                 <Lock className="w-4 h-4 text-gray-400 group-hover/lock:text-gray-500 transition-colors" />
                                 <div className="absolute bottom-full right-0 mb-3 w-48 p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl z-50 pointer-events-none opacity-0 invisible translate-y-2 group-hover/lock:opacity-100 group-hover/lock:visible group-hover/lock:translate-y-0 transition-all duration-200 hidden md:block">
                                     <p className="leading-relaxed text-center font-medium">Rating Unlocks at 3 Reviews</p>
                                 </div>
                             </div>
                         ) : (
                             <>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5].map(i => (
                                        <img 
                                            key={i} 
                                            src={i <= Math.floor(metrics.average_score) ? "/icons/star-active-yellow.svg" : "/icons/star-inactive.svg"} 
                                            alt="star"
                                            className="w-5 h-5"
                                        />
                                    ))}
                                </div>
                                <span className="text-2xl font-semibold text-black">{metrics.average_score}</span>
                             </>
                         )}
                    </div>
                </div>

                {isReportOpen && (
                    <ReportPostOverlay 
                        onClose={() => setIsReportOpen(false)} 
                        onSubmit={(reason, details) => {
                            console.log('Report submitted:', reason, details);
                            setIsReportOpen(false);
                        }} 
                    />
                )}

                {isShareOpen && <SharePostOverlay onClose={() => setIsShareOpen(false)} post_id={post.id} />}
            </div>

            {/* RIGHT COLUMN: Review Form */}
            <div className="md:col-span-5 relative">
                <div className="sticky top-8">
                    {rateLimitMessage && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-[24px] text-amber-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                             <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">⏳</div>
                             <p className="font-medium">{rateLimitMessage}</p>
                        </div>
                    )}

                    {isSelfPost ? (
                         <div className="bg-gray-50 p-12 rounded-[32px] text-center border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚫</div>
                            <h3 className="font-semibold text-xl mb-2 text-gray-700">Self-Review Locked</h3>
                            <p className="text-gray-500">You cannot review your own post.</p>
                         </div>
                    ) : !hasReviewed ? (
                        <ReviewForm 
                            onSubmit={handleReviewSubmit} 
                            isLoggedIn={!!currentAvatar}
                            initialName={currentAvatar?.name}
                            postId={post.id}
                            userId={currentAvatar?.id}
                        />
                    ) : (
                         <div className="bg-gray-50 p-12 rounded-[32px] text-center">
                            <div className="w-16 h-16 bg-[#FEC312]/20 text-[#FEC312] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🙌</div>
                            <h3 className="font-medium text-xl mb-2">Review added</h3>
                            <p className="text-gray-500">Your thoughts are now part of the conversation.</p>
                         </div>
                    )}
                </div>
            </div>

        </div>

        {/* BOTTOM SECTION: Reviews List */}
        <div className="border-t border-gray-100 pt-8 xs:pt-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                <h2 className="text-xl font-semibold text-black shrink-0">Reviews ({allReviews.length})</h2>
                
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    {['Recent', 'Top', 'Critical', 'Oldest'].map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setSortBy(option)}
                            className={`px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all duration-200 ${
                                sortBy === option
                                    ? "bg-[#FEC312]/10 border-[#FEC312]/40 text-black"
                                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:text-black"
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {isFetchingReviews ? (
                    <div className="py-20 text-center text-gray-400 font-medium"><AmbientLoadingText /></div>
                ) : allReviews.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-20 px-8 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200"
                    >
                        <div className="w-16 h-16 bg-[#FEC312]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Plus className="w-8 h-8 text-[#FEC312]" />
                        </div>
                        <h3 className="text-xl font-semibold text-black mb-2">Be the first to rate this design</h3>
                        <p className="text-gray-500 max-w-xs mx-auto text-[15px] leading-relaxed">
                            Your feedback helps the designer improve and helps the community find the best work.
                        </p>
                    </motion.div>
                ) : visibleReviews.map((review) => {
                    const ratingAvg = (review.clarity + review.purpose + review.aesthetics) / 3;
                    const timeLabel = formatTimestamp(review.created_at, now);
                    const fullTime = getFullTimestamp(review.created_at);
                    const isReviewEdited = review.updated_at && 
                      new Date(review.updated_at).getTime() > new Date(review.created_at).getTime();

                    return (
                        <motion.div 
                            key={review.id} 
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="bg-white border border-gray-200 rounded-[20px] p-5 xs:p-8 flex flex-col xs:flex-row xs:items-center justify-between gap-4 xs:gap-8"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
                                        {review.reviewer_id && allAvatars[review.reviewer_id]?.avatar_url ? (
                                            <img src={allAvatars[review.reviewer_id].avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer_id || review.reviewer_name || review.id}`} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex flex-col xs:flex-row xs:items-center gap-0.5 xs:gap-3 min-w-0 flex-1 xs:flex-none">
                                        <span className="font-medium text-base text-black truncate max-w-[150px] xs:max-w-none">{getReviewerDisplayName(review)}</span>
                                        <div className="flex gap-0.5">
                                            {[1,2,3,4,5].map(i => (
                                                <img key={i} src={i <= Math.floor(ratingAvg) ? "/icons/star-active-yellow.svg" : "/icons/star-inactive.svg"} className="w-3.5 h-3.5" alt="" />
                                            ))}
                                        </div>
                                    </div>
                                    <span 
                                      className="text-xs text-gray-400 font-medium ml-auto xs:ml-0 shrink-0 self-start xs:self-center mt-1 xs:mt-0"
                                      title={fullTime}
                                    >
                                      {timeLabel}
                                      {isReviewEdited && (
                                        <>
                                          <span className="mx-1">•</span>
                                          <span>Edited</span>
                                        </>
                                      )}
                                    </span>
                                </div>

                                {review.comment && <p className="text-sm text-black leading-relaxed mb-6">{review.comment}</p>}

                                <div className="flex items-center justify-between gap-4 pt-3 xs:pt-0 border-t xs:border-t-0 border-gray-100">
                                    <div className="flex flex-wrap gap-3 xs:gap-6">
                                        <div className="flex items-center gap-1.5 text-md font-semibold text-black" title="Clarity">
                                            <img src="https://img.icons8.com/external-creatype-blue-field-colourcreatype/100/external-clarity-tools-design-creatype-blue-field-colourcreatype.png" alt="Clarity" className="w-5 h-5 object-contain" />
                                            {review.clarity}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-md font-semibold text-black" title="Purpose">
                                            <img src="https://img.icons8.com/color/96/goal--v1.png" alt="Purpose" className="w-5 h-5 object-contain" />
                                            {review.purpose}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-md font-semibold text-black" title="Aesthetics">
                                            <img src="https://img.icons8.com/color/96/color-palette.png" alt="Aesthetics" className="w-5 h-5 object-contain" />
                                            {review.aesthetics}
                                        </div>
                                    </div>


                                    <div className="text-right shrink-0 xs:hidden">
                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Rating</div>
                                        <div className="text-lg font-semibold md:font-bold text-black">{ratingAvg.toFixed(1)}/5.0</div>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden xs:block text-right shrink-0">
                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Rating</div>
                                <div className="text-xl font-semibold text-black">{ratingAvg.toFixed(1)}/5.0</div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {hasMoreReviews && (
                <div className="flex justify-center mt-10">
                    <button onClick={handleLoadMore} className="group relative px-8 py-3.5 bg-[#111111] text-white text-sm font-medium rounded-full hover:bg-[#222222] active:scale-[0.97] transition-all duration-200 flex items-center gap-2">
                        Load More Reviews
                        <span className="text-white/60 text-xs font-medium">({Math.min(REVIEWS_PER_PAGE, remainingReviews)} of {remainingReviews} remaining)</span>
                    </button>
                </div>
            )}
            {!hasMoreReviews && sortedReviews.length > REVIEWS_PER_PAGE && (
                <div className="flex justify-center mt-10"><span className="text-sm text-gray-400 font-medium">All reviews shown</span></div>
            )}
        </div>
      </div>

      {/* Fullscreen Image Overlay */}
      {isImageFullscreen && (
          <div 
              ref={containerRef}
              className="fixed inset-0 z-60 flex items-center justify-center p-4 overflow-hidden"
              onPointerDown={(e) => {
                  if (e.target === e.currentTarget) {
                      setIsImageFullscreen(false);
                      setZoomScale(1);
                  }
              }}
          >
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-none" />
               <div className="absolute bottom-6 left-6 md:top-4 md:right-4 md:bottom-auto md:left-auto flex md:flex-col flex-row gap-4 z-50 pointer-events-auto">
                    <button className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full items-center justify-center text-white transition-all hover:scale-105 active:scale-95 hidden md:flex" onClick={(e) => { e.stopPropagation(); setIsImageFullscreen(false); setZoomScale(1); }}>
                        <X className="w-6 h-6" />
                    </button>
                    <button onClick={async (e) => {
                        e.stopPropagation();
                        try {
                            const response = await fetch(post.image_url);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${post.title.replace(/\s+/g, '_')}.jpg`;
                            document.body.appendChild(link); link.click();
                            document.body.removeChild(link); window.URL.revokeObjectURL(url);
                        } catch (err) { window.open(post.image_url, '_blank'); }
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
               <motion.img 
                   ref={imgRef}
                   src={post.image_url} 
                   className="max-w-full max-h-full object-contain rounded-lg shadow-2xl relative z-10"
                   style={{ x, y, cursor: zoomScale > 1 ? 'grab' : 'default' }}
                   whileDrag={{ cursor: 'grabbing' }}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: zoomScale }}
                   transition={{ duration: 0.25, ease: "easeOut" }}
                   drag={zoomScale > 1}
                   dragConstraints={dragConstraints}
                   dragMomentum={false}
                   dragElastic={0}
                   onLoad={() => updateConstraints(zoomScale)}
                   onPointerDown={() => {
                        const now = Date.now();
                        if (now - lastTapRef.current < 300) { setZoomScale(prev => prev > 1 ? 1 : ZOOM_IN_SCALE); lastTapRef.current = 0; }
                        else { lastTapRef.current = now; }
                   }}
               />
           </div>
      )}
    </motion.div>
  );
}

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
    MOCK_POSTS, 
    getReviewsByPostId, 
    getReviewerDisplayName, 
    calculatePostMetrics, 
    type Review, 
    type Post, 
    type PostMetrics 
} from '../logic/mockData';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

import { ReviewForm } from './ReviewForm';
import { Button } from './ui/Button';
import { formatTimeAgo } from '../lib/utils';
import { SharePostOverlay } from './SharePostOverlay';
import { ReportPostOverlay } from './ReportPostOverlay';
import { useBadges } from '../hooks/useBadges';
import { useHotPosts } from '../hooks/useHotPosts';

import { getDeviceId, hasReviewedPost, markPostAsReviewed } from '../utils/deviceTracking';
import { motion, useMotionValue } from 'framer-motion';
import { 
    ArrowLeft, 
    Download, 
    Share2, 
    ChevronDown, 
    Check, 
    X, 
    Plus, 
    Minus 
} from 'lucide-react';

const REVIEWS_PER_PAGE = 5;
const RATE_LIMIT_KEY = 'rater_review_timestamps';

interface PostDetailOverlayProps {
  post: Post;
  onClose: () => void;
}

export function PostDetailContent({ post, onClose }: PostDetailOverlayProps) {
  const { currentAvatar, allAvatars } = useAuth();
  
  // Data State
  const [dbReviews, setDbReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]); 
  const [metrics, setMetrics] = useState<PostMetrics | null>(null);
  
  // UI State
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isSelfPost, setIsSelfPost] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [isFetchingReviews, setIsFetchingReviews] = useState(true);

  // External Metadata (Badges, Hot Status)
  const { badgeMap } = useBadges(MOCK_POSTS);
  const { hotPostIds } = useHotPosts(MOCK_POSTS);
  const badge = badgeMap[post.id];
  const isHot = hotPostIds.has(post.id);

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
    if (currentAvatar && post.author_id === currentAvatar.id) {
        setIsSelfPost(true);
    } else {
        setIsSelfPost(false);
    }

    // Check device-based review history
    if (hasReviewedPost(post.id)) {
        setHasReviewed(true);
    }

    return () => { isMounted = false; };
  }, [post.id, currentAvatar, post.author_id]);

  // 2. Derive metrics locally when userReviews change (Optimistic UI)
  useEffect(() => {
    if (userReviews.length > 0) {
        calculatePostMetrics(post.id, userReviews).then(setMetrics);
    }
  }, [userReviews, post.id]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('Newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  
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

  // Merged Collection
  const allReviews = useMemo(() => {
    return [...userReviews, ...dbReviews];
  }, [userReviews, dbReviews]);

  const sortedReviews = useMemo(() => {
    return [...allReviews].sort((a, b) => {
      const getAvg = (r: Review) => (r.clarity + r.purpose + r.aesthetics) / 3;
      const getTime = (r: Review) => new Date(r.created_at).getTime();

      if (sortBy === 'Highest Rated') return getAvg(b) - getAvg(a);
      if (sortBy === 'Lowest Rated') return getAvg(a) - getAvg(b);
      if (sortBy === 'Newest') return getTime(b) - getTime(a);
      if (sortBy === 'Oldest') return getTime(a) - getTime(b);
      return 0;
    });
  }, [allReviews, sortBy]);

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMoreReviews = visibleCount < sortedReviews.length;
  const remainingReviews = sortedReviews.length - visibleCount;

  const handleReviewSubmit = async (ratings: any, comment: string, reviewer_name: string) => {
    if (currentAvatar && post.author_id === currentAvatar.id) return;
    
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
        setRateLimitMessage("You're reviewing quickly — slow down a bit 🙂");
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

  const avatar = allAvatars[post.author_id];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full bg-white relative"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        
        {/* HEADER: Back Button */}
        <div className="mb-8">
            <Button 
                variant="secondary" 
                onClick={onClose}
                className="rounded-full gap-2 pl-3 pr-5 border-2 border-gray-100 font-semibold hover:bg-gray-50"
            >
                <ArrowLeft className="w-5 h-5 text-black" />
                Back
            </Button>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 relative">
            
            {/* LEFT COLUMN: Content */}
            <div className="md:col-span-7 space-y-6">
                
                {/* 1. Image Preview */}
                <div 
                    className="group relative w-full aspect-auto xs:aspect-video rounded-[32px] overflow-hidden bg-gray-50 cursor-zoom-in"
                    onClick={() => setIsImageFullscreen(true)}
                >
                    <img 
                        src={post.image_url} 
                        alt={post.title} 
                        className="w-full h-auto xs:h-full xs:object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
                            Click to view full image
                        </span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-6 right-6 flex gap-3 z-20">
                         <button 
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    const response = await fetch(post.image_url);
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${post.title.replace(/\s+/g, '_')}.jpg`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                } catch (err) {
                                    console.error('Download failed', err);
                                    window.open(post.image_url, '_blank');
                                }
                            }}
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <Download className="w-5 h-5 text-black" />
                        </button>

                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsShareOpen(true);
                            }}
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <Share2 className="w-5 h-5 text-black" />
                        </button>
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
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FEC312] text-[#111111] px-3 py-1.5 rounded-full flex items-center gap-1">
                                    🏆 Top Rated
                                </span>

                                <div className={`absolute bottom-full left-0 mb-3 w-48 p-3 bg-white border-2 border-[#FEC312] text-black text-[11px] rounded-xl shadow-xl z-50 pointer-events-none transform transition-all duration-200
                                    ${isTopRatedTooltipVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2 md:group-hover/toprated:opacity-100 md:group-hover/toprated:visible md:group-hover/toprated:translate-y-0'}`}
                                >
                                    <p className="leading-relaxed text-center">Top 3 highest-rated posts this week</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <span className="text-xs font-medium text-gray-400">{formatTimeAgo(post.created_at)}</span>
                </div>

                {/* 3. Title */}
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl xs:text-2xl font-semibold text-[#111111] leading-tight">
                        {post.title}
                    </h1>
                    <div 
                        ref={reviewCountTooltipRef}
                        className="relative group/tooltip cursor-help"
                        onClick={() => setIsReviewCountTooltipVisible(!isReviewCountTooltipVisible)}
                    >
                        <span className="text-sm font-medium sm:font-semibold text-black flex items-center">
                            {isHot && (
                                <div className="w-8 h-8 -ml-2 -mt-3">
                                    <DotLottieReact
                                        src="https://lottie.host/0051bccf-4dba-4f76-8d09-42856cd7e0a6/g2u4ipRES7.lottie"
                                        loop
                                        autoplay
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
                    <p className={`text-base text-gray-600 leading-relaxed transition-all duration-300 ${!isExpanded ? 'line-clamp-3' : ''}`}>
                        {post.description}
                    </p>
                    {post.description.length > 160 && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs font-bold text-[#111111] mt-3 flex items-center gap-1.5 hover:text-[#FEC312] transition-colors uppercase tracking-widest group"
                        >
                            <span>{isExpanded ? 'Show Less' : 'Read Full Description'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} group-hover:translate-y-0.5`} />
                        </button>
                    )}
                </div>

                {/* 5. Avatar & Rating */}
                <div className="flex items-center justify-between">
                    <Link 
                        href={currentAvatar && post.author_id === currentAvatar.id ? "/app/avatar" : `/app/avatar/${post.author_id}`}
                        className="flex items-center gap-3 group/author"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-transparent group-hover/author:ring-[#FEC312] transition-all">
                            <img 
                                src={avatar?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`} 
                                className="w-full h-full object-cover group-hover/author:scale-110 transition-transform duration-300" 
                                alt="Avatar" 
                            />
                        </div>
                        <div className="text-left">
                            <span className="block text-sm font-semibold text-[#111111] group-hover/author:text-[#FEC312] transition-colors">{avatar?.name || 'Unknown'}</span>
                            <span className="block text-[10px] text-gray-400 font-medium tracking-wider">View Profile</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                         {!metrics?.rating_unlocked ? (
                             <span className="text-xs xs:text-sm font-bold text-[#009241]">Rating Unlocks at 3 Reviews</span>
                         ) : (
                             <>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5].map(i => (
                                        <img 
                                            key={i} 
                                            src={i <= Math.floor(metrics.average_score) ? "/icons/star-active-yellow.svg" : "/icons/star-inactive.svg"} 
                                            alt="star"
                                            className="w-6 h-6"
                                        />
                                    ))}
                                </div>
                                <span className="text-2xl font-semibold text-[#111111]">{metrics.average_score}</span>
                             </>
                         )}
                    </div>
                </div>

                {isShareOpen && <SharePostOverlay onClose={() => setIsShareOpen(false)} post_id={post.id} />}

                <div className="text-xs text-[#EB5757] font-medium pt-2">
                     *Attribution is claimed by the submitter and not independently verified. 
                     <button onClick={() => setIsReportOpen(true)} className="underline text-sm font-semibold ml-1 hover:text-[#c0392b]">Report</button> if you believe attribution is incorrect.
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
                        />
                    ) : (
                         <div className="bg-gray-50 p-12 rounded-[32px] text-center">
                            <div className="w-16 h-16 bg-[#FEC312]/20 text-[#FEC312] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🙌</div>
                            <h3 className="font-bold text-xl mb-2">Thanks for your feedback</h3>
                            <p className="text-gray-500">Your review has been recorded.</p>
                         </div>
                    )}
                </div>
            </div>

        </div>

        {/* BOTTOM SECTION: Reviews List */}
        <div className="border-t border-gray-100 pt-8 xs:pt-12">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-semibold text-[#111111]">Reviews ({allReviews.length})</h2>
                
                <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="px-4 py-2 border border-black rounded-lg text-sm font-semibold flex items-center gap-2 bg-white hover:bg-gray-50"
                    >
                        {sortBy}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isSortOpen && (
                        <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {['Highest Rated', 'Lowest Rated', 'Newest', 'Oldest'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-sm font-semibold hover:bg-gray-50 flex items-center justify-between ${sortBy === option ? 'bg-gray-50 text-[#FEC312]' : 'text-[#111111]'}`}
                                >
                                    {option}
                                    {sortBy === option && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {isFetchingReviews ? (
                    <div className="py-20 text-center text-gray-400 font-medium">Loading reviews...</div>
                ) : visibleReviews.map((review) => {
                    const ratingAvg = (review.clarity + review.purpose + review.aesthetics) / 3;
                    const timeLabel = formatTimeAgo(review.created_at);

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
                                    <span className="font-semibold text-base text-[#111111]">{getReviewerDisplayName(review)}</span>
                                    <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(i => (
                                            <img key={i} src={i <= Math.floor(ratingAvg) ? "/icons/star-active-yellow.svg" : "/icons/star-inactive.svg"} className="w-3.5 h-3.5" alt="" />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">{timeLabel}</span>
                                </div>

                                {review.comment && <p className="text-sm text-[#111111] leading-relaxed mb-6">{review.comment}</p>}

                                <div className="flex items-center justify-between gap-4 pt-3 xs:pt-0 border-t xs:border-t-0 border-gray-100">
                                    <div className="flex flex-wrap gap-3 xs:gap-6">
                                        <div className="flex items-center gap-1.5 text-md font-semibold text-[#111111]" title="Clarity">
                                            <img src="https://img.icons8.com/external-creatype-blue-field-colourcreatype/100/external-clarity-tools-design-creatype-blue-field-colourcreatype.png" alt="Clarity" className="w-5 h-5 object-contain" />
                                            {review.clarity}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-md font-semibold text-[#111111]" title="Purpose">
                                            <img src="https://img.icons8.com/color/96/goal--v1.png" alt="Purpose" className="w-5 h-5 object-contain" />
                                            {review.purpose}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-md font-semibold text-[#111111]" title="Aesthetics">
                                            <img src="https://img.icons8.com/color/96/color-palette.png" alt="Aesthetics" className="w-5 h-5 object-contain" />
                                            {review.aesthetics}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 xs:hidden">
                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Rating</div>
                                        <div className="text-xl font-semibold md:font-bold text-[#111111]">{ratingAvg.toFixed(1)}/5.0</div>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden xs:block text-right shrink-0">
                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Rating</div>
                                <div className="text-xl font-semibold text-[#111111]">{ratingAvg.toFixed(1)}/5.0</div>
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
                    <button onClick={(e) => { e.stopPropagation(); setIsShareOpen(true); }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"><Share2 className="w-5 h-5 text-black" /></button>
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


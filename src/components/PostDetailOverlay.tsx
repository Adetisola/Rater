import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check, X, Download } from 'lucide-react'; // Added icons
import type { Post, Review } from '../logic/mockData';
import { MOCK_POSTS } from '../logic/mockData';
import { MOCK_AVATARS } from '../logic/mockData';

import { ReviewForm } from './ReviewForm';
import { Button } from './ui/Button';
import { formatTimeAgo } from '../lib/utils';
import { SharePostOverlay } from './SharePostOverlay';
import { ReportPostOverlay } from './ReportPostOverlay';
import { computeBadges } from '../logic/badgeUtils';

const REVIEWS_PER_PAGE = 5;

interface PostDetailOverlayProps {
  post: Post;
  onClose: () => void;
}

export function PostDetailOverlay({ post, onClose }: PostDetailOverlayProps) {
  // Local state to simulate new reviews being added
  const [userReviews, setUserReviews] = useState<Review[]>([]); 
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // For description
  const [sortBy, setSortBy] = useState('Newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Reset visible count when sort changes
  useEffect(() => {
    setVisibleCount(REVIEWS_PER_PAGE);
  }, [sortBy]);

  // Compute badge for this post using centralized logic
  const badgeMap = useMemo(() => computeBadges(MOCK_POSTS), []);
  const badge = badgeMap[post.id];

  // Use actual reviews from the post data + any user-submitted reviews
  const allReviews = [...userReviews, ...post.reviews];

  const sortedReviews = useMemo(() => {
    return [...allReviews].sort((a, b) => {
      const getAvg = (r: Review) => (r.ratings.clarity + r.ratings.purpose + r.ratings.aesthetics) / 3;
      const getTime = (r: Review) => new Date(r.createdAt).getTime();

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

  const handleReviewSubmit = (ratings: any, comment: string, reviewerName: string) => {
    const newReview: Review = {
        id: Math.random().toString(),
        postId: post.id,
        ratings,
        comment,
        reviewerName,
        createdAt: new Date().toISOString()
    };
    setUserReviews([newReview, ...userReviews]);
    setHasReviewed(true);
  };

  // Total reviews = actual post reviews + user-submitted reviews
  const totalReviews = allReviews.length;
  const isLocked = totalReviews < 3;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + REVIEWS_PER_PAGE, sortedReviews.length));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.15, ease: "easeIn" }
      }}
      transition={{ 
        duration: 0.25, 
        ease: "easeOut"
      }}
      className="fixed inset-0 z-50 bg-white overflow-y-auto custom-scrollbar"
    >
      
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        
        {/* HEADER: Back Button */}
        <div className="mb-8">
            <Button 
                variant="secondary" 
                onClick={onClose}
                className="rounded-full px-6 border-2 border-gray-100 font-bold hover:bg-gray-50"
            >
                Back
            </Button>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 relative">
            
            {/* LEFT COLUMN: Content (Span 7) */}
            <div className="md:col-span-7 space-y-6">
                
                {/* 1. Image Preview */}
                <div 
                    className="group relative w-full aspect-video rounded-[32px] overflow-hidden bg-gray-50 cursor-zoom-in"
                    onClick={() => setIsImageFullscreen(true)}
                >
                    <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
                            Click to view full image
                        </span>
                    </div>
                    
                    
                    {/* Action Buttons - Top Right */}
                    <div className="absolute top-6 right-6 flex gap-3 z-20">
                         {/* Download Button */}
                         <button 
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    const response = await fetch(post.imageUrl);
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
                                    window.open(post.imageUrl, '_blank');
                                }
                            }}
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <Download className="w-5 h-5 text-black" />
                        </button>

                        {/* Share Button */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsShareOpen(true);
                            }}
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <img src="/icons/share.svg" className="w-5 h-5" alt="Share" />
                        </button>
                    </div>
                </div>

                {/* 2. Metadata Row */}
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-3 py-1.5 rounded-full">
                            {post.category}
                        </span>
                        {/* Badge - Only ONE badge per post, computed by badgeUtils */}
                        {badge === 'top-rated' && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FEC312] text-black px-3 py-1.5 rounded-full flex items-center gap-1">
                                🏆 Top Rated
                            </span>
                        )}

                        {badge === 'most-discussed' && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#7C2BED] text-white px-3 py-1.5 rounded-full flex items-center gap-1">
                                💬 Most Discussed
                            </span>
                        )}
                     </div>
                     <span className="text-xs font-medium text-gray-400">
                        {formatTimeAgo(post.createdAt)}
                     </span>
                </div>

                {/* 3. Title */}
                <h1 className="text-2xl font-bold text-[#111111] leading-tight">
                    {post.title}
                </h1>

                {/* 4. Description */}
                <div>
                    <p className={`text-base text-gray-600 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                        {post.description} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque enim mauris, hendrerit a ante dapibus, sollicitudin lobortis eros. Cras id facilisis nulla. Suspendisse potenti. Fusce quam risus, ultricies quis imperdiet sit.
                    </p>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-bold text-[#111111] mt-2 underline"
                    >
                        {isExpanded ? 'Read less' : 'Read more'}
                    </button>
                </div>

                {/* 5. Author */}
                {/* 5. Author & Rating */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.designerId}`} className="w-full h-full object-cover" alt="Avatar" />
                        </div>
                        <span className="text-sm font-bold text-[#111111]">{MOCK_AVATARS[post.designerId]?.name || 'Unknown'}</span>
                    </div>

                    {/* RATING DISPLAY (Moved Here) */}
                    <div className="flex items-center gap-3">
                         {isLocked ? (
                             <span className="text-sm font-bold text-[#009241]">Rating Unlocks at 3 Reviews</span>
                         ) : (
                             <>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5].map(i => (
                                        <img 
                                            key={i} 
                                            src={i <= Math.floor(post.rating.average) ? "/icons/star-active-yellow.svg" : "/icons/star-inactive.svg"} 
                                            alt="star"
                                            className="w-6 h-6"
                                        />
                                    ))}
                                </div>
                                <span className="text-3xl font-bold text-[#111111]">{post.rating.average}/5</span>
                             </>
                         )}
                    </div>
                </div>



                {isShareOpen && (
                    <SharePostOverlay onClose={() => setIsShareOpen(false)} postId={post.id} />
                )}

                <div className="text-xs text-[#EB5757] font-medium pt-2">
                     *Attribution is claimed by the submitter and not independently verified. 
                     <button 
                        onClick={() => setIsReportOpen(true)}
                        className="underline font-bold ml-1 hover:text-[#c0392b]"
                     >
                        Report
                     </button> if you believe attribution is incorrect.
                </div>
                
                {isReportOpen && (
                    <ReportPostOverlay 
                        onClose={() => setIsReportOpen(false)} 
                        onSubmit={(reason, details) => {
                            console.log('Report submitted:', reason, details);
                            setIsReportOpen(false);
                            // Add toast or notification here later
                        }} 
                    />
                )}

            </div>

            {/* RIGHT COLUMN: Sticky Review Form (Span 5) */}
            <div className="md:col-span-5 relative">
                <div className="sticky top-8">


                    {!hasReviewed ? (
                        <ReviewForm onSubmit={handleReviewSubmit} />
                    ) : (
                         <div className="bg-gray-50 p-12 rounded-[32px] text-center">
                            <div className="w-16 h-16 bg-[#FEC312]/20 text-[#FEC312] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                🙌
                            </div>
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
                <h2 className="text-2xl font-bold text-[#111111]">Reviews ({totalReviews})</h2>
                
                {/* Sort Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="px-4 py-2 border border-black rounded-lg text-xs font-bold flex items-center gap-2 bg-white hover:bg-gray-50"
                    >
                        {sortBy}
                        <ChevronDown className={`w-3 h-3 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isSortOpen && (
                        <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {['Highest Rated', 'Lowest Rated', 'Newest', 'Oldest'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        setSortBy(option);
                                        setIsSortOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 flex items-center justify-between ${sortBy === option ? 'bg-gray-50 text-[#FEC312]' : 'text-[#111111]'}`}
                                >
                                    {option}
                                    {sortBy === option && <Check className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {visibleReviews.map((review) => {
                    const ratingAvg = (review.ratings.clarity + review.ratings.purpose + review.ratings.aesthetics) / 3;
                    const timeLabel = formatTimeAgo(review.createdAt);

                    return (
                        <motion.div 
                            key={review.id} 
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="bg-white border border-gray-200 rounded-[20px] p-5 xs:p-8 flex flex-col xs:flex-row xs:items-center justify-between gap-4 xs:gap-8"
                        >
                            
                            {/* Left Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="font-bold text-base text-[#111111]">{review.reviewerName || 'Anonymous'}</span>
                                    <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(i => (
                                            <img 
                                                key={i} 
                                                src={i <= Math.floor(ratingAvg) ? "/icons/star-active-yellow.svg" : "/icons/star-inactive.svg"} 
                                                className="w-3.5 h-3.5" 
                                                alt="" 
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">{timeLabel}</span>
                                </div>

                                {review.comment && (
                                    <p className="text-sm text-[#111111] leading-relaxed mb-6">
                                        {review.comment}
                                    </p>
                                )}

                                {/* Footer row: Criteria + Total Rating on same line */}
                                <div className="flex items-center justify-between gap-4 pt-3 xs:pt-0 border-t xs:border-t-0 border-gray-100">
                                    <div className="flex flex-wrap gap-3 xs:gap-6">
                                        <div className="text-xs font-bold text-[#111111]">Clarity: {review.ratings.clarity}</div>
                                        <div className="text-xs font-bold text-[#111111]">Purpose: {review.ratings.purpose}</div>
                                        <div className="text-xs font-bold text-[#111111]">Aesthetics: {review.ratings.aesthetics}</div>
                                    </div>

                                    {/* Total Rating - visible on mobile only, desktop has separate column */}
                                    <div className="text-right shrink-0 xs:hidden">
                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Rating</div>
                                        <div className="text-xl font-bold text-[#111111]">{ratingAvg.toFixed(1)}/5.0</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Content - Total Rating (desktop only) */}
                            <div className="hidden xs:block text-right shrink-0">
                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Rating</div>
                                <div className="text-xl font-bold text-[#111111]">{ratingAvg.toFixed(1)}/5.0</div>
                            </div>

                        </motion.div>
                    );
                })}
            </div>

            {/* Load More Button */}
            {hasMoreReviews && (
                <div className="flex justify-center mt-10">
                    <button
                        onClick={handleLoadMore}
                        className="group relative px-8 py-3.5 bg-[#111111] text-white text-sm font-bold rounded-full hover:bg-[#222222] active:scale-[0.97] transition-all duration-200 flex items-center gap-2"
                    >
                        Load More Reviews
                        <span className="text-white/60 text-xs font-medium">
                            ({Math.min(REVIEWS_PER_PAGE, remainingReviews)} of {remainingReviews} remaining)
                        </span>
                    </button>
                </div>
            )}

            {/* All reviews shown indicator */}
            {!hasMoreReviews && sortedReviews.length > REVIEWS_PER_PAGE && (
                <div className="flex justify-center mt-10">
                    <span className="text-sm text-gray-400 font-medium">All reviews shown</span>
                </div>
            )}

        </div>

      </div>

      {/* Fullscreen Image Overlay */}
      {isImageFullscreen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
               {/* Backdrop */}
               <div 
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                  onClick={() => setIsImageFullscreen(false)}
               />

               {/* Content */}
               <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                    <button 
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors pointer-events-auto"
                        onClick={() => setIsImageFullscreen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200 pointer-events-auto"
                    />
               </div>
          </div>
      )}

    </motion.div>
  );
}

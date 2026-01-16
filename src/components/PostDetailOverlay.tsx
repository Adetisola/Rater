import { useState } from 'react';
import { Flag, ChevronDown, Check } from 'lucide-react'; // Added icons
import type { Post } from '../logic/mockData';
import { StarRating } from './ui/StarRating';
import { ReviewForm } from './ReviewForm';
import { Button } from './ui/Button';
import { formatTimeAgo } from '../lib/utils';
import { ReportPostOverlay } from './ReportPostOverlay';

interface PostDetailOverlayProps {
  post: Post;
  onClose: () => void;
}

export function PostDetailOverlay({ post, onClose }: PostDetailOverlayProps) {
  // Local state to simulate new reviews being added
  const [reviews, setReviews] = useState<any[]>([]); 
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // For description
  const [sortBy, setSortBy] = useState('Highest Rated');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Static mock reviews to demonstrate sorting
  const MOCK_REVIEWS_LIST = [
      {
          id: 'r_mock_1',
          name: 'Sarah Design',
          timeAgo: '2d ago',
          timestamp: Date.now() - 1000 * 60 * 60 * 48,
          comment: 'The minimal aesthetic is exactly what modern e-commerce needs. The functionality seems intuitive.',
          clarity: 5, purpose: 5, aesthetics: 5, average: 5.0
      },
      {
          id: 'r_mock_2',
          name: 'Timi',
          timeAgo: '3s ago',
          timestamp: Date.now() - 3000, 
          comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque enim mauris, hendrerit a ante.',
          clarity: 4, purpose: 2, aesthetics: 3, average: 3.0
      },
      {
          id: 'r_mock_3',
          name: 'Alex Dev',
          timeAgo: '5d ago',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5,
          comment: 'Good effort, but I think the typography could be a bit more bold.',
          clarity: 3, purpose: 4, aesthetics: 2, average: 3.0
      }
  ];

  const allReviews = [...reviews, ...MOCK_REVIEWS_LIST];

  const sortedReviews = [...allReviews].sort((a, b) => {
      const getVal = (r: any) => {
          const avg = r.average ?? ((r.ratings.clarity + r.ratings.purpose + r.ratings.aesthetics) / 3);
          const time = r.timestamp ?? new Date(r.createdAt).getTime();
          return { avg, time };
      };
      const valA = getVal(a);
      const valB = getVal(b);

      if (sortBy === 'Highest Rated') return valB.avg - valA.avg;
      if (sortBy === 'Lowest Rated') return valA.avg - valB.avg;
      if (sortBy === 'Newest') return valB.time - valA.time;
      if (sortBy === 'Oldest') return valA.time - valB.time;
      return 0;
  });

  const handleReviewSubmit = (ratings: any, comment: string, reviewerName: string) => {
    const newReview = {
        id: Math.random().toString(),
        postId: post.id,
        ratings,
        comment,
        reviewerName,
        createdAt: new Date().toISOString()
    };
    setReviews([newReview, ...reviews]);
    setHasReviewed(true);
  };

  // Mock unlock logic
  const totalReviews = post.rating.reviewCount + reviews.length;
  const isLocked = totalReviews < 3;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      
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
            <div className="md:col-span-7 space-y-8">
                
                {/* 1. Image Preview */}
                <div className="relative w-full aspect-video rounded-[32px] overflow-hidden bg-gray-100">
                    <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover" 
                    />
                </div>

                {/* 2. Metadata Row */}
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-3 py-1.5 rounded-full">
                            {post.category}
                        </span>
                        {/* Top Rated Badge (Simulated) */}
                        {post.rating.average >= 4.5 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FEC312] text-[#111111] px-3 py-1.5 rounded-full flex items-center gap-1">
                                🏆 Top Rated
                            </span>
                        )}
                     </div>
                     <span className="text-xs font-medium text-gray-400">
                        {formatTimeAgo(post.createdAt)}
                     </span>
                </div>

                {/* 3. Title */}
                <h1 className="text-4xl font-bold text-[#111111] leading-tight">
                    {post.title}
                </h1>

                {/* 4. Description */}
                <div>
                    <p className={`text-base text-gray-600 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                        {post.description}
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque enim mauris, hendrerit a ante dapibus, sollicitudin lobortis eros. Cras id facilisis nulla. Suspendisse potenti. Fusce quam risus, ultricies quis imperdiet sit.
                    </p>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-bold text-[#111111] mt-2 underline"
                    >
                        {isExpanded ? 'Read less' : 'Read more'}
                    </button>
                </div>

                {/* 5. Author */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.designerId}`} className="w-full h-full object-cover" alt="Avatar" />
                    </div>
                    <span className="text-sm font-bold text-[#111111]">Timi</span>
                </div>

                {/* 6. Rating Summary & Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-8">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 text-[#111111] font-bold text-lg hover:opacity-70 transition-opacity">
                            <img src="/src/assets/icons/share.svg" className="w-5 h-5" alt="Share" />
                            Share
                        </button>
                    </div>

                    {/* RATING DISPLAY */}
                    <div className="flex items-center gap-3">
                         {isLocked ? (
                             <span className="text-sm font-bold text-[#009241]">Rating Unlocks at 3 Reviews</span>
                         ) : (
                             <>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5].map(i => (
                                        <img 
                                            key={i} 
                                            src={i <= Math.floor(post.rating.average) ? "/src/assets/icons/star-active-yellow.svg" : "/src/assets/icons/star-inactive.svg"} 
                                            alt="star"
                                            className="w-6 h-6"
                                        />
                                    ))}
                                </div>
                                <span className="text-3xl font-bold text-[#111111]">{post.rating.average}</span>
                             </>
                         )}
                    </div>
                </div>

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
        <div className="border-t border-gray-100 pt-12">
            
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-[#111111]">Reviews ({totalReviews})</h2>
                
                {/* Sort Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="px-4 py-2 border border-black rounded-lg text-xs font-bold flex items-center gap-2 bg-white hover:bg-gray-50 bg-white"
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
                {sortedReviews.map((review) => {
                    // Normalize data
                    const isUserReview = !!review.createdAt;
                    const ratingAvg = isUserReview 
                        ? (review.ratings.clarity + review.ratings.purpose + review.ratings.aesthetics) / 3 
                        : review.average;
                    const timeLabel = isUserReview ? formatTimeAgo(review.createdAt) : review.timeAgo;
                    const ratings = isUserReview ? review.ratings : { clarity: review.clarity, purpose: review.purpose, aesthetics: review.aesthetics };

                    return (
                        <div key={review.id} className="bg-white border border-gray-200 rounded-[20px] p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="font-bold text-base text-[#111111]">{review.reviewerName || review.name}</span>
                                <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(i => (
                                        <img 
                                            key={i} 
                                            src={i <= Math.floor(ratingAvg) ? "/src/assets/icons/star-active-yellow.svg" : "/src/assets/icons/star-inactive.svg"} 
                                            className="w-3.5 h-3.5" 
                                            alt="" 
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{timeLabel}</span>
                            </div>

                            <p className="text-sm text-[#111111] leading-relaxed mb-6">
                                {review.comment}
                            </p>

                            <div className="flex gap-6">
                                <div className="text-xs font-bold text-[#111111]">Clarity: {ratings.clarity}</div>
                                <div className="text-xs font-bold text-[#111111]">Purpose: {ratings.purpose}</div>
                                <div className="text-xs font-bold text-[#111111]">Aesthetics: {ratings.aesthetics}</div>
                                
                                <div className="ml-auto text-right">
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Rating</div>
                                    <div className="text-xl font-bold text-[#111111]">{ratingAvg.toFixed(1)}/5.0</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>

      </div>
    </div>
  );
}

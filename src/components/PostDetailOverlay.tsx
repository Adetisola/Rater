import { useState } from 'react';
import { Flag, ChevronDown, Check } from 'lucide-react'; // Added icons
import type { Post } from '../logic/mockData';
import { StarRating } from './ui/StarRating';
import { ReviewForm } from './ReviewForm';
import { Button } from './ui/Button';
import { formatTimeAgo } from '../lib/utils';

interface PostDetailOverlayProps {
  post: Post;
  onClose: () => void;
}

export function PostDetailOverlay({ post, onClose }: PostDetailOverlayProps) {
  // Local state to simulate new reviews being added
  const [reviews, setReviews] = useState<any[]>([]); 
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // For description

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
                                            src={i <= Math.round(post.rating.average) ? "/src/assets/icons/star-active.svg" : "/src/assets/icons/star-inactive.svg"} 
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
                     <button className="underline ml-1">Report</button> if you believe attribution is incorrect.
                </div>

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
                <h2 className="text-2xl font-bold text-[#111111]">Review ({totalReviews})</h2>
                
                {/* Mock Sort Dropdown */}
                <div className="relative">
                    <button className="px-4 py-2 border border-black rounded-lg text-xs font-bold flex items-center gap-2">
                        Highest Rated
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* MOCK REVIEW ITEM */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="font-bold text-base text-[#111111]">Timi</span>
                        <div className="flex gap-0.5">
                             {[1,2,3,4,5].map(i => (
                                <img key={i} src="/src/assets/icons/star-active.svg" className="w-3.5 h-3.5" alt="" />
                             ))}
                        </div>
                        <span className="text-xs text-gray-400 font-medium">3s ago</span>
                    </div>

                    <p className="text-sm text-[#111111] leading-relaxed mb-6">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque enim mauris, hendrerit a ante dapibus, sollicitudin lobortis eros. Cras id facilisis nulla. Suspendisse potenti.
                    </p>

                    <div className="flex gap-6">
                        <div className="text-xs font-bold text-[#111111]">Clarity: 4</div>
                        <div className="text-xs font-bold text-[#111111]">Purpose: 2</div>
                        <div className="text-xs font-bold text-[#111111]">Aesthetics: 3</div>
                        
                        <div className="ml-auto text-right">
                             <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Rating</div>
                             <div className="text-xl font-bold text-[#111111]">3.0/5.0</div>
                        </div>
                    </div>
                </div>

                {/* Additional mock reviews would populate here */}
            </div>

        </div>

      </div>
    </div>
  );
}

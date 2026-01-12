import { useState } from 'react';
import { X, Flag } from 'lucide-react';
import type { Post } from '../logic/mockData';
import { StarRating } from './ui/StarRating';
import { ReviewForm } from './ReviewForm';

interface PostDetailOverlayProps {
  post: Post;
  onClose: () => void;
}

export function PostDetailOverlay({ post, onClose }: PostDetailOverlayProps) {
  // Local state to simulate new reviews being added
  const [reviews, setReviews] = useState<any[]>([]); // Using any for V1 speed, ideally Review type
  const [hasReviewed, setHasReviewed] = useState(false);

  const handleReviewSubmit = (ratings: any, comment: string) => {
    const newReview = {
        id: Math.random().toString(),
        postId: post.id,
        ratings,
        comment,
        createdAt: new Date().toISOString()
    };
    setReviews([newReview, ...reviews]);
    setHasReviewed(true);
  };

  // Mock unlock logic
  const totalReviews = post.rating.count + reviews.length;
  const isLocked = totalReviews < 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      
      {/* CLOSE AREA (Click outside) */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col md:flex-row z-10 animate-in zoom-in-95 duration-300">
        
        {/* LEFT: IMAGE (Dark Background) */}
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[40vh] md:min-h-full">
             <img src={post.imageUrl} alt={post.title} className="max-w-full max-h-full object-contain" />
             
             {/* ACTIONS TOP LEFT */}
             <div className="absolute top-6 left-6 flex gap-3">
                 <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                    <img src="/src/assets/icons/share.svg" className="w-5 h-5 invert" alt="Share" /> 
                 </button>
             </div>
        </div>

        {/* RIGHT: CONTENT (Scrollable) */}
        <div className="flex-1 max-w-md w-full bg-white flex flex-col h-full">
            
            {/* HEADER */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-start">
               <div>
                  <h2 className="text-2xl font-bold leading-tight mb-2">{post.title}</h2>
                  <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                         {/* Placeholder Avatar */}
                         <div className="w-full h-full bg-[#FEC312]" /> 
                      </div>
                      <span className="text-sm font-medium text-gray-600">by Designer</span>
                  </div>
               </div>
               
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                   <X className="w-6 h-6 text-gray-400" />
               </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               
               <p className="text-gray-600 mb-8 leading-relaxed">
                   {post.description}
               </p>

               {/* RATINGS SECTION */}
               <div className="mb-10">
                   <div className="flex items-center justify-between mb-4">
                       <h3 className="font-bold text-lg">Ratings</h3>
                       {/* DISCLAIMER TOOLTIP COULD GO HERE */}
                   </div>

                   {/* OVERALL RATING CARD */}
                   <div className="bg-black text-white p-6 rounded-2xl flex items-center justify-between mb-6 shadow-xl">
                       <div>
                           <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Overall Score</div>
                           <div className="text-4xl font-bold flex items-center gap-2">
                               {isLocked ? (
                                   <span className="text-2xl text-gray-500">Locked</span>
                               ) : (
                                   <>
                                     {post.rating.average}
                                     <span className="text-base text-gray-500 font-normal">/ 5.0</span>
                                   </>
                               )}
                           </div>
                       </div>
                       <div className="text-right">
                           <div className="text-sm font-medium text-[#FEC312] mb-1">
                               {totalReviews} Reviews
                           </div>
                           {isLocked && (
                               <div className="text-xs text-gray-500 max-w-[100px] leading-tight">
                                   Unlocks at 3 reviews
                               </div>
                           )}
                       </div>
                   </div>

                   {/* SPECIFIC CRITERIA (Only show if unlocked or simulate locked state visually) */}
                   <div className="space-y-4 opacity-100"> 
                       {['Clarity', 'Purpose', 'Aesthetics'].map(criteria => (
                           <div key={criteria} className="flex justify-between items-center">
                               <span className="text-sm font-medium text-gray-500">{criteria}</span>
                               {isLocked ? (
                                   <div className="h-2 w-16 bg-gray-100 rounded-full animate-pulse" />
                               ) : (
                                   <StarRating rating={4.5} size="sm" /> // Mock breakdown
                               )}
                           </div>
                       ))}
                   </div>
               </div>

               {/* REVIEWS LIST */}
               <div>
                   <h3 className="font-bold text-lg mb-4">Community Reviews</h3>
                   
                   {!hasReviewed ? (
                       <ReviewForm onSubmit={handleReviewSubmit} />
                   ) : (
                       <div className="bg-green-50 p-4 rounded-xl text-green-800 text-sm mb-6 flex gap-2">
                           <img src="/src/assets/icons/status-success.svg" className="w-5 h-5" alt="Check" />
                           Thanks for your review!
                       </div>
                   )}

                   <div className="mt-8 space-y-6">
                       {/* REVIEWS WOULD MAP HERE */}
                       <div className="border-b border-gray-50 pb-6">
                           <div className="flex justify-between mb-2">
                               <span className="font-bold text-sm">Anonymous Designer</span>
                               <span className="text-xs text-gray-400">2h ago</span>
                           </div>
                           <p className="text-sm text-gray-600 mb-2">Great use of negative space. I think the typography could be a bit cleaner.</p>
                           <div className="flex gap-4">
                               <div className="text-xs text-gray-400">Clarity: 4</div>
                               <div className="text-xs text-gray-400">Purpose: 5</div>
                           </div>
                       </div>
                   </div>
               </div>

            </div>
            
            {/* FOOTER */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-center text-gray-400">
                attribution is claimed by the submitter and not independently verified.
                <button className="ml-2 underline hover:text-gray-600 flex items-center justify-center gap-1 inline-flex">
                    <Flag className="w-3 h-3" /> Report
                </button>
            </div>

        </div>

      </div>
    </div>
  );
}

import type { Post } from '../logic/mockData';

export function PostCard({ post }: { post: Post }) {
  // Mock badges logic based on ID for visual replication
  const isMostDiscussed = post.id === 'post_2'; // Purple badge
  const isTopRated = post.id === 'post_3'; // Yellow/Orange badge

  return (
    <div className="group relative break-inside-avoid mb-6">
      {/* CARD CONTAINER */}
      <div className="bg-[#ebebeb] p-1.5 rounded-[24px] relative overflow-hidden transition-all duration-300">
        
        {/* HOVER BACKGROUND - Blurred Image */}
        <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center blur-xl scale-125 brightness-[0.6]"
              style={{ backgroundImage: `url(${post.imageUrl})` }}
            />
        </div>

        {/* CONTENT WRAPPER */}
        <div className="relative z-10">
            {/* IMAGE AREA (Inset) */}
            <div className={`relative w-full overflow-hidden rounded-[20px] ${isTopRated ? 'border-2 border-[#FEC312]' : isMostDiscussed ? 'border-2 border-[#7C3BED]' : ''}`}>
            <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 block"
            />
            
            {/* BADGES */}
            {/* 'Most Discussed' Badge - Purple Pill */}
            {isMostDiscussed && (
                <div className="absolute bottom-3 left-3 bg-[#6A3EEA] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                    <span>💬 Most Discussed</span>
                </div>
            )}
            
            {/* 'Top Rated' Badge - Yellow Pill */}
            {isTopRated && (
                <div className="absolute bottom-3 left-3 bg-[#FFB800] text-[#111111] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                    <span>🏆 Top Rated</span>
                </div>
            )}
            </div>

            {/* CONTENT AREA */}
            <div className="px-4 pt-4 pb-2">
            
            {/* ROW 1: TAG & TIME */}
            <div className="flex justify-between items-center mb-3">
                <span className="bg-white text-[#111111] text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                    {post.category}
                </span>
                <span className="text-[10px] text-[#999999] font-medium group-hover:text-white/80 transition-colors">
                    6d ago
                </span>
            </div>

            {/* ROW 2: TITLE */}
            <h3 className="font-bold text-lg text-[#111111] mb-2 leading-tight group-hover:text-white transition-colors">
                {post.title}
            </h3>

            {/* ROW 3: DESCRIPTION */}
            <p className="text-xs text-[#111111] leading-relaxed mb-4 line-clamp-3 group-hover:text-white/90 transition-colors">
                On the other hand criteria of the point of the task analysis can partly be used for the impact steady practice.
            </p>

            {/* ROW 4: AUTHOR */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.designerId}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-[#111111] group-hover:text-white transition-colors">Timi</span>
            </div>

            {/* ROW 5: FOOTER (STATS) */}
            <div className="pt-4 border-t border-black/5 group-hover:border-white/20 flex items-center justify-between transition-colors">
                
                {/* LEFT: Count */}
                <div className="flex items-center gap-1.5">
                    <img src="/src/assets/icons/review-count.svg" alt="reviews" className="w-3.5 h-3.5 group-hover:brightness-0 group-hover:invert transition-all" />
                    <span className="text-xs font-semibold text-[#111111] group-hover:text-white transition-colors">{post.stats.views}</span>
                </div>

                {/* RIGHT: Ratings */}
                <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5 group-hover:brightness-0 group-hover:invert transition-all">
                        {[1,2,3,4,5].map(i => (
                            <img 
                            key={i} 
                            src={i <= Math.round(post.rating.average) ? "/src/assets/icons/star-active.svg" : "/src/assets/icons/star-inactive.svg"} 
                            className="w-3 h-3" 
                            alt="" 
                            />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-[#111111] group-hover:text-white transition-colors">{post.rating.average}/5.0</span>
                </div>

            </div>
            </div>
        </div>
      </div>
    </div>
  );
}

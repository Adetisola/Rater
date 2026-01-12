import { cn } from '../../lib/utils';

interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

export function StarRating({ 
  rating, 
  maxStars = 5, 
  interactive = false, 
  onChange, 
  size = 'md',
  showCount = false,
  count = 0
}: StarRatingProps) {
  
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-1">
        {stars.map((star) => {
          const isFilled = star <= rating;
          const isInteractive = interactive && !!onChange;
          
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => isInteractive && onChange(star)}
              className={cn(
                "transition-transform rounded-full",
                isInteractive ? "hover:scale-110 cursor-pointer" : "cursor-default",
              )}
            >
               {/* Using SVG assets as strictly requested */}
               <img 
                 src={isFilled ? "/src/assets/icons/star-filled.svg" : "/src/assets/icons/star-outline.svg"} 
                 alt={isFilled ? "Filled Star" : "Empty Star"} 
                 className={cn(sizeClasses[size], "transition-all")}
               />
            </button>
          );
        })}
      </div>
      
      {showCount && count > 0 && (
         <span className="text-xs text-gray-500 font-medium ml-1">({count})</span>
      )}
    </div>
  );
}

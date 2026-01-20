import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { FilterDropdown } from './FilterDropdown';

interface HeaderProps {
    onPostClick: () => void;
    onLogoClick: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    selectedCategories: string[];
    onCategoryChange: (categories: string[]) => void;
    hideControls?: boolean;
}

export function Header({ 
    onPostClick, 
    onLogoClick, 
    searchQuery, 
    onSearchChange,
    sortBy,
    onSortChange,
    selectedCategories,
    onCategoryChange,
    hideControls = false
}: HeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showWidgets, setShowWidgets] = useState(!hideControls);
  const [opacityTrigger, setOpacityTrigger] = useState(!hideControls);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    if (hideControls) {
      setOpacityTrigger(false);
      setShowWidgets(false);
    } else {
      t1 = setTimeout(() => {
        setShowWidgets(true);
        // Trigger fade in after mount
        t2 = setTimeout(() => setOpacityTrigger(true), 50);
      }, 700);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [hideControls]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl py-4 border-b border-white/20 rounded-bl-[30px] rounded-br-[30px]">
      <div className={`relative max-w-[1600px] mx-auto px-6 flex items-center gap-6 min-h-[48px] ${hideControls ? 'justify-center' : 'justify-between'}`}>
        
        {/* ANIMATED LOGO (Absolute) */}
        <div className={`absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${hideControls ? 'left-1/2 -translate-x-1/2' : 'left-6 translate-x-0'}`}>
          <div 
            onClick={onLogoClick}
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer group relative"
          >
            <img 
              src="/src/assets/icons/logo-rater.svg" 
              alt="Rater Logo" 
              className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-0" 
            />
            <img 
              src="/src/assets/icons/logo-rater-hover.svg" 
              alt="Rater Logo Hover" 
              className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100" 
            />
          </div>
        </div>

        {/* GHOST LOGO SPLACER (Preserves layout in Home mode) */}
        {!hideControls && <div className="w-12 h-12 shrink-0 invisible" aria-hidden="true" />}

        {/* SEARCH BAR */}
        {showWidgets && (
        <div className={`flex-1 max-w-3xl relative z-50 transition-opacity duration-500 ${opacityTrigger ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative w-full group">
            
            {/* Original Search Input - Hidden when Filter is Open to prevent duplication */}
            <div className={`relative w-full transition-opacity duration-200 ${isFilterOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <img src="/src/assets/icons/search.svg" alt="Search" className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 opacity-40 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search by title, designer, or category..." 
                  className="w-full h-12 pl-14 pr-16 rounded-full border-2 border-[#FEC312] focus:outline-none focus:ring-4 focus:ring-[#FEC312]/10 transition-all font-sans text-base placeholder:text-gray-400"
                />
                
                {/* Filter Trigger Button */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-gray-100"
                    >
                        <img src="/src/assets/icons/filter.svg" alt="Filter" className="h-5 w-5 opacity-70" />
                    </button>
                </div>
            </div>

            {/* Expanded Search + Filter Panel Overlay */}
            <FilterDropdown 
                 isOpen={isFilterOpen}
                 onClose={() => setIsFilterOpen(false)}
                 searchQuery={searchQuery}
                 onSearchChange={onSearchChange}
                 sortBy={sortBy}
                 onSortChange={onSortChange}
                 selectedCategories={selectedCategories}
                 onCategoryChange={onCategoryChange}
                 className="top-0 left-0 w-full shadow-2xl"
            />
          </div>
        </div>
        )}

        {/* ACTIONS */}
        {showWidgets && (
        <div className={`flex items-center transition-opacity duration-500 ${opacityTrigger ? 'opacity-100' : 'opacity-0'}`}>
            <Button
                variant="outline" 
                onClick={onPostClick}
                className="h-12 rounded-full bg-transparent px-5 text-xl font-medium gap-2 group"
            >
                <img src="/src/assets/icons/upload.svg" alt="Upload" className="h-5 w-5 transition-all duration-300 group-hover:brightness-0 group-hover:invert" />
                Post
            </Button>
        </div>
        )}
      </div>
    </header>
  );
}

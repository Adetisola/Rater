import { useState } from 'react';
import { Button } from './ui/Button';
import { FilterDropdown } from './FilterDropdown';

interface HeaderProps {
    onPostClick: () => void;
    onLogoClick: () => void;
}

export function Header({ onPostClick, onLogoClick }: HeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-lg py-4 border-b border-white/20">
      <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between gap-6">
        
        {/* LOGO */}
        <div className="flex-shrink-0">
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

        {/* SEARCH BAR */}
        <div className="flex-1 max-w-3xl relative z-50">
          <div className="relative w-full group">
            
            {/* Original Search Input - Hidden when Filter is Open to prevent duplication */}
            <div className={`relative w-full transition-opacity duration-200 ${isFilterOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <img src="/src/assets/icons/search.svg" alt="Search" className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 opacity-40 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                 onApply={(filters) => {
                   console.log('Filters applied:', filters);
                   setIsFilterOpen(false);
                 }}
                 onClose={() => setIsFilterOpen(false)}
                 searchQuery={searchQuery}
                 onSearchChange={setSearchQuery}
                 className="top-0 left-0 w-full shadow-2xl"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center">
            <Button 
                variant="outline" 
                onClick={onPostClick}
                className="h-12 rounded-full px-8 text-base font-semibold gap-2 group"
            >
                <img src="/src/assets/icons/upload.svg" alt="Upload" className="h-5 w-5 transition-all group-hover:brightness-0 group-hover:invert" />
                Post
            </Button>
        </div>
      </div>
    </header>
  );
}

import type { Post } from '../logic/mockData';
import type { SearchResult, HighlightSegment } from '../logic/searchUtils';
import { highlightMatches } from '../logic/searchUtils';
import { createPortal } from 'react-dom';

interface SearchResultsProps {
  results: SearchResult[];
  isVisible: boolean;
  onResultClick: (post: Post) => void;
  onClose: () => void;  // Close with blur (for header clicks)
  onSoftClose?: () => void;  // Close without blur (for outside clicks)
}

export function SearchResults({ 
  results, 
  isVisible, 
  onResultClick,
  onClose,
  onSoftClose
}: SearchResultsProps) {
  if (!isVisible || results.length === 0) {
    return null;
  }

  return (
    <>
      {/* Backdrop for page-wide clicks - soft close (keeps focus) */}
      {createPortal(
        <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onMouseDown={(e) => {
            e.preventDefault(); // Prevents input from losing focus
            (onSoftClose || onClose)();
            }}
        />,
        document.body
      )}
      
      {/* Header-area backdrop - close with blur */}
      <div 
        className="absolute inset-x-0 -top-20 h-32 z-41" 
        onClick={onClose}
      />
      
      {/* Results Dropdown */}
      <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="p-2">
          {results.map((result, index) => (
            <SearchResultItem 
              key={result.item.id}
              result={result}
              onClick={() => onResultClick(result.item)}
              isFirst={index === 0}
            />
          ))}
        </div>
        
        {/* Footer hint */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>
    </>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  onClick: () => void;
  isFirst: boolean;
}

function SearchResultItem({ result, onClick, isFirst }: SearchResultItemProps) {
  const { item, matches } = result;
  
  // Get highlighted segments for each field
  const titleSegments = highlightMatches(item.title, matches, 'title');
  const descriptionSegments = highlightMatches(item.description, matches, 'description');
  const categorySegments = highlightMatches(item.category, matches, 'category');

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex gap-4 items-start group ${isFirst ? 'bg-gray-50/50' : ''}`}
    >
      {/* Thumbnail */}
      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
        <img 
          src={item.imageUrl} 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title with highlights */}
        <h4 className="font-bold text-sm text-[#111111] truncate group-hover:text-[#FEC312] transition-colors">
          <HighlightedText segments={titleSegments} />
        </h4>
        
        {/* Description preview with highlights */}
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
          <HighlightedText segments={descriptionSegments} />
        </p>
        
        {/* Category badge with highlights */}
        <span className="inline-block mt-1.5 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600 uppercase tracking-wide">
          <HighlightedText segments={categorySegments} />
        </span>
      </div>
    </button>
  );
}

interface HighlightedTextProps {
  segments: HighlightSegment[];
}

function HighlightedText({ segments }: HighlightedTextProps) {
  return (
    <>
      {segments.map((segment, index) => (
        segment.isMatch ? (
          <mark 
            key={index} 
            className="bg-[#FEC312]/30 text-inherit rounded-sm px-0.5"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      ))}
    </>
  );
}

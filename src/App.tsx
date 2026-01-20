import { useState } from 'react';
import { Header } from './components/Header';
import { MasonryGrid } from './components/MasonryGrid';
import { SubmitPage } from './components/SubmitPage';
import { PostDetailOverlay } from './components/PostDetailOverlay';
import { MOCK_POSTS, MOCK_AVATARS, type Post } from './logic/mockData';
import { curatedFreshnessSort } from './logic/curatedSort';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'submit'>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('✨Curated Freshness✨');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDelayed, setIsDelayed] = useState(false);

  const handleHomeClick = () => {
    if (currentPage === 'submit') {
        setIsDelayed(true);
        setCurrentPage('home');
        // Wait for logo animation (700ms) + fade in (500ms partial)
        setTimeout(() => setIsDelayed(false), 800);
    } else {
        setCurrentPage('home');
    }
  };

  // Filter & Sort posts
  const filteredPosts = MOCK_POSTS.filter(post => {
    // 1. Search Filter
    const query = searchQuery.toLowerCase();
    const designer = MOCK_AVATARS[post.designerId];
    const designerName = designer ? designer.name.toLowerCase() : '';
    const matchesSearch = 
      post.title.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      designerName.includes(query);

    // 2. Category Filter
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(post.category);

    // 3. Locked Rating Filter (Hide locked posts for Rating sorts)
    const matchesRatingSort = 
      (sortBy === 'Highest Rated' || sortBy === 'Lowest Rated') 
        ? !post.rating.isLocked 
        : true;

    return matchesSearch && matchesCategory && matchesRatingSort;
  }).sort((a, b) => { // 4. Sorting Logic
    switch (sortBy) {
      case '✨Curated Freshness✨':
        // Handled separately after filter
        return 0;
      case 'Highest Rated':
        return b.rating.average - a.rating.average;
      case 'Lowest Rated':
        return a.rating.average - b.rating.average;
      case 'Newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'Oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'Most Reviewed':
        return b.rating.reviewCount - a.rating.reviewCount;
      default:
        return 0;
    }
  });

  // Apply Curated Freshness sort if selected (needs full post list for bucket logic)
  const sortedPosts = sortBy === '✨Curated Freshness✨' 
    ? curatedFreshnessSort(filteredPosts)
    : filteredPosts;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#111111]">
      <Header 
        onPostClick={() => setCurrentPage('submit')} 
        onLogoClick={handleHomeClick} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        hideControls={currentPage === 'submit'}
        posts={MOCK_POSTS}
        onPostSelect={(post) => setSelectedPost(post)}
      />
      
      <main className="flex-1 w-full pt-8">
        {currentPage === 'home' && !isDelayed ? (
           <MasonryGrid 
              posts={sortedPosts} 
              onPostClick={(post) => setSelectedPost(post)}
           />
        ) : (
           <SubmitPage />
        )}
      </main>

      {/* OVERLAYS */}
      {selectedPost && (
          <PostDetailOverlay 
             post={selectedPost} 
             onClose={() => setSelectedPost(null)}
          />
      )}
    </div>
  )
}

export default App

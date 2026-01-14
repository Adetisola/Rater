import { useState } from 'react';
import { Header } from './components/Header';
import { MasonryGrid } from './components/MasonryGrid';
import { SubmitPage } from './components/SubmitPage';
import { PostDetailOverlay } from './components/PostDetailOverlay';
import { MOCK_POSTS, MOCK_AVATARS, type Post } from './logic/mockData';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'submit'>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter posts based on search query
  const filteredPosts = MOCK_POSTS.filter(post => {
    const query = searchQuery.toLowerCase();
    const designer = MOCK_AVATARS[post.designerId];
    const designerName = designer ? designer.name.toLowerCase() : '';
    
    return (
      post.title.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      designerName.includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#111111]">
      <Header 
        onPostClick={() => setCurrentPage('submit')} 
        onLogoClick={() => setCurrentPage('home')} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="flex-1 w-full pt-8">
        {currentPage === 'home' ? (
           <MasonryGrid 
              posts={filteredPosts} 
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

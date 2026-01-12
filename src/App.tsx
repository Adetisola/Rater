import { useState } from 'react';
import { Header } from './components/Header';
import { MasonryGrid } from './components/MasonryGrid';
import { SubmitPage } from './components/SubmitPage';
import { PostDetailOverlay } from './components/PostDetailOverlay';
import { MOCK_POSTS, type Post } from './logic/mockData';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'submit'>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#111111]">
      <Header onPostClick={() => setCurrentPage('submit')} onLogoClick={() => setCurrentPage('home')} />
      
      <main className="flex-1 w-full pt-8">
        {currentPage === 'home' ? (
           <MasonryGrid 
              posts={MOCK_POSTS} 
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

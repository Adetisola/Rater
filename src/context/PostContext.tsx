"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Post } from '@/types';
// TODO(backend): Replace MOCK_POSTS and updatePost with Supabase queries.
// All localStorage persistence below (rater_post_overrides, rater_deleted_posts,
// rater_session_posts) should be replaced with real database operations.
import { MOCK_POSTS, updatePost as dbUpdatePost } from '../logic/mockData';

interface PostContextType {
  posts: Post[];
  allPosts: Post[];
  editingPost: Post | null;
  setEditingPost: (post: Post | null) => void;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  undoDelete: (postId: string) => Promise<boolean>;
  hardDeletePost: (postId: string) => Promise<boolean>;
  addPost: (post: Post) => void;
  isLoading: boolean;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedOverrides = localStorage.getItem('rater_post_overrides');
    const deletedPosts = localStorage.getItem('rater_deleted_posts');
    const sessionPosts = localStorage.getItem('rater_session_posts');
    
    let currentPosts = [...MOCK_POSTS];
    
    // 1. Deletions are handled below via is_deleted flag (step 4)
    // Posts remain in allPosts so visiblePosts can filter them,
    // and undo can restore them even after refresh.
    
    // 2. Handle Overrides (Edits)
    if (savedOverrides) {
      const overrides = JSON.parse(savedOverrides);
      currentPosts = currentPosts.map(p => overrides[p.id] ? { ...p, ...overrides[p.id] } : p);
    }

    // 3. Handle Session Posts (New ones)
    if (sessionPosts) {
      const newPosts = JSON.parse(sessionPosts);
      currentPosts = [...newPosts, ...currentPosts];
    }

    // 4. Apply is_deleted flag to soft-deleted posts
    const deletedIds = deletedPosts ? JSON.parse(deletedPosts) : [];
    currentPosts = currentPosts.map(p => deletedIds.includes(p.id) ? { ...p, is_deleted: true, deleted_at: new Date().toISOString() } : p);
    
    setAllPosts(currentPosts);
    setIsLoading(false);
  }, []);

  const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
    try {
      const updated_at = new Date().toISOString();
      const finalUpdates = { ...updates, updated_at };
      
      // Simulate API call
      await dbUpdatePost(postId, finalUpdates);
      
      // Optimistic update
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, ...finalUpdates } : p));
      
      // Persist to localStorage
      const savedOverrides = JSON.parse(localStorage.getItem('rater_post_overrides') || '{}');
      savedOverrides[postId] = { ...(savedOverrides[postId] || {}), ...finalUpdates };
      localStorage.setItem('rater_post_overrides', JSON.stringify(savedOverrides));

      // Also update session posts if it's there
      const sessionPosts = JSON.parse(localStorage.getItem('rater_session_posts') || '[]');
      const sessionIndex = sessionPosts.findIndex((p: Post) => p.id === postId);
      if (sessionIndex !== -1) {
        sessionPosts[sessionIndex] = { ...sessionPosts[sessionIndex], ...finalUpdates };
        localStorage.setItem('rater_session_posts', JSON.stringify(sessionPosts));
      }
      
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      const deleted_at = new Date().toISOString();
      const updates = { is_deleted: true, deleted_at };
      
      // Simulate API call (Soft Delete)
      await dbUpdatePost(postId, updates);
      
      // Optimistic update
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
      
      // Persist to localStorage (Deleted list)
      const deletedPosts = JSON.parse(localStorage.getItem('rater_deleted_posts') || '[]');
      if (!deletedPosts.includes(postId)) {
        deletedPosts.push(postId);
        localStorage.setItem('rater_deleted_posts', JSON.stringify(deletedPosts));
      }
      
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const undoDelete = useCallback(async (postId: string) => {
    try {
      const updates = { is_deleted: false, deleted_at: undefined };
      
      // Simulate API call
      await dbUpdatePost(postId, updates);
      
      // Optimistic update
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
      
      // Remove from localStorage (Deleted list)
      let deletedPosts = JSON.parse(localStorage.getItem('rater_deleted_posts') || '[]');
      deletedPosts = deletedPosts.filter((id: string) => id !== postId);
      localStorage.setItem('rater_deleted_posts', JSON.stringify(deletedPosts));
      
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  // Hard delete is reserved for future backend cleanup (not triggered in UI)
  const hardDeletePost = useCallback(async (postId: string) => {
    try {
      const { hardDeletePost: dbHardDeletePost } = await import('../logic/mockData');
      
      // Simulate API call
      await dbHardDeletePost(postId);
      
      // Permanent removal from state
      setAllPosts(prev => prev.filter(p => p.id !== postId));
      
      // Remove from all localStorage locations
      const deletedPosts = JSON.parse(localStorage.getItem('rater_deleted_posts') || '[]');
      localStorage.setItem('rater_deleted_posts', JSON.stringify(deletedPosts.filter((id: string) => id !== postId)));
      
      const savedOverrides = JSON.parse(localStorage.getItem('rater_post_overrides') || '{}');
      if (savedOverrides[postId]) {
        delete savedOverrides[postId];
        localStorage.setItem('rater_post_overrides', JSON.stringify(savedOverrides));
      }

      let sessionPosts = JSON.parse(localStorage.getItem('rater_session_posts') || '[]');
      sessionPosts = sessionPosts.filter((p: Post) => p.id !== postId);
      localStorage.setItem('rater_session_posts', JSON.stringify(sessionPosts));
      
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const addPost = useCallback((post: Post) => {
    setAllPosts(prev => [post, ...prev]);
    
    // Persist to session posts
    const sessionPosts = JSON.parse(localStorage.getItem('rater_session_posts') || '[]');
    localStorage.setItem('rater_session_posts', JSON.stringify([post, ...sessionPosts]));
  }, []);

  const visiblePosts = useMemo(() => allPosts.filter(p => !p.is_deleted), [allPosts]);

  const contextValue = useMemo(() => ({
    posts: visiblePosts,
    allPosts, // For internal use like Undo
    editingPost,
    setEditingPost,
    updatePost,
    deletePost,
    undoDelete,
    hardDeletePost,
    addPost,
    isLoading
  }), [visiblePosts, allPosts, editingPost, updatePost, deletePost, undoDelete, hardDeletePost, addPost, isLoading]);

  return (
    <PostContext.Provider value={contextValue}>
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Post } from '@/types';
import {
  getFeedPosts,
  createPost as dbCreatePost,
  updatePost as dbUpdatePost,
  softDeletePost as dbSoftDeletePost,
  hardDeletePost as dbHardDeletePost,
} from '@/lib/posts';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase/client';

interface PostContextType {
  posts: Post[];
  allPosts: Post[]; // Exposed for backwards compatibility in components expecting allPosts
  editingPost: Post | null;
  setEditingPost: (post: Post | null) => void;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<boolean>;
  optimisticUpdateMetrics: (postId: string, metrics: Partial<Post>) => void;
  deletePost: (postId: string) => Promise<boolean>;
  undoDelete: (postId: string) => Promise<boolean>;
  hardDeletePost: (postId: string) => Promise<boolean>;
  addPost: (post: Omit<Post, 'id' | 'created_at'>) => Promise<boolean>;
  isLoading: boolean;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { currentProfile } = useAuth();

  // Load posts from the data layer on mount
  useEffect(() => {
    let mounted = true;
    
    getFeedPosts().then(feedPosts => {
      if (mounted) {
        setAllPosts(feedPosts);
        setIsLoading(false);
      }
    });
    
    return () => { mounted = false; };
  }, []);

  // Supabase Realtime synchronization for post metrics
  useEffect(() => {
    const channel = supabase.channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          const newPostData = payload.new as Post;
          setAllPosts(prev => prev.map(p => {
            if (p.id === newPostData.id) {
              // Reconcile and overwrite specifically metrics fields to correct any optimistic drift
              return {
                ...p,
                review_count: newPostData.review_count,
                average_score: newPostData.average_score,
                criteria_scores: newPostData.criteria_scores,
                updated_at: newPostData.updated_at
              };
            }
            return p;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
    if (!currentProfile) return false;
    
    const updated_at = new Date().toISOString();
    const finalUpdates = { ...updates, updated_at };

    // 1. Snapshot previous state of the targeted post
    const previousPost = allPosts.find(p => p.id === postId);
    if (!previousPost) return false;

    // 2. Optimistic update
    setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, ...finalUpdates } : p));

    try {
      const result = await dbUpdatePost(postId, finalUpdates, currentProfile.id);
      if (!result.ok) throw new Error(result.error);
      return true;
    } catch (err) {
      console.error('Optimistic update failed, rolling back:', err);
      // 3. Precise rollback
      setAllPosts(prev => prev.map(p => p.id === postId ? previousPost : p));
      return false;
    }
  }, [currentProfile, allPosts]);

  const optimisticUpdateMetrics = useCallback((postId: string, metrics: Partial<Post>) => {
    setAllPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, ...metrics } : p
    ));
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    if (!currentProfile) return false;

    const previousPost = allPosts.find(p => p.id === postId);
    if (!previousPost) return false;

    // Optimistic update
    setAllPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, is_deleted: true, deleted_at: new Date().toISOString() } : p
    ));

    try {
      const result = await dbSoftDeletePost(postId, currentProfile.id);
      if (!result.ok) throw new Error(result.error);
      return true;
    } catch (err) {
      console.error('Optimistic delete failed, rolling back:', err);
      setAllPosts(prev => prev.map(p => p.id === postId ? previousPost : p));
      return false;
    }
  }, [currentProfile, allPosts]);

  const undoDelete = useCallback(async (postId: string) => {
    if (!currentProfile) return false;

    const previousPost = allPosts.find(p => p.id === postId);
    if (!previousPost) return false;

    // Optimistic update
    setAllPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, is_deleted: false, deleted_at: undefined } : p
    ));

    try {
      const result = await dbUpdatePost(postId, { is_deleted: false, deleted_at: undefined }, currentProfile.id);
      if (!result.ok) throw new Error(result.error);
      return true;
    } catch (err) {
      console.error('Optimistic undo failed, rolling back:', err);
      setAllPosts(prev => prev.map(p => p.id === postId ? previousPost : p));
      return false;
    }
  }, [currentProfile, allPosts]);

  const hardDeletePost = useCallback(async (postId: string) => {
    if (!currentProfile) return false;

    const previousPost = allPosts.find(p => p.id === postId);
    if (!previousPost) return false;

    // Optimistic update
    setAllPosts(prev => prev.filter(p => p.id !== postId));

    try {
      const result = await dbHardDeletePost(postId, currentProfile.id);
      if (!result.ok) throw new Error(result.error);
      return true;
    } catch (err) {
      console.error('Optimistic hard delete failed, rolling back:', err);
      setAllPosts(prev => [previousPost, ...prev]);
      return false;
    }
  }, [currentProfile, allPosts]);

  const addPost = useCallback(async (postPayload: Omit<Post, 'id' | 'created_at'>) => {
    // Generate a temporary ID for the optimistic UI
    const tempId = `temp_${Date.now()}`;
    const optimisticPost: Post = {
      ...postPayload,
      id: tempId,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setAllPosts(prev => [optimisticPost, ...prev]);

    try {
      const newPost = await dbCreatePost(postPayload);
      // Replace optimistic post with real server post
      setAllPosts(prev => prev.map(p => p.id === tempId ? newPost : p));
      return true;
    } catch (err) {
      console.error('Optimistic create failed, rolling back:', err);
      // Rollback newly inserted optimistic post
      setAllPosts(prev => prev.filter(p => p.id !== tempId));
      return false;
    }
  }, []);

  // posts is filtered for deleted ones to be safe
  const activePosts = useMemo(() => allPosts.filter(p => !p.is_deleted), [allPosts]);

  return (
    <PostContext.Provider value={{ 
      posts: activePosts, 
      allPosts, 
      editingPost, 
      setEditingPost, 
      updatePost,
      optimisticUpdateMetrics,
      deletePost, 
      undoDelete, 
      hardDeletePost,
      addPost,
      isLoading
    }}>
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

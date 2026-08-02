"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Post } from '@/types';
import {
  createPost as dbCreatePost,
  updatePost as dbUpdatePost,
  softDeletePost as dbSoftDeletePost,
  hardDeletePost as dbHardDeletePost,
} from '@/lib/posts';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getActiveBadges } from '@/lib/badges';
import { computeHotPosts } from '@/logic/hotPostUtils';
import { usePostStore } from '../store/postStore';

interface PostContextType {
  editingPost: Post | null;
  setEditingPost: (post: Post | null) => void;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<boolean>;
  optimisticUpdateMetrics: (postId: string, metrics: Partial<Post>) => void;
  deletePost: (postId: string) => Promise<boolean>;
  undoDelete: (postId: string) => Promise<boolean>;
  hardDeletePost: (postId: string) => Promise<boolean>;
  addPost: (post: Omit<Post, 'id' | 'created_at'>) => Promise<boolean>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const { currentProfile } = useAuth();

  // Supabase Realtime synchronization for post metrics
  useEffect(() => {
    const channel = supabase.channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          const newPostData = payload.new as Post;
          usePostStore.getState().updatePostMetrics(newPostData.id, {
            review_count: newPostData.review_count,
            average_score: newPostData.average_score,
            criteria_scores: newPostData.criteria_scores,
            updated_at: newPostData.updated_at
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
    if (!currentProfile) return false;
    
    // 1. Snapshot previous state of the targeted post
    const previousPost = usePostStore.getState().posts[postId];
    if (!previousPost) return false;

    // 2. Optimistic update
    usePostStore.getState().updatePost(postId, updates);

    try {
      const result = await dbUpdatePost(postId, updates, currentProfile.id);
      if (!result.ok) throw new Error(result.error);
      
      const serverPost = { ...result.post };
      
      // Safeguard: If PostgREST schema cache is stale, it might drop new columns during UPDATE
      // and return the old values. We preserve our optimistic AI fields if they were modified.
      const aiFieldsMismatched = (
        (updates.uses_ai !== undefined && serverPost.uses_ai !== updates.uses_ai) ||
        (updates.ai_tool !== undefined && serverPost.ai_tool !== updates.ai_tool) ||
        (updates.ai_prompt !== undefined && serverPost.ai_prompt !== updates.ai_prompt)
      );
      
      if (aiFieldsMismatched) {
        console.warn("PostgREST schema cache may be stale. Preserving optimistic AI fields.");
        if (updates.uses_ai !== undefined) serverPost.uses_ai = updates.uses_ai;
        if (updates.ai_tool !== undefined) serverPost.ai_tool = updates.ai_tool;
        if (updates.ai_prompt !== undefined) serverPost.ai_prompt = updates.ai_prompt;
      }

      // Update with the definitive server state to pick up database triggers (e.g. edited_at)
      usePostStore.getState().updatePost(postId, serverPost);
      
      return true;
    } catch (err: any) {
      console.error('Optimistic update failed, rolling back:', err);
      // 3. Precise rollback
      usePostStore.getState().updatePost(postId, previousPost);
      
      const { normalizeError } = await import('@/lib/errors/normalizeError');
      throw normalizeError(err, { fallbackCode: 'RATER_POST_UPDATE_001', fallbackMessage: 'Failed to update post.' });
    }
  }, [currentProfile]);

  const optimisticUpdateMetrics = useCallback((postId: string, metrics: Partial<Post>) => {
    usePostStore.getState().updatePostMetrics(postId, metrics);
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    if (!currentProfile) return false;

    const previousPost = usePostStore.getState().posts[postId];
    if (!previousPost) return false;

    // Optimistic update
    usePostStore.getState().updatePost(postId, { is_deleted: true, deleted_at: new Date().toISOString() });

    try {
      const result = await dbSoftDeletePost(postId, currentProfile.id);
      if (!result.ok) throw new Error(result.error);
      return true;
    } catch (err: any) {
      console.error('Optimistic delete failed, rolling back:', err);
      usePostStore.getState().updatePost(postId, previousPost);
      
      const { normalizeError } = await import('@/lib/errors/normalizeError');
      throw normalizeError(err, { fallbackCode: 'RATER_POST_DELETE_001', fallbackMessage: 'Failed to delete post.' });
    }
  }, [currentProfile]);

  const undoDelete = useCallback(async (postId: string) => {
    if (!currentProfile) return false;

    const previousPost = usePostStore.getState().posts[postId];
    if (!previousPost) return false;

    // Optimistic update
    usePostStore.getState().updatePost(postId, { is_deleted: false, deleted_at: undefined });

    try {
      const result = await dbUpdatePost(postId, { is_deleted: false, deleted_at: undefined }, currentProfile.id);
      if (!result.ok) throw new Error(result.error);
      return true;
    } catch (err: any) {
      console.error('Optimistic undo failed, rolling back:', err);
      usePostStore.getState().updatePost(postId, previousPost);
      
      const { normalizeError } = await import('@/lib/errors/normalizeError');
      throw normalizeError(err, { fallbackCode: 'RATER_POST_RESTORE_001', fallbackMessage: 'Failed to restore post.' });
    }
  }, [currentProfile]);

  const hardDeletePost = useCallback(async (postId: string) => {
    if (!currentProfile) return false;

    const previousPost = usePostStore.getState().posts[postId];
    if (!previousPost) return false;

    // Optimistic update
    usePostStore.getState().deletePost(postId);

    try {
      const result = await dbHardDeletePost(postId, currentProfile.id);
      if (!result.ok) throw new Error(result.error);
      return true;
    } catch (err: any) {
      console.error('Optimistic hard delete failed, rolling back:', err);
      usePostStore.getState().addOrUpdatePosts([previousPost]);
      
      const { normalizeError } = await import('@/lib/errors/normalizeError');
      throw normalizeError(err, { fallbackCode: 'RATER_POST_HDELETE_001', fallbackMessage: 'Failed to permanently delete post.' });
    }
  }, [currentProfile]);

  const addPost = useCallback(async (postPayload: Omit<Post, 'id' | 'created_at'>) => {
    // Generate a temporary ID for the optimistic UI
    const tempId = `temp_${Date.now()}`;
    const optimisticPost: Post = {
      ...postPayload,
      id: tempId,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    usePostStore.getState().addOrUpdatePosts([optimisticPost]);

    try {
      const newPost = await dbCreatePost(postPayload);
      // Replace optimistic post with real server post
      usePostStore.getState().deletePost(tempId);
      usePostStore.getState().addOrUpdatePosts([newPost]);
      usePostStore.getState().setNewlyUploadedPostId(newPost.id);
      return true;
    } catch (err: any) {
      console.error('Optimistic create failed, rolling back:', err);
      // Rollback newly inserted optimistic post
      usePostStore.getState().deletePost(tempId);
      
      const { normalizeError } = await import('@/lib/errors/normalizeError');
      throw normalizeError(err, { fallbackCode: 'RATER_POST_CREATE_001', fallbackMessage: 'Failed to create post.' });
    }
  }, []);

  // Compute badges outside the render cycle
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const unsub = usePostStore.subscribe((state, prevState) => {
      // Very naive check: if any post changed, re-run badges
      if (state.posts !== prevState.posts) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const activePosts = Object.values(usePostStore.getState().posts).filter(p => !p.is_deleted);
          Promise.all([
            getActiveBadges(activePosts),
            computeHotPosts(activePosts)
          ]).then(([bMap, hSet]) => {
            usePostStore.getState().setBadges(bMap);
            usePostStore.getState().setHotPosts(hSet);
          });
        }, 600);
      }
    });
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsub();
    };
  }, []);

  return (
    <PostContext.Provider value={{ 
      editingPost, 
      setEditingPost, 
      updatePost,
      optimisticUpdateMetrics,
      deletePost, 
      undoDelete, 
      hardDeletePost,
      addPost
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

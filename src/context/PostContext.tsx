"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Post } from '@/types';
import { supabase } from '../lib/supabaseClient';
import { postService } from '../services/postService';

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

  // Load from Supabase on mount and set up realtime subscription
  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setIsLoading(true);
      const [postsRes, metricsRes] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            profiles:avatar_id (
              username,
              name,
              avatar_url,
              bg_color
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('post_metrics')
          .select('*')
      ]);

      if (postsRes.error) {
        console.error('Error loading posts:', postsRes.error);
      }
      if (metricsRes.error) {
        console.error('Error loading post metrics:', metricsRes.error);
      }
      if (isMounted) {
        if (postsRes.data) {
          const metricsMap = new Map((metricsRes.data || []).map((m: any) => [m.post_id, m]));
          const postsWithMetrics = postsRes.data.map((post: any) => ({
            ...post,
            post_metrics: metricsMap.get(post.id) || null
          }));
          setAllPosts(postsWithMetrics as Post[]);
        }
        setIsLoading(false);
      }
    };

    loadPosts();

    // Set up realtime subscription to keep feed in sync
    const channel = supabase
      .channel('live-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const [postRes, metricsRes] = await Promise.all([
              supabase
                .from('posts')
                .select(`
                  *,
                  profiles:avatar_id (
                    username,
                    name,
                    avatar_url,
                    bg_color
                  )
                `)
                .eq('id', payload.new.id)
                .single(),
              supabase
                .from('post_metrics')
                .select('*')
                .eq('post_id', payload.new.id)
                .maybeSingle()
            ]);

            const fullPost = postRes.data;
            if (fullPost) {
              (fullPost as any).post_metrics = metricsRes.data || null;
            }
            
            if (isMounted && fullPost) {
              setAllPosts(prev => {
                const index = prev.findIndex(p => p.id === fullPost.id);
                if (index !== -1) {
                  return prev.map(p => p.id === fullPost.id ? (fullPost as Post) : p);
                } else {
                  return [fullPost as Post, ...prev];
                }
              });
            }
          } else if (payload.eventType === 'DELETE') {
            if (isMounted) {
              setAllPosts(prev => prev.filter(p => p.id !== payload.old.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
    try {
      const res = await postService.updatePost(postId, updates);
      if (!res.ok) {
        console.error('Failed to update post:', res.error);
        return false;
      }
      
      // Optimistic update
      if (res.data) {
        setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, ...res.data } : p));
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      const res = await postService.deletePost(postId);
      if (!res.ok) {
        console.error('Failed to delete post:', res.error);
        return false;
      }
      
      // Optimistic update
      if (res.data) {
        setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, ...res.data } : p));
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const undoDelete = useCallback(async (postId: string) => {
    try {
      const res = await postService.undoDeletePost(postId);
      if (!res.ok) {
        console.error('Failed to undo delete:', res.error);
        return false;
      }
      
      // Optimistic update
      if (res.data) {
        setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, ...res.data } : p));
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const hardDeletePost = useCallback(async (postId: string) => {
    try {
      const res = await postService.hardDeletePost(postId);
      if (!res.ok) {
        console.error('Failed to hard delete post:', res.error);
        return false;
      }
      
      // Optimistic update
      setAllPosts(prev => prev.filter(p => p.id !== postId));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const addPost = useCallback((post: Post) => {
    // Add locally immediately for optimistic UI feedback
    setAllPosts(prev => {
      if (prev.some(p => p.id === post.id)) return prev;
      return [post, ...prev];
    });
  }, []);

  const visiblePosts = useMemo(() => allPosts.filter(p => !p.is_deleted), [allPosts]);

  const contextValue = useMemo(() => ({
    posts: visiblePosts,
    allPosts,
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

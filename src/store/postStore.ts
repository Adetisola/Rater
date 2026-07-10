import { create } from 'zustand';
import type { Post, BadgeType } from '@/types';

interface PostState {
  posts: Record<string, Post>;
  
  // Computed values that we want to cache globally
  badgeMap: Record<string, BadgeType>;
  hotPostIds: Set<string>;
  
  // Actions
  addOrUpdatePosts: (newPosts: Post[]) => void;
  updatePostMetrics: (postId: string, metrics: Partial<Post>) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  deletePost: (postId: string) => void;
  
  setBadges: (badgeMap: Record<string, BadgeType>) => void;
  setHotPosts: (hotPostIds: Set<string>) => void;
}

export const usePostStore = create<PostState>((set) => ({
  posts: {},
  badgeMap: {},
  hotPostIds: new Set(),

  addOrUpdatePosts: (newPosts) => set((state) => {
    const nextPosts = { ...state.posts };
    newPosts.forEach(post => {
      // Don't overwrite with older data if we already have a newer version
      const existing = nextPosts[post.id];
      if (!existing || new Date(post.updated_at || post.created_at).getTime() >= new Date(existing.updated_at || existing.created_at).getTime()) {
        nextPosts[post.id] = { ...existing, ...post };
      }
    });
    return { posts: nextPosts };
  }),

  updatePostMetrics: (postId, metrics) => set((state) => {
    const existing = state.posts[postId];
    if (!existing) return state;
    return {
      posts: {
        ...state.posts,
        [postId]: { ...existing, ...metrics }
      }
    };
  }),

  updatePost: (postId, updates) => set((state) => {
    const existing = state.posts[postId];
    if (!existing) return state;
    return {
      posts: {
        ...state.posts,
        [postId]: { ...existing, ...updates }
      }
    };
  }),

  deletePost: (postId) => set((state) => {
    const nextPosts = { ...state.posts };
    delete nextPosts[postId];
    return { posts: nextPosts };
  }),

  setBadges: (badgeMap) => set({ badgeMap }),
  setHotPosts: (hotPostIds) => set({ hotPostIds })
}));

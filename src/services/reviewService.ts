import { supabase } from '../lib/supabaseClient';
import { safeQueryExecute, type ServiceResponse } from './baseService';
import type { Review } from '@/types';

export const reviewService = {
  /**
   * Fetches all reviews written for a specific post.
   */
  async fetchReviewsByPostId(postId: string): Promise<ServiceResponse<Review[]>> {
    return safeQueryExecute<Review[]>(
      supabase
        .from('reviews')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
    );
  },

  /**
   * Inserts a new review rating.
   * Supports both authenticated members (reviewer_id) and anonymous guests (device_id).
   */
  async createReview(review: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Review>> {
    return safeQueryExecute<Review>(
      supabase
        .from('reviews')
        .insert({
          post_id: review.post_id,
          reviewer_id: review.reviewer_id || null,
          reviewer_name: review.reviewer_name || null,
          device_id: review.device_id || null,
          clarity: review.clarity,
          purpose: review.purpose,
          aesthetics: review.aesthetics,
          comment: review.comment || null,
        })
        .select()
        .single()
    );
  },

  /**
   * Sets up a real-time subscription channel to push new reviews on a post.
   * Executed from the frontend detail page hooks.
   */
  subscribeToReviews(postId: string, onNewReview: (review: Review) => void) {
    const channel = supabase
      .channel(`live-post-reviews-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          onNewReview(payload.new as Review);
        }
      )
      .subscribe();

    // Returns a cleanup function that the consuming React component can invoke on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }
};

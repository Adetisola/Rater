import { supabase } from '../lib/supabaseClient';
import { safeQueryExecute, type ServiceResponse } from './baseService';
import type { Post, PostMetrics } from '@/types';

export const postService = {
  /**
   * Fetches all active, non-deleted posts from the database.
   * Includes nested author profiles metadata to prevent N+1 frontend lookups.
   */
  async fetchPosts(): Promise<ServiceResponse<Post[]>> {
    return safeQueryExecute<Post[]>(
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
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
    );
  },

  /**
   * High-performance paginated query that retrieves posts, nested author profiles,
   * and dynamic metrics views in a single database round-trip (solving the N+1 problem).
   */
  async fetchPostsPaginated(options: {
    limit: number;
    offset: number;
    category?: string;
    sortBy?: 'balanced' | 'highest_rated' | 'most_reviewed' | 'newest';
  }): Promise<ServiceResponse<{ posts: Post[]; hasMore: boolean }>> {
    const { limit, offset, category, sortBy = 'balanced' } = options;
    const from = offset;
    const to = offset + limit;

    try {
      let posts: Post[] = [];

      if (sortBy === 'highest_rated' || sortBy === 'most_reviewed') {
        // Query post_metrics first to avoid joining views in PostgREST
        let metricsQuery = supabase.from('post_metrics').select('*');
        if (sortBy === 'highest_rated') {
          metricsQuery = metricsQuery.eq('rating_unlocked', true).order('average_score', { ascending: false });
        } else {
          metricsQuery = metricsQuery.order('review_count', { ascending: false });
        }

        const { data: metricsData, error: metricsError } = await metricsQuery;
        if (metricsError) {
          return { ok: false, data: null, error: metricsError.message };
        }

        const postIds = (metricsData || []).map(m => m.post_id);
        if (postIds.length > 0) {
          let postQuery = supabase
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
            .eq('is_deleted', false)
            .in('id', postIds);
          
          if (category) {
            postQuery = postQuery.eq('category', category);
          }

          const { data: postsData, error: postsError } = await postQuery;
          if (postsError) {
            return { ok: false, data: null, error: postsError.message };
          }

          // Merge and sort in JS to preserve metrics order
          const postsMap = new Map((postsData || []).map((p: any) => [p.id, p]));

          const orderedPosts: Post[] = [];
          for (const metric of metricsData || []) {
            const post = postsMap.get(metric.post_id);
            if (post) {
              post.post_metrics = metric;
              orderedPosts.push(post as Post);
            }
          }

          posts = orderedPosts.slice(from, to + 1);
        }
      } else {
        // Newest or balanced
        let postQuery = supabase
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
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (category) {
          postQuery = postQuery.eq('category', category);
        }

        const { data: postsData, error: postsError } = await postQuery.range(from, to);
        if (postsError) {
          return { ok: false, data: null, error: postsError.message };
        }

        const fetchedPosts = postsData as Post[] || [];
        if (fetchedPosts.length > 0) {
          const postIds = fetchedPosts.map(p => p.id);
          const { data: metricsData, error: metricsError } = await supabase
            .from('post_metrics')
            .select('*')
            .in('post_id', postIds);
          
          if (!metricsError && metricsData) {
            const metricsMap = new Map(metricsData.map((m: any) => [m.post_id, m]));
            fetchedPosts.forEach(post => {
              post.post_metrics = metricsMap.get(post.id) || null;
            });
          }
        }
        posts = fetchedPosts;
      }

      const hasMore = posts.length > limit;
      const slicedPosts = hasMore ? posts.slice(0, limit) : posts;

      return {
        ok: true,
        data: {
          posts: slicedPosts,
          hasMore
        },
        error: null
      };
    } catch (e: any) {
      return {
        ok: false,
        data: null,
        error: e.message || 'Unknown pagination error'
      };
    }
  },

  /**
   * Fetches detailed information for a specific post.
   */
  async fetchPostById(postId: string): Promise<ServiceResponse<Post>> {
    const postRes = await safeQueryExecute<Post>(
      supabase
        .from('posts')
        .select(`
          *,
          profiles:avatar_id (
            id,
            username,
            name,
            avatar_url,
            bg_color,
            bio,
            role,
            social_links
          )
        `)
        .eq('id', postId)
        .single()
    );

    if (postRes.ok && postRes.data) {
      const metricsRes = await supabase
        .from('post_metrics')
        .select('*')
        .eq('post_id', postId)
        .maybeSingle();
      
      postRes.data.post_metrics = metricsRes.data || null;
    }

    return postRes;
  },

  /**
   * Creates a new design review post.
   */
  async createPost(post: Omit<Post, 'created_at' | 'updated_at'>): Promise<ServiceResponse<Post>> {
    return safeQueryExecute<Post>(
      supabase
        .from('posts')
        .insert({
          id: post.id,
          title: post.title,
          description: post.description,
          category: post.category,
          image_url: post.image_url,
          avatar_id: post.avatar_id,
        })
        .select()
        .single()
    );
  },

  /**
   * Updates an existing post's text details or category tags.
   */
  async updatePost(postId: string, updates: Partial<Post>): Promise<ServiceResponse<Post>> {
    return safeQueryExecute<Post>(
      supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single()
    );
  },

  /**
   * Performs a soft delete by marking is_deleted = true.
   * This retains the post row for eventual undo/restoration.
   */
  async deletePost(postId: string): Promise<ServiceResponse<Post>> {
    return safeQueryExecute<Post>(
      supabase
        .from('posts')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select()
        .single()
    );
  },

  /**
   * Reverts a soft deletion.
   */
  async undoDeletePost(postId: string): Promise<ServiceResponse<Post>> {
    return safeQueryExecute<Post>(
      supabase
        .from('posts')
        .update({
          is_deleted: false,
          deleted_at: null,
        })
        .eq('id', postId)
        .select()
        .single()
    );
  },

  /**
   * Performs an absolute, permanent database deletion.
   */
  async hardDeletePost(postId: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return {
        ok: false,
        data: null,
        error: error.message,
      };
    }
    return {
      ok: true,
      data: null,
      error: null,
    };
  },

  /**
   * Queries the computed aggregate metrics view for a post.
   */
  async fetchPostMetrics(postId: string): Promise<ServiceResponse<PostMetrics>> {
    return safeQueryExecute<PostMetrics>(
      supabase
        .from('post_metrics')
        .select('*')
        .eq('post_id', postId)
        .single()
    );
  },

  /**
   * Fetches all active posts by a specific avatar/profile.
   * Used by the profile page to avoid relying on the in-memory feed cache.
   */
  async fetchPostsByAvatarId(avatarId: string): Promise<ServiceResponse<Post[]>> {
    const postsRes = await safeQueryExecute<Post[]>(
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
        .eq('avatar_id', avatarId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
    );

    if (postsRes.ok && postsRes.data && postsRes.data.length > 0) {
      const postIds = postsRes.data.map(p => p.id);
      const { data: metricsData } = await supabase
        .from('post_metrics')
        .select('*')
        .in('post_id', postIds);
      
      const metricsMap = new Map((metricsData || []).map((m: any) => [m.post_id, m]));
      postsRes.data.forEach(post => {
        post.post_metrics = metricsMap.get(post.id) || null;
      });
    }

    return postsRes;
  },
};

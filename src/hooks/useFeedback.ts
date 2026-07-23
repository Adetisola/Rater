import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { FeedbackRequest } from '@/types';

export function useFeedback(sortBy: string, filterType: string) {
  const [feedback, setFeedback] = useState<FeedbackRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchFeedback() {
      setIsLoading(true);
      
      let query = supabase.from('feedback_requests_with_stats').select('*');
      
      if (filterType !== 'All') {
        query = query.eq('type', filterType);
      }
      
      // We don't fetch deleted items because RLS or View handles it, but let's be explicit if needed
      // Actually, deleted_at is filtered by RLS policies
      
      if (sortBy === 'Most Upvoted') {
        query = query.order('upvote_count', { ascending: false }).order('created_at', { ascending: false });
      } else if (sortBy === 'Newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'Recently Active') {
        query = query.order('updated_at', { ascending: false });
      } else if (sortBy === 'Completed') {
        query = query.eq('status', 'Completed').order('updated_at', { ascending: false });
      } else if (sortBy === 'Planned') {
        query = query.eq('status', 'Planned').order('upvote_count', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (isMounted) {
        if (!error && data) {
          setFeedback(data as FeedbackRequest[]);
        }
        setIsLoading(false);
      }
    }

    fetchFeedback();
    
    return () => { isMounted = false; };
  }, [sortBy, filterType]);

  return { feedback, isLoading };
}

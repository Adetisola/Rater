"use client";

import { useState, useEffect } from 'react';
import { type Post } from '../logic/mockData';
import { computeHotPosts } from '../logic/hotPostUtils';

export function useHotPosts(posts: Post[]) {
  const [hotPostIds, setHotPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    computeHotPosts(posts).then(set => {
      if (isMounted) {
        setHotPostIds(set);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [posts]);

  return { hotPostIds, loading };
}

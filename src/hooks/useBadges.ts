"use client";

import { useState, useEffect } from 'react';
import type { Post, BadgeType } from '@/types';
import { computeBadges } from '../logic/badgeUtils';

export function useBadges(posts: Post[]) {
  const [badgeMap, setBadgeMap] = useState<Record<string, BadgeType>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    computeBadges(posts).then(map => {
      if (isMounted) {
        setBadgeMap(map);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [posts]);

  return { badgeMap, loading };
}

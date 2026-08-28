import { useState, useEffect } from 'react';
import type { Category } from '@/types';

export type RecentItemData =
  | { type: "search"; query: string; timestamp: number }
  | { type: "avatar"; avatarId: string; timestamp: number }
  | { type: "post"; postId: string; timestamp: number }
  | { type: "category"; category: Category; timestamp: number };

const STORAGE_KEY = 'rater_recent_searches';

export function useRecentSearches() {
  const [items, setItems] = useState<RecentItemData[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      // ignore parsing errors
    }
  }, []);

  const saveItems = (newItems: RecentItemData[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      // ignore storage errors
    }
  };

  const MAX_ITEMS = 8;

  const addSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const filtered = items.filter(i => !(i.type === 'search' && i.query.toLowerCase() === trimmed.toLowerCase()));
    saveItems([{ type: 'search' as const, query: trimmed, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS));
  };

  const addAvatar = (avatarId: string) => {
    if (!avatarId) return;
    const filtered = items.filter(i => !(i.type === 'avatar' && i.avatarId === avatarId));
    saveItems([{ type: 'avatar' as const, avatarId, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS));
  };

  const addPost = (postId: string) => {
    if (!postId) return;
    const filtered = items.filter(i => !(i.type === 'post' && i.postId === postId));
    saveItems([{ type: 'post' as const, postId, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS));
  };

  const addCategory = (category: Category) => {
    if (!category) return;
    const filtered = items.filter(i => !(i.type === 'category' && i.category === category));
    saveItems([{ type: 'category' as const, category, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS));
  };

  const removeItem = (index: number) => {
    saveItems(items.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    saveItems([]);
  };

  return {
    recentItems: items,
    addSearch,
    addAvatar,
    addPost,
    addCategory,
    removeItem,
    clearAll
  };
}

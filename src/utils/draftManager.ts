/**
 * Universal Review Draft System Utility
 * Handles persistence for both guests and authenticated users.
 *
 * TODO(backend): Replace localStorage draft persistence with Supabase
 * draft storage. Guest sessions should use anonymous auth or device IDs.
 */

import type { Review } from '../types';

export interface ReviewDraft {
  ratings: Partial<Record<keyof Review, number>>;
  comment: string;
  updatedAt: number;
}

/**
 * Builds the unique key for localStorage drafts
 */
export function buildDraftKey(postId: string, userId: string): string {
  return `review_draft:${postId}:user_${userId}`;
}

/**
 * Builds the key for temporary auth snapshots
 */
export function buildSnapshotKey(postId: string): string {
  return `review_auth_snapshot:${postId}`;
}

/**
 * Saves a draft to localStorage
 */
export function saveDraft(postId: string, userId: string, data: Omit<ReviewDraft, 'updatedAt'>) {
  const key = buildDraftKey(postId, userId);
  const draft: ReviewDraft = {
    ...data,
    updatedAt: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(draft));
}

/**
 * Loads a draft from localStorage
 */
export function loadDraft(postId: string, userId: string): ReviewDraft | null {
  const key = buildDraftKey(postId, userId);
  const saved = localStorage.getItem(key);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
}

/**
 * Deletes a draft from localStorage
 */
export function deleteDraft(postId: string, userId: string) {
  const key = buildDraftKey(postId, userId);
  localStorage.removeItem(key);
}

/**
 * Saves a temporary UI snapshot to sessionStorage during auth interruption
 */
export function saveSnapshot(postId: string, data: Omit<ReviewDraft, 'updatedAt'>) {
  const key = buildSnapshotKey(postId);
  const snapshot: ReviewDraft = {
    ...data,
    updatedAt: Date.now(),
  };
  sessionStorage.setItem(key, JSON.stringify(snapshot));
}

/**
 * Loads a temporary UI snapshot
 */
export function loadSnapshot(postId: string): ReviewDraft | null {
  const key = buildSnapshotKey(postId);
  const saved = sessionStorage.getItem(key);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
}

/**
 * Deletes a temporary snapshot
 */
export function deleteSnapshot(postId: string) {
  const key = buildSnapshotKey(postId);
  sessionStorage.removeItem(key);
}


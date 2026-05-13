/**
 * Universal Review Draft System Utility
 * Handles persistence for both guests and authenticated users.
 */

export interface ReviewDraft {
  ratings: {
    clarity: number;
    purpose: number;
    aesthetics: number;
  };
  comment: string;
  name: string;
  updatedAt: number;
}

const GUEST_ID_KEY = 'rater_guest_session_id';

/**
 * Gets or creates a stable guest session ID for the current browser session
 */
export function getGuestSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let guestId = sessionStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

/**
 * Builds the unique key for localStorage drafts
 */
export function buildDraftKey(postId: string, userId?: string): string {
  const identity = userId ? `user_${userId}` : getGuestSessionId();
  return `review_draft:${postId}:${identity}`;
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
export function saveDraft(postId: string, userId: string | undefined, data: Omit<ReviewDraft, 'updatedAt'>) {
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
export function loadDraft(postId: string, userId?: string): ReviewDraft | null {
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
export function deleteDraft(postId: string, userId?: string) {
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

/**
 * Migrates a guest draft to a user draft if it exists
 */
export function migrateDraft(postId: string, guestId: string, userId: string) {
  const guestKey = `review_draft:${postId}:${guestId}`;
  const userKey = `review_draft:${postId}:user_${userId}`;
  
  const guestDraft = localStorage.getItem(guestKey);
  if (guestDraft) {
    localStorage.setItem(userKey, guestDraft);
    localStorage.removeItem(guestKey);
  }
}

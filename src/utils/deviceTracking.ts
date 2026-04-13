/**
 * DEVICE TRACKING UTILITY
 * Responsible for identifying unique devices and tracking review activity
 * across browser sessions.
 */

const STORAGE_KEY_DEVICE_ID = 'rater_device_id';
const STORAGE_KEY_REVIEWED_POSTS = 'rater_reviewed_posts';

/**
 * Gets or generates a unique stable ID for this browser/device.
 */
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
  
  if (!deviceId) {
    // Generate a new ID: dev_uuid_timestamp
    const random = Math.random().toString(36).substring(2, 11);
    const timestamp = Date.now();
    deviceId = `dev_${random}_${timestamp}`;
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
  }
  
  return deviceId;
};

/**
 * Checks if this device has already reviewed a specific post.
 */
export const hasReviewedPost = (post_id: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const reviewed = JSON.parse(localStorage.getItem(STORAGE_KEY_REVIEWED_POSTS) || '[]');
  return reviewed.includes(post_id);
};

/**
 * Persists a review event for this device locally.
 */
export const markPostAsReviewed = (post_id: string): void => {
  if (typeof window === 'undefined') return;
  
  const reviewed = JSON.parse(localStorage.getItem(STORAGE_KEY_REVIEWED_POSTS) || '[]');
  if (!reviewed.includes(post_id)) {
    localStorage.setItem(STORAGE_KEY_REVIEWED_POSTS, JSON.stringify([...reviewed, post_id]));
  }
};

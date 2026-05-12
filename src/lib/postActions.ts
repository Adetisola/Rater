/**
 * Shared action utilities for post interactions.
 * Used by PostActionsMenu across Post Card and Post Detail.
 */

/**
 * Share a post.
 * Returns true if handled natively (mobile), false if the caller should show custom UI (desktop).
 */
export async function sharePost(postId: string, title?: string): Promise<boolean> {
  const url = `${window.location.origin}/post/${postId}`;

  // Simple mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    try {
      await navigator.share({ title: title || 'Check out this design on Rater', url });
      return true; // Handled natively
    } catch {
      // User cancelled or API failed
    }
  }

  return false; // Tells caller to show custom SharePostOverlay
}

/**
 * Download the post's image as a file.
 */
export async function downloadPostImage(imageUrl: string, title?: string): Promise<void> {
  const filename = `${(title || 'rater-image').replace(/\s+/g, '_')}.jpg`;

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download failed', err);
    window.open(imageUrl, '_blank');
  }
}

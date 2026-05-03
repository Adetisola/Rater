/**
 * Standardized timestamp formatting for the Rater app.
 */

export function formatTimestamp(date: string | Date, currentNow?: number | Date): string {
  const now = currentNow ? new Date(currentNow) : new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 5) {
    return "Just now";
  }

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // Formatting for older dates
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[past.getMonth()];
  const day = past.getDate();
  const year = past.getFullYear();

  if (year === now.getFullYear()) {
    return `${month} ${day}`;
  }

  return `${month} ${day}, ${year}`;
}

/**
 * Returns a full descriptive timestamp for tooltips.
 * Example: "May 2, 2026 • 14:32"
 */
export function getFullTimestamp(date: string | Date): string {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${month} ${day}, ${year} • ${hours}:${minutes}`;
}

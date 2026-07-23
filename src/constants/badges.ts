/**
 * Badge eligibility constants — product definitions, not database values.
 *
 * These thresholds are baked into Rater's product logic and reviewed manually.
 * They do not live in the database.
 */

/** Maximum number of simultaneous Top Rated active badges. */
export const MAX_TOP_RATED_BADGES = 3;

/** Minimum reviews a post must have to be eligible for a badge. */
export const MIN_REVIEWS_FOR_BADGE = 5;

/** Badge eligibility window in days — only recent posts can earn badges. */
export const BADGE_WINDOW_DAYS = 7;

/**
 * Activation evaluation policies for the Rater platform.
 * 
 * Under the revised production activation policy (RAT-001), a registered user is
 * considered "activated" if they have uploaded >= 1 design OR submitted >= 1 review.
 */

/**
 * Pure truth-table predicate for activation status.
 */
export function evaluateActivationStatus(
  hasUploaded: boolean,
  hasReviewed: boolean
): boolean {
  return hasUploaded || hasReviewed;
}

/**
 * Evaluates whether a user ID is present in either the uploaders set or the reviewers/raters set.
 */
export function isUserActivated(
  userId: string,
  uploaders: Set<string> | ReadonlySet<string>,
  ratersOrReviewers: Set<string> | ReadonlySet<string>
): boolean {
  return uploaders.has(userId) || ratersOrReviewers.has(userId);
}

/**
 * Cloudinary Transforms — URL generation and image optimization.
 *
 * Generates responsive URLs, blur placeholders, and eager transformations
 * from a Cloudinary public_id. Components consume these outputs; they
 * never construct Cloudinary URLs manually.
 *
 * TODO(milestone-3): Replace stubs with real Cloudinary URL builder calls.
 */

export interface ResponsiveImageSet {
  /** Default src URL (largest size). */
  src: string;
  /** srcSet string for <img> or Next.js Image. */
  srcSet: string;
  /** Tiny base64 blur placeholder for progressive loading. */
  placeholder: string;
  /** Alt widths for responsive rendering. */
  widths: number[];
}

/**
 * Generate a responsive image set from a Cloudinary public_id.
 */
export function generateResponsiveUrls(publicId: string): ResponsiveImageSet {
  // TODO(milestone-3): Build Cloudinary URLs at 400, 800, 1200, 1600px breakpoints
  // with automatic format (f_auto) and quality (q_auto)
  return {
    src: publicId,
    srcSet: '',
    placeholder: '',
    widths: [400, 800, 1200, 1600],
  };
}

/**
 * Generate a base64 LQIP (Low Quality Image Placeholder) for a Cloudinary image.
 * Used for blur-up loading effects.
 */
export function generateBlurPlaceholder(publicId: string): string {
  // TODO(milestone-3): Cloudinary e_blur:1000,q_1,w_100 → fetch as base64
  void publicId;
  return '';
}

/**
 * Generate a thumbnail URL from a Cloudinary public_id.
 */
export function generateThumbnail(publicId: string, width = 200, height = 200): string {
  // TODO(milestone-3): c_fill,w_{width},h_{height},f_auto,q_auto
  void width;
  void height;
  return publicId;
}

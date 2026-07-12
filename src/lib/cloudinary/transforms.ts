/**
 * Cloudinary Transforms — URL generation and image optimization.
 *
 * Generates responsive URLs, blur placeholders, and eager transformations
 * from a Cloudinary public_id. Components consume these outputs; they
 * never construct Cloudinary URLs manually.
 */

import { Cloudinary } from '@cloudinary/url-gen';
import { fill, scale } from '@cloudinary/url-gen/actions/resize';
import { format, quality, dpr } from '@cloudinary/url-gen/actions/delivery';
import { auto as fAuto } from '@cloudinary/url-gen/qualifiers/format';
import { auto as qAuto } from '@cloudinary/url-gen/qualifiers/quality';
import { auto as autoDpr } from '@cloudinary/url-gen/qualifiers/dpr';
import { blur } from '@cloudinary/url-gen/actions/effect';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

// Initialize Cloudinary instance using the environment variable
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
  },
});

export interface ResponsiveImageSet {
  /** Default src URL (largest size). */
  src: string;
  /** srcSet string for <img> or Next.js Image. */
  srcSet: string;
  /** Tiny blur placeholder URL for progressive loading. */
  placeholder: string;
  /** Alt widths for responsive rendering. */
  widths: number[];
}

/**
 * Generate a responsive image set from a Cloudinary public_id.
 * Generates identical URLs for identical inputs to maximize CDN caching.
 */
export function generateResponsiveUrls(publicId: string): ResponsiveImageSet {
  const widths = [400, 800, 1200, 1600];
  
  // Helper to generate an optimized URL for a given width
  const buildUrlForWidth = (w: number) => {
    return cld
      .image(publicId)
      .resize(scale().width(w))
      .delivery(format(fAuto()))
      .delivery(quality(qAuto()))
      .delivery(dpr(autoDpr()))
      .toURL();
  };

  const urls = widths.map((w) => buildUrlForWidth(w));
  const srcSet = urls.map((url, i) => `${url} ${widths[i]}w`).join(', ');

  // The largest width is the fallback src
  const src = urls[urls.length - 1];

  return {
    src,
    srcSet,
    placeholder: generateBlurPlaceholder(publicId),
    widths,
  };
}

/**
 * Generate a low-resolution blur placeholder URL for progressive loading.
 * This function returns a fast, deterministic synchronous string suitable for `blurDataURL`.
 */
export function generateBlurPlaceholder(publicId: string): string {
  return cld
    .image(publicId)
    .resize(scale().width(100))
    .effect(blur().strength(1000))
    .delivery(quality(qAuto()))
    .delivery(format(fAuto()))
    .toURL();
}

/**
 * Generate a highly-optimized thumbnail URL from a Cloudinary public_id.
 * Applies intelligent cropping around the most important subject.
 * These helpers are media-aware, so they can support video thumbnails in the future.
 */
export function generateThumbnail(publicId: string, width = 200, height = 200): string {
  return cld
    .image(publicId)
    .resize(fill().width(width).height(height).gravity(autoGravity()))
    .delivery(format(fAuto()))
    .delivery(quality(qAuto()))
    .toURL();
}

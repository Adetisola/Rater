/**
 * Cloudinary Transforms — Centralized URL Generation & Image Optimization Engine.
 *
 * Generates deterministic, responsive URLs, presets, and eager transformations
 * from canonical public_ids or URLs. Components consume these outputs and never
 * construct transformation strings manually.
 */

import { Cloudinary } from '@cloudinary/url-gen';
import { fill, scale } from '@cloudinary/url-gen/actions/resize';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { auto as fAuto } from '@cloudinary/url-gen/qualifiers/format';
import { auto as qAuto, autoBest } from '@cloudinary/url-gen/qualifiers/quality';
import { blur } from '@cloudinary/url-gen/actions/effect';
import { autoGravity, focusOn } from '@cloudinary/url-gen/qualifiers/gravity';
import { FocusOn } from '@cloudinary/url-gen/qualifiers/focusOn';

// Initialize deterministic Cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'rater',
  },
  url: {
    secure: true,
    analytics: false,
  },
});

export type ThumbnailPreset = 'POST_THUMBNAIL_SM' | 'POST_THUMBNAIL_MD' | 'POST_SEARCH_THUMB';
export type AvatarPreset = 'xs' | 'sm' | 'md' | 'lg';
export type MediaPreset = 'POST_CARD' | 'POST_DETAIL';

export interface ThumbnailPresetConfig {
  width: number;
  height: number;
  crop: 'fill' | 'scale';
  gravity: 'auto' | 'face';
  containerWidth: number;
  containerHeight: number;
  cssAspectRatio: string;
}

export const THUMBNAIL_PRESETS: Record<ThumbnailPreset, ThumbnailPresetConfig> = {
  POST_THUMBNAIL_SM: {
    width: 112,
    height: 112,
    crop: 'fill',
    gravity: 'auto',
    containerWidth: 56,
    containerHeight: 56,
    cssAspectRatio: '1 / 1',
  },
  POST_THUMBNAIL_MD: {
    width: 160,
    height: 160,
    crop: 'fill',
    gravity: 'auto',
    containerWidth: 80,
    containerHeight: 80,
    cssAspectRatio: '1 / 1',
  },
  POST_SEARCH_THUMB: {
    width: 112,
    height: 80,
    crop: 'fill',
    gravity: 'auto',
    containerWidth: 56,
    containerHeight: 40,
    cssAspectRatio: '56 / 40',
  },
};

export const AVATAR_PRESETS: Record<AvatarPreset, { targetSize: number; containerSize: number }> = {
  xs: { targetSize: 64, containerSize: 28 },
  sm: { targetSize: 128, containerSize: 44 },
  md: { targetSize: 200, containerSize: 80 },
  lg: { targetSize: 400, containerSize: 160 },
};

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
 * Extract clean Cloudinary public_id from a raw or transformed Cloudinary URL.
 * Strips transformation segments, version prefixes, and file extensions cleanly
 * to avoid double-transformation nesting.
 */
export function extractPublicId(input?: string | null): string | null {
  if (!input) return null;
  const url = input.trim();

  // If it's already a clean public ID without http/https protocol
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    const dotIdx = url.lastIndexOf('.');
    return dotIdx !== -1 ? url.substring(0, dotIdx) : url;
  }

  if (!url.includes('cloudinary.com')) return null;

  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const pathAfterUpload = parts[1];
    const segments = pathAfterUpload.split('/');

    // Look for version prefix v12345678
    const versionIdx = segments.findIndex((seg) => /^v\d+$/.test(seg));

    let publicIdPath = '';
    if (versionIdx !== -1) {
      publicIdPath = segments.slice(versionIdx + 1).join('/');
    } else {
      // Find the first segment that is NOT a transformation parameter
      // Cloudinary transformations contain comma, or start with known flags like c_, w_, h_, q_, f_, etc.
      const transformFlagRegex = /^(?:[a-z]{1,4}_[^/]+|c_|w_|h_|q_|f_|g_|b_|e_|l_|r_|t_|dpr_|fl_|ar_|z_|y_|x_)/i;
      const firstRealSegmentIdx = segments.findIndex(
        (seg) => !transformFlagRegex.test(seg) && !seg.includes(',')
      );

      publicIdPath =
        firstRealSegmentIdx !== -1
          ? segments.slice(firstRealSegmentIdx).join('/')
          : segments[segments.length - 1];
    }

    // Strip extension (.jpg, .png, .webp, .avif)
    const dotIdx = publicIdPath.lastIndexOf('.');
    if (dotIdx !== -1) {
      return publicIdPath.substring(0, dotIdx);
    }
    return publicIdPath;
  } catch (e) {
    console.error('Failed to extract public_id from Cloudinary URL:', url, e);
    return null;
  }
}

/**
 * Generates an optimized thumbnail URL using a named preset.
 * Pure and deterministic output.
 */
export function getOptimizedThumbnailUrl(
  canonical: { publicId?: string | null; url?: string | null },
  preset: ThumbnailPreset = 'POST_THUMBNAIL_SM'
): string {
  const config = THUMBNAIL_PRESETS[preset];
  const publicId = canonical.publicId || extractPublicId(canonical.url);

  if (publicId) {
    return cld
      .image(publicId)
      .resize(fill().width(config.width).height(config.height).gravity(autoGravity()))
      .delivery(format(fAuto()))
      .delivery(quality(qAuto()))
      .toURL();
  }

  // Fallback to raw URL if not a Cloudinary asset
  return canonical.url || '';
}

/**
 * Optimizes an avatar URL based on its provider:
 * 1. Cloudinary: Face-centered crop with auto-format/quality at 2x DPR.
 * 2. Google OAuth: Dynamically adjusts resolution parameter (=s{size}-c).
 * 3. External / Fallback: Preserves original URL safely.
 */
export function optimizeAvatarUrl(
  urlOrPublicId?: string | null,
  sizePreset: AvatarPreset = 'md'
): string | null {
  if (!urlOrPublicId) return null;
  const input = urlOrPublicId.trim();
  const sizeConfig = AVATAR_PRESETS[sizePreset];

  // 1. Check if Cloudinary publicId or URL
  const publicId = extractPublicId(input);
  if (publicId) {
    return cld
      .image(publicId)
      .resize(fill().width(sizeConfig.targetSize).height(sizeConfig.targetSize).gravity(focusOn(FocusOn.face())))
      .delivery(format(fAuto()))
      .delivery(quality(qAuto()))
      .toURL();
  }

  // 2. Check if Google OAuth Avatar
  if (input.includes('googleusercontent.com')) {
    // Replace =s96-c or =s{any}-c with requested size
    if (/=s\d+(-c)?/i.test(input)) {
      return input.replace(/=s\d+(-c)?/i, `=s${sizeConfig.targetSize}-c`);
    }
    // Append =s{size}-c if no size parameter exists
    return input.includes('?') ? `${input}&sz=${sizeConfig.targetSize}` : `${input}=s${sizeConfig.targetSize}-c`;
  }

  // 3. Other external avatar URLs (safe pass-through)
  return input;
}

/**
 * Generate a responsive image set for card or detail views without aggressive cropping.
 * Preserves natural aspect ratio and generates deterministic srcSet.
 */
export function getOptimizedMediaUrls(
  canonical: { publicId?: string | null; url?: string | null },
  preset: MediaPreset = 'POST_CARD'
): ResponsiveImageSet | null {
  const publicId = canonical.publicId || extractPublicId(canonical.url);
  if (!publicId) return null;

  const widths = preset === 'POST_DETAIL' ? [800, 1200, 1600, 2400] : [400, 800, 1200];

  const buildUrlForWidth = (w: number) => {
    return cld
      .image(publicId)
      .resize(scale().width(w))
      .delivery(format(fAuto()))
      .delivery(quality(qAuto()))
      .toURL();
  };

  const urls = widths.map((w) => buildUrlForWidth(w));
  const srcSet = urls.map((url, i) => `${url} ${widths[i]}w`).join(', ');
  const src = urls[urls.length - 1];

  return {
    src,
    srcSet,
    placeholder: generateBlurPlaceholder(publicId),
    widths,
  };
}

/**
 * Generate a low-resolution blur placeholder URL for progressive loading (LQIP).
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
 * Generate a thumbnail URL from a Cloudinary public_id (legacy compatibility helper).
 */
export function generateThumbnail(publicId: string, width = 200, height = 200): string {
  return cld
    .image(publicId)
    .resize(fill().width(width).height(height).gravity(autoGravity()))
    .delivery(format(fAuto()))
    .delivery(quality(qAuto()))
    .toURL();
}

/**
 * Generate responsive image set (legacy compatibility helper).
 */
export function generateResponsiveUrls(publicId: string): ResponsiveImageSet {
  return getOptimizedMediaUrls({ publicId }, 'POST_CARD')!;
}

/**
 * Generate a highly-optimized URL specifically for downloading.
 */
export function generateDownloadUrl(publicId: string): string {
  return cld
    .image(publicId)
    .resize(scale().width(2400))
    .format('jpg')
    .delivery(quality(autoBest()))
    .toURL();
}

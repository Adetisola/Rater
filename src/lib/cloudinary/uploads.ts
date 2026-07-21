import type { MediaAsset } from '@/types';
import { supabase } from '../supabase/client';
import { uploadDirectToCloudinary } from './directUpload';

// ─── Error Classification ──────────────────────────────────────────────────────
const FRIENDLY_ERRORS: Array<{ test: RegExp | string; message: string }> = [
  { test: /unable to fetch/i, message: 'Upload failed — your connection dropped. Please try again.' },
  { test: /failed to fetch/i, message: 'Upload failed — your connection dropped. Please try again.' },
  { test: /unexpected token/i, message: 'The server returned an unexpected response. Please try again.' },
  { test: /not valid json/i, message: 'The server returned an unexpected response. Please try again.' },
  { test: /network request failed/i, message: 'No internet connection detected. Please check your connection and try again.' },
  { test: /413|too large/i, message: 'That image is too large. Please use a smaller image or allow the app to compress it.' },
  { test: /401|session expired/i, message: 'Your session expired. Please refresh the page and try again.' },
  { test: /403/i, message: 'You don\'t have permission to upload. Please sign in again.' },
  { test: /500/i, message: 'Something went wrong on our end. Please try again in a moment.' },
  { test: /502/i, message: 'The server is temporarily unavailable. Please try again shortly.' },
  { test: /503/i, message: 'Service is temporarily unavailable. Please try again shortly.' },
];

function getFriendlyError(raw: string): string {
  const match = FRIENDLY_ERRORS.find(e => {
    if (e.test instanceof RegExp) return e.test.test(raw);
    return raw.toLowerCase().includes(e.test.toLowerCase());
  });
  return match?.message ?? 'Upload failed. Please check your connection and try again.';
}

// ─── Retry Helper ──────────────────────────────────────────────────────────────
const RETRY_DELAYS_MS = [1000, 2500, 5000]; // Exponential-ish backoff

function isRetryable(error: unknown): boolean {
  if (!navigator.onLine) return false; // No point retrying without connectivity
  const msg = String(error).toLowerCase();
  
  // Non-retryable server errors
  if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('403')) return false;
  if (msg.includes('unsupported') || msg.includes('invalid') || msg.includes('400')) return false;
  if (msg.includes('too large') || msg.includes('413')) return false;
  if (msg.includes('abort') || msg.includes('aborterror')) return false;
  
  return true;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface UploadProgressEvent {
  /** Total number of files being uploaded in this batch */
  total: number;
  /** Number of files successfully uploaded so far */
  completed: number;
  /** 0–100 overall percentage */
  percent: number;
  /** Which stage we're currently in */
  stage: 'preparing' | 'compressing' | 'uploading' | 'saving' | 'publishing';
}

export type UploadProgressCallback = (event: UploadProgressEvent) => void;

/**
 * Upload a single media file to Cloudinary with automatic retries.
 * Throws a user-friendly error string if all retries are exhausted.
 */
export async function uploadMedia(file: File, folder?: string, onProgress?: (percent: number) => void, signal?: AbortSignal): Promise<MediaAsset> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const asset = await uploadDirectToCloudinary(file, folder, onProgress, signal);
      return asset;
    } catch (err) {
      lastError = err;

      const isLast = attempt >= RETRY_DELAYS_MS.length;
      if (isLast || !isRetryable(err)) {
        const msg = err instanceof Error ? err.message : getFriendlyError(String(err));
        throw new Error(msg);
      }

      console.warn(`[uploadMedia] Attempt ${attempt + 1} failed, retrying in ${RETRY_DELAYS_MS[attempt]}ms…`, err);
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw new Error(getFriendlyError(String(lastError)));
}

/**
 * Upload multiple media files using controlled concurrency (max 3 at a time).
 * Uses Promise.allSettled to ensure a single failure doesn't abort the entire batch.
 * Files passed here should already be compressed by the caller.
 */
export async function uploadMediaBatch(
  files: File[],
  folder?: string,
  onFileProgress?: (fileIndex: number, percent: number) => void,
  signal?: AbortSignal
): Promise<PromiseSettledResult<MediaAsset>[]> {
  const CONCURRENCY_LIMIT = 3;
  const results: PromiseSettledResult<MediaAsset>[] = new Array(files.length);
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < files.length; i++) {
    const p = Promise.resolve().then(async () => {
      try {
        const asset = await uploadMedia(files[i], folder, (percent) => {
          onFileProgress?.(i, percent);
        }, signal);
        results[i] = { status: 'fulfilled', value: asset };
      } catch (error) {
        results[i] = { status: 'rejected', reason: error };
      }
    });

    const e: Promise<void> = p.then(() => { executing.delete(e); });
    executing.add(e);
    if (executing.size >= CONCURRENCY_LIMIT) {
      await Promise.race(executing);
    }
  }

  // Wait for all remaining uploads to finish
  await Promise.all(Array.from(executing));
  
  return results;
}

export async function deleteMedia(publicId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return false;

    // We still use the server API endpoint for secure deletion since it requires secret tokens
    const response = await fetch(`/api/upload?public_id=${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to delete media:', error);
    return false;
  }
}

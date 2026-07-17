import type { MediaAsset } from '@/types';
import { supabase } from '../supabase/client';

// ─── Error Classification ──────────────────────────────────────────────────────
// These are the raw error strings that can leak through from the server/network.
// We intercept them and replace with user-friendly messages.
const FRIENDLY_ERRORS: Array<{ test: RegExp | string; message: string }> = [
  { test: /unable to fetch/i, message: 'Upload failed — your connection dropped. Please try again.' },
  { test: /failed to fetch/i, message: 'Upload failed — your connection dropped. Please try again.' },
  { test: /unexpected token/i, message: 'The server returned an unexpected response. Please try again.' },
  { test: /not valid json/i, message: 'The server returned an unexpected response. Please try again.' },
  { test: /network request failed/i, message: 'No internet connection detected. Please check your connection and try again.' },
  { test: /413/i, message: 'That image is too large (max 8MB per image). Please compress it and try again.' },
  { test: /401/i, message: 'Your session expired. Please refresh the page and try again.' },
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
  // Only retry transient/network errors, NOT validation/auth errors
  if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('403')) return false;
  if (msg.includes('unsupported') || msg.includes('invalid') || msg.includes('400')) return false;
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
  stage: 'preparing' | 'uploading' | 'saving' | 'publishing';
}

export type UploadProgressCallback = (event: UploadProgressEvent) => void;

/**
 * Upload a single media file to /api/upload with automatic retries.
 * Throws a user-friendly error string if all retries are exhausted.
 */
export async function uploadMedia(file: File): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      let response: Response;
      try {
        response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          body: formData,
        });
      } catch (networkErr) {
        // fetch() itself threw (e.g. "Failed to fetch", "Unable to fetch")
        throw new Error(getFriendlyError(String(networkErr)));
      }

      // Try to parse JSON — guard against HTML error pages (the "Unexpected token 'R'" bug)
      let data: any;
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Server returned HTML or plain text — this is the root cause of the JSON parse error
        const rawText = await response.text();
        console.error('[uploadMedia] Non-JSON response from /api/upload:', rawText.slice(0, 200));
        throw new Error(getFriendlyError(`Status ${response.status}`));
      }

      if (!response.ok) {
        const errMsg = data?.error || `Status ${response.status}`;
        // Non-retryable server errors (400, 401, 403) — throw immediately
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(getFriendlyError(errMsg));
        }
        throw new Error(getFriendlyError(errMsg));
      }

      return data.asset as MediaAsset;

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

  // Should never reach here, but TypeScript needs a return
  throw new Error(getFriendlyError(String(lastError)));
}

/**
 * Upload multiple media files in sequence, firing progress callbacks after each file.
 * Each file is retried individually — a single file failure throws after exhausting retries.
 */
export async function uploadMediaBatch(
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<MediaAsset[]> {
  const results: MediaAsset[] = [];

  onProgress?.({ total: files.length, completed: 0, percent: 0, stage: 'preparing' });

  for (let i = 0; i < files.length; i++) {
    onProgress?.({
      total: files.length,
      completed: i,
      percent: Math.round((i / files.length) * 85), // Reserve 85–100% for DB save
      stage: 'uploading',
    });

    const asset = await uploadMedia(files[i]);
    results.push(asset);

    onProgress?.({
      total: files.length,
      completed: i + 1,
      percent: Math.round(((i + 1) / files.length) * 85),
      stage: 'uploading',
    });
  }

  return results;
}

export async function deleteMedia(publicId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return false;

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

import { AppError } from './AppError';
import { logError } from './logger';

export interface NormalizeErrorOptions {
  fallbackCode?: string;
  fallbackMessage?: string;
  context?: Record<string, any>;
}

/**
 * Normalizes any caught error into a standard AppError.
 * Logs the error before returning it.
 */
export function normalizeError(err: unknown, options?: NormalizeErrorOptions): AppError {
  const fallbackCode = options?.fallbackCode || 'RATER_ERR_000';
  const fallbackMessage = options?.fallbackMessage || 'Something went wrong. Please try again.';

  let normalized: AppError;

  if (err instanceof AppError) {
    // Already normalized
    normalized = err;
  } else if (err instanceof Error) {
    // Standard JS error
    normalized = new AppError({
      code: fallbackCode,
      category: 'UNKNOWN',
      severity: 'ERROR',
      userMessage: fallbackMessage,
      technicalDetails: { originalMessage: err.message, stack: err.stack },
      retryable: true,
    });
  } else if (typeof err === 'object' && err !== null && 'message' in err) {
    // Some object with a message property (e.g. Supabase error)
    normalized = new AppError({
      code: fallbackCode,
      category: 'UNKNOWN',
      severity: 'ERROR',
      userMessage: fallbackMessage,
      technicalDetails: err,
      retryable: true,
    });
  } else {
    // Completely unknown type (string, etc)
    normalized = new AppError({
      code: fallbackCode,
      category: 'UNKNOWN',
      severity: 'ERROR',
      userMessage: fallbackMessage,
      technicalDetails: { raw: String(err) },
      retryable: true,
    });
  }

  // Automatically log all normalized errors
  logError(normalized, options?.context);

  return normalized;
}

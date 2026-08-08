import { AppError } from './AppError';

/**
 * Global abstraction for logging errors.
 * Currently pipes to console.error, but can be swapped with Sentry, LogRocket, etc.
 */
export function logError(error: Error | AppError, context?: Record<string, any>) {
  // If it's not an AppError, we still want to log it
  const isAppError = error instanceof AppError;
  
  const payload = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    ...(isAppError && {
      code: error.code,
      category: error.category,
      severity: error.severity,
      userMessage: error.userMessage,
      technicalDetails: error.technicalDetails,
    }),
    context,
    stack: error.stack,
  };

  if (isAppError && error.severity === 'INFO') {
    console.info('[App Log]:', payload);
    return;
  }
  
  if (isAppError && error.severity === 'WARNING') {
    console.warn('[App Warning]:', payload);
    return;
  }

  // Default to error
  console.error('[App Error]:', payload);
  
  // TODO: Add external analytics/logging service here in the future
}

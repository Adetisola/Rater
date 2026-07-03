/**
 * Base Service Query Handler Interface and Helper.
 * Ensures that all database and api calls across Rater are returned in a standard envelope format.
 */

export interface ServiceResponse<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Safe wrapper that executes async database promises, catching network or database-specific failures
 * and standardizing error formats.
 */
export async function safeQueryExecute<T>(
  promise: PromiseLike<{ data: T | null; error: any }>
): Promise<ServiceResponse<T>> {
  try {
    const { data, error } = await promise;
    
    if (error) {
      console.error('Database Query Failure:', error.message || error);
      return {
        ok: false,
        data: null,
        error: error.message || 'A database error occurred during execution.',
      };
    }
    
    return {
      ok: true,
      data,
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected Service Exception:', err);
    return {
      ok: false,
      data: null,
      error: err.message || 'An unexpected server error occurred.',
    };
  }
}

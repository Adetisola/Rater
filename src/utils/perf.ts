/**
 * Development-only performance measurement utility.
 * Wraps console.time and console.timeEnd to avoid polluting production logs.
 */

export const perf = {
  mark: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`[Rater Upload] ${label}`);
    }
  },
  end: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`[Rater Upload] ${label}`);
    }
  }
};

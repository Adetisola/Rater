export default function ProfileLoading() {
  return (
    <main
      className="flex-1 w-full min-h-screen bg-canvas animate-pulse"
      style={{ backgroundColor: 'var(--canvas)' }}
    >
      <div className="max-w-6xl mx-auto px-2 xs:px-6 pt-1 pb-16 md:pt-4 md:pb-24 w-full min-h-[60vh] relative">
        {/* Avatar Header Skeleton */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 lg:gap-8 mb-16 px-4">
          {/* Avatar circle */}
          <div
            className="w-30 h-30 md:w-34 md:h-34 rounded-full bg-surface-interactive shrink-0"
            style={{ backgroundColor: 'var(--skeleton-base)' }}
          />

          {/* Info */}
          <div className="flex-1 text-center md:text-left pt-2 min-w-0 w-full flex flex-col items-center md:items-start gap-3">
            {/* Display Name & Username */}
            <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 w-full">
              <div
                className="h-7 w-48 bg-surface-interactive rounded-lg"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
              <div
                className="h-4 w-28 bg-surface-interactive rounded"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
            </div>

            {/* Role */}
            <div
              className="h-5 w-36 bg-surface-interactive rounded"
              style={{ backgroundColor: 'var(--skeleton-base)' }}
            />

            {/* Bio lines */}
            <div className="w-full max-w-lg space-y-2 mt-1">
              <div
                className="h-4 w-full bg-surface-interactive rounded"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
              <div
                className="h-4 w-3/4 bg-surface-interactive rounded"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-6 mt-4">
              <div
                className="pr-6 border-r border-border-subtle flex flex-col gap-1"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div
                  className="h-7 w-12 bg-surface-interactive rounded"
                  style={{ backgroundColor: 'var(--skeleton-base)' }}
                />
                <div
                  className="h-3 w-10 bg-surface-interactive rounded"
                  style={{ backgroundColor: 'var(--skeleton-base)' }}
                />
              </div>
              <div
                className="pr-6 border-r border-border-subtle flex flex-col gap-1"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div
                  className="h-7 w-12 bg-surface-interactive rounded"
                  style={{ backgroundColor: 'var(--skeleton-base)' }}
                />
                <div
                  className="h-3 w-14 bg-surface-interactive rounded"
                  style={{ backgroundColor: 'var(--skeleton-base)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div
                  className="h-7 w-12 bg-surface-interactive rounded"
                  style={{ backgroundColor: 'var(--skeleton-base)' }}
                />
                <div
                  className="h-3 w-16 bg-surface-interactive rounded"
                  style={{ backgroundColor: 'var(--skeleton-base)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div
          className="border-b border-border-subtle mb-12 flex justify-center md:justify-start gap-8"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="h-6 w-24 bg-surface-interactive rounded mb-4"
            style={{ backgroundColor: 'var(--skeleton-base)' }}
          />
          <div
            className="h-6 w-20 bg-surface-interactive rounded mb-4"
            style={{ backgroundColor: 'var(--skeleton-base)' }}
          />
        </div>

        {/* Masonry Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-surface-primary border border-border-default p-1.5 rounded-3xl overflow-hidden"
              style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}
            >
              <div
                className="w-full aspect-4/3 bg-surface-interactive rounded-3xl mb-4"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
              <div className="px-2 pb-2 space-y-3">
                <div
                  className="h-4 w-20 bg-surface-interactive rounded-full"
                  style={{ backgroundColor: 'var(--skeleton-base)' }}
                />
                <div
                  className="h-5 w-3/4 bg-surface-interactive rounded"
                  style={{ backgroundColor: 'var(--skeleton-base)' }}
                />
                <div
                  className="h-3 w-1/2 bg-surface-interactive rounded"
                  style={{ backgroundColor: 'var(--skeleton-base)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

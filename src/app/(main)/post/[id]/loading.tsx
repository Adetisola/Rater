
export default function PostDetailLoading() {
  return (
    <main
      className="flex-1 w-full min-h-screen bg-canvas animate-pulse"
      style={{ backgroundColor: 'var(--canvas)' }}
    >
      <div className="max-w-[1200px] mx-auto px-6 pt-20">
        {/* Back button skeleton */}
        <div
          className="h-8 w-16 bg-surface-interactive rounded-full mb-8"
          style={{ backgroundColor: 'var(--skeleton-base)' }}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Main Image Block (md:col-span-7 aspect-4/3) */}
          <div className="md:col-span-7">
            <div
              className="aspect-[4/3] bg-surface-interactive rounded-3xl w-full"
              style={{ backgroundColor: 'var(--skeleton-base)' }}
            />
          </div>
          
          {/* Right Sidebar Meta (md:col-span-5) */}
          <div className="md:col-span-5 flex flex-col gap-6">
            {/* Avatar & Username */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 bg-surface-interactive rounded-full"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
              <div
                className="h-5 w-32 bg-surface-interactive rounded"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
            </div>
            
            {/* Title */}
            <div
              className="h-10 bg-surface-interactive rounded-lg w-3/4"
              style={{ backgroundColor: 'var(--skeleton-base)' }}
            />
            
            {/* Categories & Views */}
            <div className="flex gap-2">
              <div
                className="h-6 w-20 bg-surface-interactive rounded-full"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
              <div
                className="h-6 w-24 bg-surface-interactive rounded-full"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
            </div>
            
            {/* Description lines */}
            <div className="space-y-3 mt-4">
              <div
                className="h-4 bg-surface-interactive rounded w-full"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
              <div
                className="h-4 bg-surface-interactive rounded w-full"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
              <div
                className="h-4 bg-surface-interactive rounded w-5/6"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
            </div>
            
            {/* Tabs Skeleton */}
            <div
              className="flex border-b border-border-default mt-6 gap-6"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div
                className="h-8 w-24 bg-surface-interactive rounded-t-lg"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
              <div
                className="h-8 w-24 bg-surface-interactive rounded-t-lg"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
              <div
                className="h-8 w-24 bg-surface-interactive rounded-t-lg"
                style={{ backgroundColor: 'var(--skeleton-base)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

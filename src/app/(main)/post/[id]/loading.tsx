
export default function PostDetailLoading() {
  return (
    <main className="flex-1 w-full min-h-screen bg-white animate-pulse">
      <div className="max-w-[1200px] mx-auto px-6 pt-20">
        {/* Back button skeleton */}
        <div className="h-8 w-16 bg-gray-100 rounded-full mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Main Image Block (md:col-span-7 aspect-4/3) */}
          <div className="md:col-span-7">
            <div className="aspect-[4/3] bg-gray-100 rounded-3xl w-full" />
          </div>
          
          {/* Right Sidebar Meta (md:col-span-5) */}
          <div className="md:col-span-5 flex flex-col gap-6">
            {/* Avatar & Username */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full" />
              <div className="h-5 w-32 bg-gray-100 rounded" />
            </div>
            
            {/* Title */}
            <div className="h-10 bg-gray-100 rounded-lg w-3/4" />
            
            {/* Categories & Views */}
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
              <div className="h-6 w-24 bg-gray-100 rounded-full" />
            </div>
            
            {/* Description lines */}
            <div className="space-y-3 mt-4">
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>
            
            {/* Tabs Skeleton */}
            <div className="flex border-b border-gray-100 mt-6 gap-6">
              <div className="h-8 w-24 bg-gray-100 rounded-t-lg" />
              <div className="h-8 w-24 bg-gray-100 rounded-t-lg" />
              <div className="h-8 w-24 bg-gray-100 rounded-t-lg" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

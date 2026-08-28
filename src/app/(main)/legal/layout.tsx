import { LegalNav } from '@/components/legal/LegalNav';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/50 w-full overflow-x-clip">
      <div className="max-w-5xl mx-auto py-4 sm:py-12 px-4 sm:px-6 w-full">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start w-full">
          <LegalNav />
          <main className="flex-1 w-full min-w-0 break-words">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

import { LegalNav } from '@/components/legal/LegalNav';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <LegalNav />
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

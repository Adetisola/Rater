export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm prose prose-gray max-w-none">
        {children}
      </div>
    </div>
  );
}

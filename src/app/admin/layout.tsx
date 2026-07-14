export const metadata = { title: 'Admin - Rater' };
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10">
        {children}
      </main>
    </div>
  );
}

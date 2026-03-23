'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { ClassProvider } from '@/contexts/ClassContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <ClassProvider>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ClassProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    }>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}

'use client';
import UserSidebar from '@/components/UserSidebar';
import UserHeader from '@/components/UserHeader';

export default function UserLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-900">
      <UserSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <UserHeader />
        
        <main className="flex-1 overflow-auto bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
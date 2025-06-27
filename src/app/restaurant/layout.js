'use client';
import RestaurantSidebar from '@/components/RestaurantSidebar';
import RestaurantHeader from '@/components/RestaurantHeader';

export default function RestaurantLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-900">
      <RestaurantSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <RestaurantHeader />
        
        <main className="flex-1 overflow-auto bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
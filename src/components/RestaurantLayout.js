'use client';
import React from 'react';
import RestaurantHeader from './RestaurantHeader';
import RestaurantSidebar from './RestaurantSidebar';

export default function RestaurantLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <RestaurantSidebar />
      <div className="lg:ml-64">
        <RestaurantHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
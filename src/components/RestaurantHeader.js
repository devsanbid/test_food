'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, Settings, ChevronDown } from 'lucide-react';
import { logoutAction } from '@/actions/authActions';

export default function RestaurantHeader() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const router = useRouter();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAction();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/login');
    }
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders, menu items..."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-full pl-12 pr-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 ml-8">
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors duration-200">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-white">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.restaurantName || 'Restaurant Owner'}
                </div>
                <div className="text-xs text-gray-400">
                  {user?.email || 'owner@restaurant.com'}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50">
                <a
                  href="/restaurant/profile"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </a>
                <a
                  href="/restaurant/profile"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </a>
                <hr className="my-2 border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-left"
                >
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
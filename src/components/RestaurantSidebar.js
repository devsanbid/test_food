'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAction } from '@/actions/authActions';
import {
  LayoutDashboard,
  ChefHat,
  ShoppingBag,
  BarChart3,
  User,
  DollarSign,
  Star,
  Percent,
  Menu,
  X,
  LogOut
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/restaurant/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Menu Management',
    href: '/restaurant/menu',
    icon: ChefHat
  },
  {
    name: 'Orders',
    href: '/restaurant/orders',
    icon: ShoppingBag
  },
  {
    name: 'Analytics',
    href: '/restaurant/analytics',
    icon: BarChart3
  },
  {
    name: 'Profile',
    href: '/restaurant/profile',
    icon: User
  },
  {
    name: 'Payouts',
    href: '/restaurant/payouts',
    icon: DollarSign
  },
  {
    name: 'Reviews',
    href: '/restaurant/reviews',
    icon: Star
  },
  {
    name: 'Discounts',
    href: '/restaurant/discounts',
    icon: Percent
  }
];

export default function RestaurantSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
    <>
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FoodSewa</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
}
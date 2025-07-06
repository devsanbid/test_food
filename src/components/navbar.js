"use client"

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  List, 
  Users, 
  Building2, 
  ChefHat, 
  UserCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Plus,
  Edit3,
  Shield,
  LogOut
} from 'lucide-react';

import { useRouter, usePathname } from 'next/navigation';
import { logoutAction } from '@/actions/authActions';

export default function YumNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState({
    order: false,
    customer: false,
    restaurant: false,
    dishes: false,
    seller: false
  });

  const handleLogout = async () => {
    try {
      await logoutAction();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/login');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const NavItem = ({ icon: Icon, label, hasSubmenu = false, isExpanded = false, onClick, children, href }) => {
    const isActive = href && pathname === href;
    return (
      <div>
        <button
          onClick={href ? () => router.push(href) : onClick}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
            isActive ? 'bg-orange-600 text-white' : 
            isExpanded ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </div>
          {hasSubmenu && (
            isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          )}
        </button>
        {hasSubmenu && isExpanded && (
          <div className="mt-2 ml-8 space-y-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  const SubMenuItem = ({ icon: Icon, label, onClick, href }) => {
    const isActive = href && pathname === href;
    return (
      <button
        onClick={href ? () => router.push(href) : onClick}
        className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 ${
          isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
      >
        <Icon size={16} />
        <span className="text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-orange-500 font-bold text-sm">Y</span>
            </div>
          </div>
          <span className="text-2xl font-bold">Yum</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-2 flex-1 overflow-y-auto">
        {/* Dashboard */}
        <NavItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          href="/admin/dashboard"
        />

        {/* Manage */}
        <NavItem 
          icon={Settings} 
          label="Manage" 
          href="/admin/manage"
        />

        <NavItem 
          icon={Shield} 
          label="Role Management" 
          href="/admin/roles"
        />

        {/* Orders */}
        <NavItem 
          icon={List} 
          label="Orders" 
          hasSubmenu={true}
          isExpanded={expandedSections.order}
          onClick={() => toggleSection('order')}
        >
          <SubMenuItem icon={FileText} label="Order List" href="/admin/order/list" />
          <SubMenuItem icon={FileText} label="Order Detail" href="/admin/order/detail" />
        </NavItem>

        {/* Customers */}
        <NavItem 
          icon={Users} 
          label="Customer" 
          hasSubmenu={true}
          isExpanded={expandedSections.customer}
          onClick={() => toggleSection('customer')}
        >
          <SubMenuItem icon={Users} label="Customers List" href="/admin/customer" />
          <SubMenuItem icon={Plus} label="Add Customer" href="/admin/customer/add" />
        </NavItem>

        {/* Restaurants */}
        <NavItem 
          icon={Building2} 
          label="Restaurants" 
          hasSubmenu={true}
          isExpanded={expandedSections.restaurant}
          onClick={() => toggleSection('restaurant')}
        >
          <SubMenuItem icon={Building2} label="Restaurant List" href="/admin/restaurant/list" />
          <SubMenuItem icon={Building2} label="Restaurant Details" href="/admin/restaurant/details" />
          <SubMenuItem icon={Plus} label="Add Restaurant" href="/admin/restaurant/add" />
          <SubMenuItem icon={Edit3} label="Edit Restaurant" href="/admin/restaurant/edit" />
        </NavItem>

        {/* Dishes */}
        <NavItem 
          icon={ChefHat} 
          label="Dishes" 
          hasSubmenu={true}
          isExpanded={expandedSections.dishes}
          onClick={() => toggleSection('dishes')}
        >
          <SubMenuItem icon={ChefHat} label="Dishes List" href="/admin/dishes/list" />
          <SubMenuItem icon={ChefHat} label="Dish Details" href="/admin/dishes/details" />
          <SubMenuItem icon={Plus} label="Add Dish" href="/admin/dishes/add" />
          <SubMenuItem icon={Edit3} label="Edit Dish" href="/admin/dishes/edit" />
        </NavItem>

        {/* Sellers */}
        <NavItem 
          icon={UserCheck} 
          label="Seller" 
          hasSubmenu={true}
          isExpanded={expandedSections.seller}
          onClick={() => toggleSection('seller')}
        >
          <SubMenuItem icon={UserCheck} label="Sellers List" href="/admin/seller" />
          <SubMenuItem icon={Plus} label="Add Seller" href="/admin/seller/add" />
        </NavItem>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 text-red-400 hover:bg-red-600 hover:text-white"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
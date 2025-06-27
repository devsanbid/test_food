"use client"

import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  Maximize2, 
  Bell, 
  ChevronDown, 
  Menu,
  Package,
  Users,
  UtensilsCrossed,
  UserPlus,
  Wallet,
  FileText,
  Zap,
  User,
  LogOut,
  Phone
} from 'lucide-react';

export default function AddCustomerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: 'demoexample@mail.com',
    phone: '+1-123-XXX-4567',
    country: '',
    state: '',
    zipCode: '',
    description: 'Jot something down..'
  });

  const [dropdowns, setDropdowns] = useState({
    orders: false,
    customers: false,
    restaurants: false,
    dishes: false,
    sellers: false,
    extraPages: false,
    country: false,
    state: false,
    zipCode: false
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleDropdown = (dropdown) => {
    setDropdowns(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Customer saved successfully!');
  };

  const handleClear = () => {
    setFormData({
      firstName: '',
      lastName: '',
      userName: '',
      email: '',
      phone: '',
      country: '',
      state: '',
      zipCode: '',
      description: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
     

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search for items..."
                  className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-white">
                <Globe className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white">
                <Maximize2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">KB</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">Kaiya Botosh</p>
                  <p className="text-xs text-gray-400">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
            <span>Customers</span>
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            <span className="text-orange-500">Add Customer</span>
          </div>

          {/* Page Title */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Add Customer</h1>
          </div>

          {/* Form */}
          <div className="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter Your First Name"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter Your Last Name"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* User Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">User Name</label>
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  placeholder="Enter Your Last Name"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Country/Region */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Country/Region</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('country')}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-left text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between"
                  >
                    <span>Select...</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdowns.country ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdowns.country && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                      <button type="button" className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">United States</button>
                      <button type="button" className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">Canada</button>
                      <button type="button" className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">United Kingdom</button>
                    </div>
                  )}
                </div>
              </div>

              {/* State/Province */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State/Province</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('state')}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-left text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between"
                  >
                    <span>Select...</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdowns.state ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdowns.state && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                      <button type="button" className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">California</button>
                      <button type="button" className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">New York</button>
                      <button type="button" className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">Texas</button>
                    </div>
                  )}
                </div>
              </div>

              {/* ZIP/Postal Code */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ZIP/Postal Code</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('zipCode')}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-left text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between"
                  >
                    <span>Select...</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdowns.zipCode ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdowns.zipCode && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                      <button type="button" className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">90210</button>
                      <button type="button" className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">10001</button>
                      <button type="button" className="w-full px-4 py-2 text-left text-white hover:bg-gray-700">73301</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-center text-gray-400 text-sm">
              Designed, crafted and coded with ❤️ by Coderthemes.com
            </p>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
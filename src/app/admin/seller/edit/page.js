"use client"

import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  Maximize, 
  Bell, 
  ChevronDown, 
  ChevronUp,
  Users,
  User,
  UserPlus,
  Edit3,
  Wallet,
  FileText,
  Shield,
  AlertCircle,
  Layers,
  BarChart3,
  Zap,
  Phone,
  LogOut,
  X,
  Save
} from 'lucide-react';

export default function YumSellerEdit() {
  const [selectedCountry, setSelectedCountry] = useState('Select...');
  const [selectedState, setSelectedState] = useState('Select...');
  const [selectedZip, setSelectedZip] = useState('Select...');
  const [sellersExpanded, setSellersExpanded] = useState(true);
  const [extraPagesExpanded, setExtraPagesExpanded] = useState(false);
  const [authExpanded, setAuthExpanded] = useState(false);
  const [errorPagesExpanded, setErrorPagesExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">Y</span>
            </div>
            <span className="text-xl font-bold">Yum</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          {/* Sellers Section */}
          <div>
            <button 
              onClick={() => setSellersExpanded(!sellersExpanded)}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Users size={18} />
                <span>Sellers</span>
              </div>
              {sellersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {sellersExpanded && (
              <div className="ml-6 mt-2 space-y-1">
                <div className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">Sellers List</span>
                </div>
                <div className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">Seller Details</span>
                </div>
                <div className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">Add Seller</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-orange-600 rounded text-white">
                  <div className="w-1 h-1 bg-orange-300 rounded-full"></div>
                  <span className="text-sm">Edit Seller</span>
                </div>
              </div>
            )}
          </div>

          {/* Wallet */}
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 transition-colors">
            <Wallet size={18} />
            <span>Wallet</span>
          </div>

          {/* Extra Pages */}
          <div>
            <button 
              onClick={() => setExtraPagesExpanded(!extraPagesExpanded)}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <FileText size={18} />
                <span>Extra Pages</span>
              </div>
              {extraPagesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Authentication */}
          <div>
            <button 
              onClick={() => setAuthExpanded(!authExpanded)}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Shield size={18} />
                <span>Authentication</span>
              </div>
              {authExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Error Pages */}
          <div>
            <button 
              onClick={() => setErrorPagesExpanded(!errorPagesExpanded)}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle size={18} />
                <span>Error Pages</span>
              </div>
              {errorPagesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* UI Elements */}
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 transition-colors">
            <Layers size={18} />
            <span>UI Elements</span>
          </div>

          {/* Widget */}
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 transition-colors">
            <BarChart3 size={18} />
            <span>Widget</span>
          </div>
        </div>


        {/* Profile */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 transition-colors">
            <User size={18} />
            <span>Profile</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 transition-colors text-red-400">
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search for items..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <Globe className="text-gray-400 hover:text-white cursor-pointer" size={20} />
              <Maximize className="text-gray-400 hover:text-white cursor-pointer" size={20} />
              <div className="relative">
                <Bell className="text-gray-400 hover:text-white cursor-pointer" size={20} />
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">2</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm">KB</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Kalya Botosh</div>
                  <div className="text-xs text-gray-400">Admin</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Edit Seller</h1>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400">Seller</span>
              <ChevronDown className="text-gray-400" size={16} />
              <span className="text-orange-500">Edit Seller</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl">
            <div className="grid grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input 
                  type="text" 
                  defaultValue="Gustavo"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input 
                  type="text" 
                  defaultValue="Philips"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* User Name */}
              <div>
                <label className="block text-sm font-medium mb-2">User Name</label>
                <input 
                  type="text" 
                  defaultValue="gustavophilips07"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  defaultValue="gustavophilips07@mail.com"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input 
                  type="text" 
                  defaultValue="877855658"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Country/Region */}
              <div>
                <label className="block text-sm font-medium mb-2">Country/Region</label>
                <div className="relative">
                  <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 appearance-none">
                    <option>Select...</option>
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              {/* State/Province */}
              <div>
                <label className="block text-sm font-medium mb-2">State/Province</label>
                <div className="relative">
                  <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 appearance-none">
                    <option>Select...</option>
                    <option>California</option>
                    <option>New York</option>
                    <option>Texas</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              {/* ZIP/Postal Code */}
              <div>
                <label className="block text-sm font-medium mb-2">ZIP/Postal Code</label>
                <div className="relative">
                  <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 appearance-none">
                    <option>Select...</option>
                    <option>90210</option>
                    <option>10001</option>
                    <option>73301</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea 
                rows={4}
                defaultValue="Hi, I'm Kalya Botosh, it has been the industry's standard dummy text since the 1500s when an unknown printer took a galley of type."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              <button className="flex items-center space-x-2 px-6 py-3 border border-gray-600 rounded-lg text-white hover:bg-gray-800 transition-colors">
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button className="flex items-center space-x-2 px-6 py-3 bg-orange-500 rounded-lg text-white hover:bg-orange-600 transition-colors">
                <Save size={16} />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t border-gray-700 p-4 text-center">
          <p className="text-sm text-gray-400">
            Designed, crafted and coded with ❤️ by Coderthemes.com
          </p>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <button className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-lg">
            <ChevronUp size={20} />
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="fixed bottom-6 right-20">
          <button className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-lg">
            <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
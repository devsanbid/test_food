"use client"
import React, { useState } from 'react';
import { 
  ChevronDown, 
  User, 
  Plus, 
  Edit3, 
  Utensils, 
  Users, 
  Wallet, 
  FileText, 
  Shield, 
  AlertCircle, 
  Zap, 
  Smartphone, 
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Globe,
  Maximize2
} from 'lucide-react';

export default function RestaurantEditPage() {
  const [activeTab, setActiveTab] = useState('Personal Detail');
  const [sidebarItems, setSidebarItems] = useState({
    dishes: false,
    sellers: false,
    extraPages: false,
    authentication: false,
    errorPages: false,
    icons: false,
    forms: false
  });

  const toggleSidebar = (item) => {
    setSidebarItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const tabs = ['Personal Detail', 'Business Detail', 'Bank Detail'];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Yum</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <FileText className="w-5 h-5" />
            <span>Restaurant Details</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <Plus className="w-5 h-5" />
            <span>Add Restaurant</span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-orange-500 rounded-lg cursor-pointer">
            <Edit3 className="w-5 h-5" />
            <span>Edit Restaurant</span>
          </div>

          {/* Expandable Items */}
          <div>
            <div 
              className="flex items-center justify-between p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer"
              onClick={() => toggleSidebar('dishes')}
            >
              <div className="flex items-center space-x-3">
                <Utensils className="w-5 h-5" />
                <span>Dishes</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarItems.dishes ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div>
            <div 
              className="flex items-center justify-between p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer"
              onClick={() => toggleSidebar('sellers')}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5" />
                <span>Sellers</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarItems.sellers ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <Wallet className="w-5 h-5" />
            <span>Wallet</span>
          </div>

          <div>
            <div 
              className="flex items-center justify-between p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer"
              onClick={() => toggleSidebar('extraPages')}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5" />
                <span>Extra Pages</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarItems.extraPages ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div>
            <div 
              className="flex items-center justify-between p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer"
              onClick={() => toggleSidebar('authentication')}
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5" />
                <span>Authentication</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarItems.authentication ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div>
            <div 
              className="flex items-center justify-between p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer"
              onClick={() => toggleSidebar('errorPages')}
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5" />
                <span>Error Pages</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarItems.errorPages ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <BarChart3 className="w-5 h-5" />
            <span>UI Elements</span>
          </div>

          <div className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <Smartphone className="w-5 h-5" />
            <span>Widget</span>
          </div>

          <div>
            <div 
              className="flex items-center justify-between p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer"
              onClick={() => toggleSidebar('icons')}
            >
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5" />
                <span>Icons</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarItems.icons ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div>
            <div 
              className="flex items-center justify-between p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer"
              onClick={() => toggleSidebar('forms')}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5" />
                <span>Forms</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarItems.forms ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </nav>

        {/* Upgrade Section */}
        <div className="p-4 m-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-white" />
            <span className="text-sm font-medium">Upgrade your Plan. Find Out here</span>
          </div>
          <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors">
            Contact Support
          </button>
        </div>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </div>
          <div className="flex items-center space-x-3 p-3 text-red-400 hover:bg-slate-700 rounded-lg cursor-pointer">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-slate-800 p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for items..."
                  className="bg-slate-700 text-white placeholder-slate-400 px-4 py-2 pl-10 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="absolute left-3 top-2.5">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Globe className="w-6 h-6 text-slate-400 cursor-pointer" />
              <Maximize2 className="w-6 h-6 text-slate-400 cursor-pointer" />
              <div className="relative">
                <Bell className="w-6 h-6 text-slate-400 cursor-pointer" />
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">KB</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Kaiya Botosh</div>
                  <div className="text-xs text-slate-400">Admin</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-slate-400 mb-4">
              <span>Restaurants</span>
              <ChevronDown className="w-4 h-4 rotate-270" />
              <span className="text-orange-500">Edit Restaurant</span>
            </div>
            <h1 className="text-2xl font-bold">Edit Restaurant</h1>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-slate-800 rounded-lg p-8">
            {/* Personal Detail Form */}
            {activeTab === 'Personal Detail' && (
              <>
                <h2 className="text-lg font-semibold mb-6">Step 1:</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue="Kianna"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue="Vetrovs"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Number</label>
                    <input
                      type="text"
                      defaultValue="9876343281"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">PAN Card Number</label>
                    <input
                      type="text"
                      defaultValue="KGX5793RSD"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="kianna.vetrov@mail.com"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Birth of Date</label>
                    <input
                      type="text"
                      defaultValue="12/09/2000"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <div className="relative">
                      <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none">
                        <option>Select...</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Country/Region</label>
                    <div className="relative">
                      <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none">
                        <option>Select...</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ZIP/Postal Code</label>
                    <div className="relative">
                      <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none">
                        <option>Select...</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    rows={6}
                    defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>
              </>
            )}

            {/* Business Detail Form */}
            {activeTab === 'Business Detail' && (
              <>
                <h2 className="text-lg font-semibold mb-6">Step 2:</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Name</label>
                    <input
                      type="text"
                      defaultValue="Healthy Feast Corner"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Type</label>
                    <input
                      type="text"
                      defaultValue="Partnership"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Number</label>
                    <input
                      type="text"
                      defaultValue="7465782356"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">GST Number</label>
                    <input
                      type="text"
                      defaultValue="GYOSTR472"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="text"
                      defaultValue="http://healthyfeastcorner.com"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="kianna.vetrov@mail.com"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    rows={6}
                    defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>
              </>
            )}

            {/* Bank Detail Form */}
            {activeTab === 'Bank Detail' && (
              <>
                <h2 className="text-lg font-semibold mb-6">Step 3:</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bank Name</label>
                    <input
                      type="text"
                      defaultValue="National Bank of Canada"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Branch</label>
                    <input
                      type="text"
                      defaultValue="Alberta"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    defaultValue="Kianna Vetrovs"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Number</label>
                    <input
                      type="text"
                      defaultValue="378282246310005"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">IFSC Code</label>
                    <input
                      type="text"
                      defaultValue="BOFA0MM6205"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-slate-400 border-t border-slate-700">
          Designed, crafted and coded with ❤️ by Coderthemes.com
        </footer>
      </div>
    </div>
  );
}
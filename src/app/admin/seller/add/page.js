"use client"

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function YumAdminDashboard() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: 'demoexample@mail.com',
    phone: '+1-123-XXX-4567',
    country: '',
    state: '',
    zip: '',
    description: 'Jot something down...'
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleClear = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      country: '',
      state: '',
      zip: '',
      description: ''
    });
  };

  const handleSave = () => {
    console.log('Saving seller data:', formData);
  };

  return (
    <div className="text-white">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 min-h-screen border-r border-slate-700">
          <nav className="p-4 space-y-2">
            {/* Sellers Section */}
            <div>
              <div className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Sellers</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </div>
              <div className="ml-6 space-y-1">
                <div className="text-slate-400 hover:text-white cursor-pointer py-1 text-sm">• Sellers List</div>
                <div className="text-slate-400 hover:text-white cursor-pointer py-1 text-sm">• Seller Details</div>
                <div className="text-orange-500 cursor-pointer py-1 text-sm bg-slate-700 px-2 rounded">• Add Seller</div>
                <div className="text-slate-400 hover:text-white cursor-pointer py-1 text-sm">• Edit Seller</div>
              </div>
            </div>

            {/* Other Menu Items */}
            <div className="flex items-center space-x-2 text-slate-400 hover:text-white cursor-pointer py-2">
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </div>

            <div className="flex items-center justify-between text-slate-400 hover:text-white cursor-pointer py-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Extra Pages</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>

            <div className="flex items-center justify-between text-slate-400 hover:text-white cursor-pointer py-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Authentication</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>

            <div className="flex items-center justify-between text-slate-400 hover:text-white cursor-pointer py-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>Error Pages</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>

            <div className="flex items-center space-x-2 text-slate-400 hover:text-white cursor-pointer py-2">
              <Grid3X3 className="w-4 h-4" />
              <span>UI Elements</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-400 hover:text-white cursor-pointer py-2">
              <Grid3X3 className="w-4 h-4" />
              <span>Widget</span>
            </div>
          </nav>

          {/* Upgrade Section */}
          <div className="m-4 p-4 bg-slate-700 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-lg mb-3 mx-auto">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm text-slate-300 mb-2">
              🔥 Upgrade Your Plan. Find Out here
            </div>
            <button className="text-orange-500 text-sm hover:underline">
              Contact Support
            </button>
          </div>

          {/* Bottom Menu */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <div className="flex items-center space-x-2 text-slate-400 hover:text-white cursor-pointer py-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </div>
            <div className="flex items-center space-x-2 text-red-400 hover:text-red-300 cursor-pointer py-2">
              <ArrowUp className="w-4 h-4 rotate-45" />
              <span>Logout</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Add Seller</h1>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span>Sellers</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-orange-500">Add Seller</span>
            </div>
          </div>

          {/* Form */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="grid grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter Your First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter Your Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* User Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  User Name
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter Your Last Name"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Country/Region */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Country/Region
                </label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                  >
                    <option value="">Select...</option>
                    <option value="us">United States</option>
                    <option value="ca">Canada</option>
                    <option value="uk">United Kingdom</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* State/Province */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  State/Province
                </label>
                <div className="relative">
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                  >
                    <option value="">Select...</option>
                    <option value="ca">California</option>
                    <option value="ny">New York</option>
                    <option value="tx">Texas</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* ZIP/Postal Code */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ZIP/Postal Code
                </label>
                <div className="relative">
                  <select
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                  >
                    <option value="">Select...</option>
                    <option value="12345">12345</option>
                    <option value="67890">67890</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-400 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={handleClear}
                className="flex items-center space-x-2 px-6 py-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Clear</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-lg text-white transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-400">
            Designed, crafted and coded with ❤️ by Coderthemes.com
          </div>
        </main>
      {/* Theme Toggle Button */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors">
        <Sun className="w-6 h-6" />
      </button>

      {/* Scroll to Top Button */}
      <button className="fixed bottom-24 right-6 w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors">
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Phone,
  RotateCcw
} from 'lucide-react';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    zipCode: '',
    description: '',
    role: 'user',
    isActive: true,
    isVerified: false
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

  useEffect(() => {
    if (params.id) {
      fetchCustomerData();
    }
  }, [params.id]);

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        const customer = data.customer;
        setFormData({
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          userName: customer.username || '',
          email: customer.email || '',
          phone: customer.phone || '',
          country: customer.address?.country || '',
          state: customer.address?.state || '',
          zipCode: customer.address?.zipCode || '',
          description: customer.description || '',
          role: customer.role || 'user',
          isActive: customer.isActive,
          isVerified: customer.isVerified
        });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/admin/customers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.userName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          isActive: formData.isActive,
          isVerified: formData.isVerified,
          address: {
            country: formData.country,
            state: formData.state,
            zipCode: formData.zipCode
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Customer updated successfully!');
        router.push('/admin/customer');
      } else {
        alert(data.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer');
    }
  };

  const handleCancel = () => {
    router.push('/admin/customer');
  };

  const selectDropdownOption = (dropdown, value) => {
    setFormData(prev => ({
      ...prev,
      [dropdown]: value
    }));
    setDropdowns(prev => ({
      ...prev,
      [dropdown]: false
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
     

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
      

        {/* Page Content */}
        <main className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
            <span>Customers</span>
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            <span className="text-orange-500">Edit Customer</span>
          </div>

          {/* Page Title */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Edit Customer</h1>
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
                    <span>{formData.country || 'Select...'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdowns.country ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdowns.country && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                      <button 
                        type="button" 
                        onClick={() => selectDropdownOption('country', 'United States')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                      >
                        United States
                      </button>
                      <button 
                        type="button" 
                        onClick={() => selectDropdownOption('country', 'Canada')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                      >
                        Canada
                      </button>
                      <button 
                        type="button" 
                        onClick={() => selectDropdownOption('country', 'United Kingdom')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                      >
                        United Kingdom
                      </button>
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
                    <span>{formData.state || 'Select...'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdowns.state ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdowns.state && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                      <button 
                        type="button" 
                        onClick={() => selectDropdownOption('state', 'California')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                      >
                        California
                      </button>
                      <button 
                        type="button" 
                        onClick={() => selectDropdownOption('state', 'New York')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                      >
                        New York
                      </button>
                      <button 
                        type="button" 
                        onClick={() => selectDropdownOption('state', 'Texas')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                      >
                        Texas
                      </button>
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
                    <span>{formData.zipCode || 'Select...'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdowns.zipCode ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdowns.zipCode && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                      <button 
                        type="button" 
                        onClick={() => selectDropdownOption('zipCode', '90210')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                      >
                        90210
                      </button>
                      <button 
                        type="button" 
                        onClick={() => selectDropdownOption('zipCode', '10001')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                      >
                        10001
                      </button>
                      <button 
                        type="button" 
                        onClick={() => selectDropdownOption('zipCode', '73301')}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                      >
                        73301
                      </button>
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
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cancel</span>
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
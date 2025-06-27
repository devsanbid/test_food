"use client"
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/authActions';
import { 
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  MapPin,
  Phone,
  Mail,
  Building,
  CreditCard,
  User,
  Globe
} from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      {message}
    </div>
  );
};

export default function RestaurantForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    ownerId: '',
    name: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    cuisineTypes: [],
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    latitude: '',
    longitude: '',
    firstName: '',
    lastName: '',
    ownerEmail: '',
    dateOfBirth: '',
    nationalId: '',
    registrationNumber: '',
    taxId: '',
    businessType: '',
    establishedDate: '',
    operatingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false },
      sunday: { open: '09:00', close: '22:00', closed: false }
    },
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    routingNumber: '',
    commissionRate: '',
    minimumOrderAmount: '',
    isActive: true,
    acceptsOnlineOrders: true,
    hasDelivery: true,
    hasPickup: true,
    deliveryFee: '',
    deliveryRadius: ''
  });
  const [restaurantAccounts, setRestaurantAccounts] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || user.role !== 'admin') {
        router.push('/login');
        return false;
      }
      return true;
    } catch (error) {
      router.push('/login');
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCuisineToggle = (cuisine) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }));
  };

  const handleOpeningHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic Information validation
    if (!formData.name.trim()) newErrors.name = 'Restaurant name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!formData.ownerEmail.trim()) newErrors.ownerEmail = 'Owner email is required';
    if (!formData.ownerPhone.trim()) newErrors.ownerPhone = 'Owner phone is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.ownerEmail && !emailRegex.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Restaurant added successfully!');
        setTimeout(() => {
          router.push('/admin/restaurant/list');
        }, 2000);
      } else {
        showToast(data.message || 'Failed to add restaurant', 'error');
      }
    } catch (error) {
      console.error('Error adding restaurant:', error);
      showToast('Failed to add restaurant', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchRestaurantAccounts();
  }, []);

  const fetchRestaurantAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users?role=restaurant', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRestaurantAccounts(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching restaurant accounts:', error);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: Building },
    { id: 'address', label: 'Address & Contact', icon: MapPin },
    { id: 'owner', label: 'Owner Information', icon: User },
    { id: 'business', label: 'Business Details', icon: Globe },
    { id: 'financial', label: 'Financial Information', icon: CreditCard }
  ];

  const cuisineOptions = [
    'Italian', 'Chinese', 'Indian', 'Mexican', 'Thai', 'Japanese',
    'American', 'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Greek'
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/restaurant/list')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Restaurants
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Add New Restaurant</h1>
            <p className="text-gray-400 mt-1">Create a new restaurant profile</p>
          </div>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tab Navigation */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-1">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-400">Loading...</span>
              </div>
            )}

            {!loading && (
              <>
                {/* Basic Information Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4">Restaurant Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Restaurant Name *</label>
                        <input
                          type="text"
                          placeholder="Enter restaurant name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.name ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.email ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Website</label>
                        <input
                          type="url"
                          placeholder="https://example.com"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        placeholder="Enter restaurant description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Cuisine Types</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {cuisineOptions.map((cuisine) => (
                          <label key={cuisine} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.cuisineTypes.includes(cuisine)}
                              onChange={() => handleCuisineToggle(cuisine)}
                              className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm">{cuisine}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Information Tab */}
                {activeTab === 'address' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4">Restaurant Address</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Street Address *</label>
                        <input
                          type="text"
                          placeholder="Enter street address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.address ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">City *</label>
                        <input
                          type="text"
                          placeholder="Enter city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.city ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">State/Province</label>
                        <input
                          type="text"
                          placeholder="Enter state or province"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">ZIP/Postal Code</label>
                        <input
                          type="text"
                          placeholder="Enter ZIP code"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Country *</label>
                        <select
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.country ? 'border-red-500' : 'border-gray-600'
                          }`}
                        >
                          <option value="">Select Country</option>
                          <option value="Nepal">Nepal</option>
                          <option value="India">India</option>
                          <option value="USA">USA</option>
                          <option value="UK">UK</option>
                        </select>
                        {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="Enter latitude"
                          value={formData.address.latitude}
                          onChange={(e) => handleInputChange('address.latitude', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="Enter longitude"
                          value={formData.address.longitude}
                          onChange={(e) => handleInputChange('address.longitude', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Owner Information Tab */}
                {activeTab === 'owner' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4">Owner Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Restaurant Account Owner *</label>
                        <select
                          value={formData.ownerId || ''}
                          onChange={(e) => handleInputChange('ownerId', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.ownerId ? 'border-red-500' : 'border-gray-600'
                          }`}
                        >
                          <option value="">Select Restaurant Account Owner</option>
                          {restaurantAccounts.map((account) => (
                            <option key={account._id} value={account._id}>
                              {account.name} ({account.email})
                            </option>
                          ))}
                        </select>
                        {errors.ownerId && <p className="text-red-500 text-sm mt-1">{errors.ownerId}</p>}
                        <p className="text-gray-400 text-sm mt-1">Select the restaurant account that will own this restaurant profile</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">First Name *</label>
                        <input
                          type="text"
                          placeholder="Enter first name"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.firstName ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Last Name *</label>
                        <input
                          type="text"
                          placeholder="Enter last name"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.lastName ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={formData.ownerEmail}
                          onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.ownerEmail ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.ownerEmail && <p className="text-red-500 text-sm mt-1">{errors.ownerEmail}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">National ID/PAN</label>
                        <input
                          type="text"
                          placeholder="Enter national ID or PAN"
                          value={formData.nationalId}
                          onChange={(e) => handleInputChange('nationalId', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Information Tab */}
                {activeTab === 'business' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4">Business Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Business Registration Number</label>
                        <input
                          type="text"
                          placeholder="Enter registration number"
                          value={formData.registrationNumber}
                          onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Tax ID/GST Number</label>
                        <input
                          type="text"
                          placeholder="Enter tax ID or GST number"
                          value={formData.taxId}
                          onChange={(e) => handleInputChange('taxId', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Business Type</label>
                        <select
                          value={formData.businessType}
                          onChange={(e) => handleInputChange('businessType', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Select Business Type</option>
                          <option value="sole_proprietorship">Sole Proprietorship</option>
                          <option value="partnership">Partnership</option>
                          <option value="corporation">Corporation</option>
                          <option value="llc">LLC</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Established Date</label>
                        <input
                          type="date"
                          value={formData.establishedDate}
                          onChange={(e) => handleInputChange('establishedDate', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Operating Hours</label>
                      <div className="space-y-3">
                        {Object.entries(formData.operatingHours).map(([day, hours]) => (
                          <div key={day} className="flex items-center space-x-4">
                            <div className="w-20 text-sm capitalize">{day}</div>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={hours.closed}
                                onChange={(e) => handleOpeningHoursChange(day, 'closed', e.target.checked)}
                                className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-400">Closed</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Information Tab */}
                {activeTab === 'financial' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4">Banking & Financial Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Bank Name</label>
                        <input
                          type="text"
                          placeholder="Enter bank name"
                          value={formData.bankName}
                          onChange={(e) => handleInputChange('bankName', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Account Number</label>
                        <input
                          type="text"
                          placeholder="Enter account number"
                          value={formData.accountNumber}
                          onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Account Holder Name</label>
                        <input
                          type="text"
                          placeholder="Enter account holder name"
                          value={formData.accountHolderName}
                          onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Routing Number/IFSC</label>
                        <input
                          type="text"
                          placeholder="Enter routing number or IFSC"
                          value={formData.routingNumber}
                          onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Commission Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="Enter commission rate"
                          value={formData.commissionRate}
                          onChange={(e) => handleInputChange('commissionRate', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Minimum Order Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Enter minimum order amount"
                          value={formData.minimumOrderAmount}
                          onChange={(e) => handleInputChange('minimumOrderAmount', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4">Restaurant Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium">Active Status</h4>
                          <p className="text-sm text-gray-400">Enable or disable the restaurant</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => handleInputChange('isActive', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium">Accept Online Orders</h4>
                          <p className="text-sm text-gray-400">Allow customers to place orders online</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.acceptsOnlineOrders}
                            onChange={(e) => handleInputChange('acceptsOnlineOrders', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium">Delivery Available</h4>
                          <p className="text-sm text-gray-400">Offer delivery services</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.hasDelivery}
                            onChange={(e) => handleInputChange('hasDelivery', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium">Pickup Available</h4>
                          <p className="text-sm text-gray-400">Allow customers to pickup orders</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.hasPickup}
                            onChange={(e) => handleInputChange('hasPickup', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      {formData.hasDelivery && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Delivery Fee</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Enter delivery fee"
                              value={formData.deliveryFee}
                              onChange={(e) => handleInputChange('deliveryFee', e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Delivery Radius (km)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="Enter delivery radius"
                              value={formData.deliveryRadius}
                              onChange={(e) => handleInputChange('deliveryRadius', e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ownerId: '',
                        name: '',
                        email: '',
                        phone: '',
                        website: '',
                        description: '',
                        cuisineTypes: [],
                        address: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        country: '',
                        latitude: '',
                        longitude: '',
                        firstName: '',
                        lastName: '',
                        ownerEmail: '',
                        dateOfBirth: '',
                        nationalId: '',
                        registrationNumber: '',
                        taxId: '',
                        businessType: '',
                        establishedDate: '',
                        operatingHours: {
                          monday: { open: '09:00', close: '22:00', closed: false },
                          tuesday: { open: '09:00', close: '22:00', closed: false },
                          wednesday: { open: '09:00', close: '22:00', closed: false },
                          thursday: { open: '09:00', close: '22:00', closed: false },
                          friday: { open: '09:00', close: '22:00', closed: false },
                          saturday: { open: '09:00', close: '22:00', closed: false },
                          sunday: { open: '09:00', close: '22:00', closed: false }
                        },
                        bankName: '',
                        accountNumber: '',
                        accountHolderName: '',
                        routingNumber: '',
                        commissionRate: '',
                        minimumOrderAmount: '',
                        isActive: true,
                        acceptsOnlineOrders: true,
                        hasDelivery: true,
                        hasPickup: true,
                        deliveryFee: '',
                        deliveryRadius: ''
                      });
                      setErrors({});
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Form</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Saving...' : 'Save Restaurant'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
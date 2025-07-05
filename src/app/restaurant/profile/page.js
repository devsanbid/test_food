'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Maximize2,
  ArrowLeft,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  Building,
  CreditCard,
  Clock,
  CheckCircle
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

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

export default function RestaurantProfile() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    priceRange: '$',
    deliveryFee: 0,
    minimumOrderAmount: 0,
    deliveryRadius: 0,
    isActive: true,
    acceptsOnlineOrders: true,
    hasDelivery: true,
    hasPickup: true,
    operatingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '23:00', closed: false },
      saturday: { open: '09:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false }
    },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: ''
    }
  });

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: Building },
    { id: 'location', name: 'Location', icon: MapPin },
    { id: 'hours', name: 'Operating Hours', icon: Clock },
    { id: 'bank', name: 'Bank Details', icon: CreditCard }
  ];

  const cuisineTypes = [
    'Italian', 'Chinese', 'Indian', 'Mexican', 'American', 'Japanese', 
    'Thai', 'French', 'Mediterranean', 'Korean', 'Vietnamese', 'Other'
  ];

  const priceRanges = [
    { value: '$', label: '$ - Budget Friendly' },
    { value: '$$', label: '$$ - Moderate' },
    { value: '$$$', label: '$$$ - Expensive' },
    { value: '$$$$', label: '$$$$ - Fine Dining' }
  ];

  useEffect(() => {
    const initializePage = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'restaurant') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        await fetchRestaurantDetails();
      } catch (error) {
        console.error('Error initializing page:', error);
        router.push('/login');
      }
    };

    initializePage();
  }, [router]);

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/restaurant/profile', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRestaurant(data.restaurant);
        setFormData({
          name: data.restaurant.name || '',
          description: data.restaurant.description || '',
          cuisine: data.restaurant.cuisine || '',
          address: data.restaurant.address || '',
          city: data.restaurant.city || '',
          state: data.restaurant.state || '',
          zipCode: data.restaurant.zipCode || '',
          country: data.restaurant.country || '',
          phone: data.restaurant.phone || '',
          email: data.restaurant.email || '',
          website: data.restaurant.website || '',
          priceRange: data.restaurant.priceRange || '$',
          deliveryFee: data.restaurant.deliveryFee || 0,
          minimumOrderAmount: data.restaurant.minimumOrderAmount || 0,
          deliveryRadius: data.restaurant.deliveryRadius || 0,
          isActive: data.restaurant.isActive !== undefined ? data.restaurant.isActive : true,
          acceptsOnlineOrders: data.restaurant.acceptsOnlineOrders !== undefined ? data.restaurant.acceptsOnlineOrders : true,
          hasDelivery: data.restaurant.hasDelivery !== undefined ? data.restaurant.hasDelivery : true,
          hasPickup: data.restaurant.hasPickup !== undefined ? data.restaurant.hasPickup : true,
          operatingHours: data.restaurant.operatingHours || formData.operatingHours,
          bankDetails: data.restaurant.bankDetails || formData.bankDetails
        });
      } else {
        console.error('Failed to fetch restaurant details:', data.message);
        setToast({ show: true, message: data.message || 'Failed to load restaurant details', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      setToast({ show: true, message: 'Error loading restaurant details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNestedInputChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Restaurant name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setToast({ show: true, message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/restaurant/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setToast({ show: true, message: 'Restaurant profile updated successfully!', type: 'success' });
        await fetchRestaurantDetails();
      } else {
        setToast({ show: true, message: data.message || 'Failed to update restaurant', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      setToast({ show: true, message: 'Error updating restaurant profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Restaurant Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 ${
              errors.name ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter restaurant name"
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cuisine Type
          </label>
          <select
            value={formData.cuisine}
            onChange={(e) => handleInputChange('cuisine', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            <option value="">Select cuisine type</option>
            {cuisineTypes.map(cuisine => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 ${
              errors.email ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter email address"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 ${
              errors.phone ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter phone number"
          />
          {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="https://yourrestaurant.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Price Range
          </label>
          <select
            value={formData.priceRange}
            onChange={(e) => handleInputChange('priceRange', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            {priceRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
          placeholder="Describe your restaurant..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Delivery Fee ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.deliveryFee}
            onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minimum Order ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.minimumOrderAmount}
            onChange={(e) => handleInputChange('minimumOrderAmount', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Delivery Radius (miles)
          </label>
          <input
            type="number"
            min="0"
            value={formData.deliveryRadius}
            onChange={(e) => handleInputChange('deliveryRadius', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
            Restaurant is Active
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasDelivery"
            checked={formData.hasDelivery}
            onChange={(e) => handleInputChange('hasDelivery', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
          />
          <label htmlFor="hasDelivery" className="ml-2 block text-sm text-gray-300">
            Offers Delivery
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasPickup"
            checked={formData.hasPickup}
            onChange={(e) => handleInputChange('hasPickup', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
          />
          <label htmlFor="hasPickup" className="ml-2 block text-sm text-gray-300">
            Offers Pickup
          </label>
        </div>
      </div>
    </div>
  );

  const renderLocationInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Street Address *
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className={`w-full px-3 py-2 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 ${
            errors.address ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="Enter street address"
        />
        {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 ${
              errors.city ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter city"
          />
          {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            State
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter state"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter ZIP code"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Country
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter country"
          />
        </div>
      </div>
    </div>
  );

  const renderOperatingHours = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-white">Operating Hours</h3>
      <div className="space-y-4">
        {Object.entries(formData.operatingHours).map(([day, hours]) => (
          <div key={day} className="flex items-center space-x-4">
            <div className="w-24">
              <span className="text-sm font-medium text-gray-300 capitalize">{day}</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`${day}-closed`}
                checked={hours.closed}
                onChange={(e) => handleOperatingHoursChange(day, 'closed', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
              />
              <label htmlFor={`${day}-closed`} className="text-sm text-gray-300">
                Closed
              </label>
            </div>
            {!hours.closed && (
              <>
                <div>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  />
                </div>
                <span className="text-gray-400">to</span>
                <div>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderBankDetails = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-white">Bank Account Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bank Name
          </label>
          <input
            type="text"
            value={formData.bankDetails.bankName}
            onChange={(e) => handleNestedInputChange('bankDetails', 'bankName', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter bank name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Account Holder Name
          </label>
          <input
            type="text"
            value={formData.bankDetails.accountHolderName}
            onChange={(e) => handleNestedInputChange('bankDetails', 'accountHolderName', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter account holder name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Account Number
          </label>
          <input
            type="text"
            value={formData.bankDetails.accountNumber}
            onChange={(e) => handleNestedInputChange('bankDetails', 'accountNumber', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter account number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Routing Number
          </label>
          <input
            type="text"
            value={formData.bankDetails.routingNumber}
            onChange={(e) => handleNestedInputChange('bankDetails', 'routingNumber', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter routing number"
          />
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicInfo();
      case 'location':
        return renderLocationInfo();
      case 'hours':
        return renderOperatingHours();
      case 'bank':
        return renderBankDetails();
      default:
        return renderBasicInfo();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading restaurant profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      <div className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/restaurant')}
                className="flex items-center text-gray-300 hover:text-white"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 border-l border-gray-600"></div>
              <h1 className="text-xl font-semibold text-white">
                Restaurant Profile
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
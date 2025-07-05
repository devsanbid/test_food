'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Building,
  MapPin,
  Clock
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function RestaurantEditPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id;
  
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
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
    priceRange: '',
    deliveryFee: 0,
    minimumOrderAmount: 0,
    deliveryRadius: 0,
    isActive: true,
    acceptsOnlineOrders: true,
    hasDelivery: true,
    hasPickup: true,
    operatingHours: {
      monday: { open: '09:00', close: '22:00', isClosed: false },
      tuesday: { open: '09:00', close: '22:00', isClosed: false },
      wednesday: { open: '09:00', close: '22:00', isClosed: false },
      thursday: { open: '09:00', close: '22:00', isClosed: false },
      friday: { open: '09:00', close: '22:00', isClosed: false },
      saturday: { open: '09:00', close: '22:00', isClosed: false },
      sunday: { open: '09:00', close: '22:00', isClosed: false }
    }
  });
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: Building },
    { id: 'location', name: 'Location', icon: MapPin },
    { id: 'hours', name: 'Operating Hours', icon: Clock }
  ];

  const cuisineTypes = [
    'Italian', 'Chinese', 'Indian', 'Mexican', 'American', 'Japanese',
    'Thai', 'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Other'
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
        if (!currentUser || currentUser.role !== 'admin') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        
        if (restaurantId) {
          await fetchRestaurantDetails();
        }
      } catch (error) {
        console.error('Error initializing page:', error);
        router.push('/login');
      }
    };

    initializePage();
  }, [restaurantId, router]);

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
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
          cuisine: Array.isArray(data.restaurant.cuisine) ? data.restaurant.cuisine[0] || '' : (typeof data.restaurant.cuisine === 'string' ? data.restaurant.cuisine : ''),
          address: data.restaurant.address?.street || '',
          city: data.restaurant.address?.city || '',
          state: data.restaurant.address?.state || '',
          zipCode: data.restaurant.address?.zipCode || '',
          country: '',
          phone: data.restaurant.phone || '',
          email: data.restaurant.email || '',
          website: data.restaurant.website || '',
          priceRange: data.restaurant.priceRange || '$',
          deliveryFee: data.restaurant.deliveryFee || 0,
          minimumOrderAmount: data.restaurant.minimumOrder || 0,
          deliveryRadius: 0,
          isActive: data.restaurant.isActive !== undefined ? data.restaurant.isActive : true,
          acceptsOnlineOrders: true,
          hasDelivery: data.restaurant.features?.includes('delivery') || false,
          hasPickup: data.restaurant.features?.includes('pickup') || false,
          operatingHours: data.restaurant.operatingHours || formData.operatingHours
        });
      } else {
        console.error('Failed to fetch restaurant details:', data.message);
      }
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
      return;
    }

    try {
      setSaving(true);
      
      // Transform form data to match Restaurant schema
      const restaurantData = {
        name: formData.name,
        description: formData.description,
        cuisine: [formData.cuisine], // Convert to array as per schema
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          coordinates: {
            latitude: 0, // Default values - should be set via geocoding
            longitude: 0
          }
        },
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        priceRange: formData.priceRange,
        deliveryFee: formData.deliveryFee,
        minimumOrder: formData.minimumOrderAmount,
        deliveryTime: {
          min: 30, // Default values
          max: 60
        },
        operatingHours: formData.operatingHours,
        isActive: formData.isActive,
        features: [
          ...(formData.hasDelivery ? ['delivery'] : []),
          ...(formData.hasPickup ? ['pickup'] : [])
        ]
      };
      
      const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(restaurantData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Restaurant updated successfully!');
        router.push(`/admin/restaurant/details/${restaurantId}`);
      } else {
        alert(data.message || 'Failed to update restaurant');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('Error updating restaurant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/admin/restaurant/details/${restaurantId}`)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Details</span>
            </button>
            <div className="h-6 w-px bg-gray-600"></div>
            <h1 className="text-2xl font-bold">Edit Restaurant</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/admin/restaurant/details/${restaurantId}`)}
              className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 min-h-screen">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Sections</h3>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="bg-slate-800 rounded-lg p-8">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Restaurant Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.name ? 'border-red-500' : 'border-slate-600'
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cuisine Type</label>
                    <select
                      value={typeof formData.cuisine === 'string' ? formData.cuisine : ''}
                      onChange={(e) => handleInputChange('cuisine', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Cuisine</option>
                      {cuisineTypes.map(cuisine => (
                        <option key={cuisine} value={cuisine}>{cuisine}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.email ? 'border-red-500' : 'border-slate-600'
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.phone ? 'border-red-500' : 'border-slate-600'
                      }`}
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price Range</label>
                    <select
                      value={formData.priceRange}
                      onChange={(e) => handleInputChange('priceRange', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {priceRanges.map(range => (
                        <option key={range.value} value={range.value}>{range.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="Describe your restaurant..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deliveryFee}
                      onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Order Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minimumOrderAmount}
                      onChange={(e) => handleInputChange('minimumOrderAmount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Radius (km)</label>
                    <input
                      type="number"
                      value={formData.deliveryRadius}
                      onChange={(e) => handleInputChange('deliveryRadius', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Location Information</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.address ? 'border-red-500' : 'border-slate-600'
                    }`}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.city ? 'border-red-500' : 'border-slate-600'
                      }`}
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Operating Hours Tab */}
            {activeTab === 'hours' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Operating Hours</h2>
                
                <div className="space-y-4">
                  {Object.entries(formData.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4 p-4 bg-slate-700 rounded-lg">
                      <div className="w-24">
                        <span className="font-medium capitalize">{day}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!hours.isClosed}
                          onChange={(e) => handleOperatingHoursChange(day, 'isClosed', !e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Open</span>
                      </div>
                      {!hours.isClosed && (
                        <>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Open</label>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                              className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Close</label>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                              className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white text-sm"
                            />
                          </div>
                        </>
                      )}
                      {hours.isClosed && (
                        <span className="text-slate-400 text-sm">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}
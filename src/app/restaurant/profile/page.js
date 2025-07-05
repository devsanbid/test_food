'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Camera, 
  Save, 
  Edit3,
  ArrowLeft,
  Upload,
  Star,
  Users,
  Utensils,
  Truck,
  CreditCard,
  Globe,
  Instagram,
  Facebook,
  Twitter
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function RestaurantProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [profileData, setProfileData] = useState({
    // Basic Information
    restaurantName: '',
    description: '',
    cuisine: '',
    priceRange: '',
    phone: '',
    email: '',
    website: '',
    
    // Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    
    // Operating Hours
    operatingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '23:00', closed: false },
      saturday: { open: '09:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false }
    },
    
    // Services
    services: {
      delivery: true,
      pickup: true,
      dineIn: true,
      catering: false
    },
    
    // Payment Methods
    paymentMethods: {
      cash: true,
      creditCard: true,
      debitCard: true,
      digitalWallet: true,
      onlinePayment: true
    },
    
    // Social Media
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      website: ''
    },
    
    // Settings
    settings: {
      acceptOrders: true,
      autoAcceptOrders: false,
      minimumOrderAmount: 15.00,
      deliveryRadius: 5,
      estimatedDeliveryTime: 30,
      preparationTime: 15
    }
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    averageRating: 0,
    totalReviews: 0,
    joinDate: null
  });
  const router = useRouter();

  const fetchRestaurantProfile = async () => {
    try {
      const response = await fetch('/api/restaurant/settings?section=all', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.settings) {
        const settings = data.settings;
        setProfileData({
          restaurantName: settings.general?.name || '',
          description: settings.general?.description || '',
          cuisine: settings.general?.cuisine || '',
          priceRange: '$', // Default value as not in API
          phone: settings.general?.phone || '',
          email: settings.general?.email || '',
          website: settings.general?.website || '',
          
          address: settings.general?.address || '',
          city: '', // Extract from address if needed
          state: '',
          zipCode: '',
          country: '',
          
          operatingHours: settings.operational?.openingHours || {
            monday: { open: '09:00', close: '22:00', closed: false },
            tuesday: { open: '09:00', close: '22:00', closed: false },
            wednesday: { open: '09:00', close: '22:00', closed: false },
            thursday: { open: '09:00', close: '22:00', closed: false },
            friday: { open: '09:00', close: '23:00', closed: false },
            saturday: { open: '09:00', close: '23:00', closed: false },
            sunday: { open: '10:00', close: '21:00', closed: false }
          },
          
          services: settings.operational?.features || {
            delivery: true,
            pickup: true,
            dineIn: true,
            catering: false
          },
          
          paymentMethods: settings.payment?.paymentMethods || {
            cash: true,
            creditCard: true,
            debitCard: true,
            digitalWallet: true,
            onlinePayment: true
          },
          
          socialMedia: settings.integrations?.socialMedia || {
            facebook: '',
            instagram: '',
            twitter: '',
            website: ''
          },
          
          settings: {
            acceptOrders: settings.operational?.acceptingOrders || true,
            autoAcceptOrders: false,
            minimumOrderAmount: settings.operational?.minimumOrderAmount || 15.00,
            deliveryRadius: settings.operational?.deliveryRadius || 5,
            estimatedDeliveryTime: settings.operational?.estimatedDeliveryTime || 30,
            preparationTime: 15 // Default value
          }
        });

        // Set stats with fallback values
        setStats({
          totalOrders: data.stats?.totalOrders || 0,
          averageRating: data.stats?.averageRating || 0,
          totalReviews: data.stats?.totalReviews || 0,
          joinDate: data.stats?.joinDate ? new Date(data.stats.joinDate) : new Date()
        });
      }
    } catch (error) {
      console.error('Error fetching restaurant profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: Store },
    { id: 'hours', name: 'Operating Hours', icon: Clock },
    { id: 'services', name: 'Services', icon: Truck },
    { id: 'payment', name: 'Payment', icon: CreditCard },
    { id: 'social', name: 'Social Media', icon: Globe },
    { id: 'settings', name: 'Settings', icon: Edit3 }
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
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'restaurant') {
          router.push('/login');
          return;
        }
        setUser(userData);
        await fetchRestaurantProfile();
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (section, field, value) => {
    if (section) {
      setProfileData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleHoursChange = (day, field, value) => {
    setProfileData(prev => ({
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

  const handleSave = async () => {
    try {
      // Update general settings
      const generalResponse = await fetch('/api/restaurant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          section: 'general',
          name: profileData.restaurantName,
          description: profileData.description,
          cuisine: profileData.cuisine,
          phone: profileData.phone,
          email: profileData.email,
          website: profileData.website,
          address: profileData.address
        })
      });

      // Update operational settings
      const operationalResponse = await fetch('/api/restaurant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          section: 'operational',
          openingHours: profileData.operatingHours,
          minimumOrderAmount: profileData.settings.minimumOrderAmount,
          deliveryRadius: profileData.settings.deliveryRadius,
          estimatedDeliveryTime: profileData.settings.estimatedDeliveryTime,
          acceptingOrders: profileData.settings.acceptOrders,
          features: profileData.services
        })
      });

      // Update payment settings
      const paymentResponse = await fetch('/api/restaurant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          section: 'payment',
          paymentMethods: profileData.paymentMethods
        })
      });

      // Update integrations (social media)
      const integrationsResponse = await fetch('/api/restaurant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          section: 'integrations',
          socialMedia: profileData.socialMedia
        })
      });

      const generalData = await generalResponse.json();
      const operationalData = await operationalResponse.json();
      const paymentData = await paymentResponse.json();
      const integrationsData = await integrationsResponse.json();

      if (generalData.success && operationalData.success && paymentData.success && integrationsData.success) {
        alert('Profile updated successfully!');
        setIsEditing(false);
        await fetchRestaurantProfile(); // Refresh data
      } else {
        alert('Some settings failed to update. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating profile');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/restaurant/dashboard" className="flex items-center space-x-2 text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <Store className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold">Restaurant Profile</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                    {profileData.restaurantName.charAt(0)}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2">{profileData.restaurantName}</h2>
                <p className="text-gray-400 text-sm mb-4">{profileData.cuisine} • {profileData.priceRange}</p>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="font-semibold">{stats.averageRating}</span>
                    </div>
                    <p className="text-xs text-gray-400">{stats.totalReviews} reviews</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="font-semibold">{stats.totalOrders}</span>
                    </div>
                    <p className="text-xs text-gray-400">total orders</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{profileData.city}, {profileData.state}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{profileData.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{profileData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">Joined {formatDate(stats.joinDate)}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        activeTab === tab.id 
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                          : 'hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Profile Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Restaurant Name</label>
                      <input
                        type="text"
                        value={profileData.restaurantName}
                        onChange={(e) => handleInputChange(null, 'restaurantName', e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Cuisine Type</label>
                      <select
                        value={profileData.cuisine}
                        onChange={(e) => handleInputChange(null, 'cuisine', e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                      >
                        {cuisineTypes.map(cuisine => (
                          <option key={cuisine} value={cuisine}>{cuisine}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Price Range</label>
                      <select
                        value={profileData.priceRange}
                        onChange={(e) => handleInputChange(null, 'priceRange', e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                      >
                        {priceRanges.map(range => (
                          <option key={range.value} value={range.value}>{range.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange(null, 'phone', e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange(null, 'email', e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Website</label>
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => handleInputChange(null, 'website', e.target.value)}
                        disabled={!isEditing}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={profileData.description}
                      onChange={(e) => handleInputChange(null, 'description', e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                      placeholder="Describe your restaurant..."
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium mb-4">Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Street Address</label>
                        <input
                          type="text"
                          value={profileData.address}
                          onChange={(e) => handleInputChange(null, 'address', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">City</label>
                        <input
                          type="text"
                          value={profileData.city}
                          onChange={(e) => handleInputChange(null, 'city', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">State</label>
                        <input
                          type="text"
                          value={profileData.state}
                          onChange={(e) => handleInputChange(null, 'state', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">ZIP Code</label>
                        <input
                          type="text"
                          value={profileData.zipCode}
                          onChange={(e) => handleInputChange(null, 'zipCode', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Country</label>
                        <input
                          type="text"
                          value={profileData.country}
                          onChange={(e) => handleInputChange(null, 'country', e.target.value)}
                          disabled={!isEditing}
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Operating Hours Tab */}
              {activeTab === 'hours' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Operating Hours</h3>
                  
                  <div className="space-y-4">
                    {Object.entries(profileData.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-24">
                            <span className="font-medium capitalize">{day}</span>
                          </div>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={hours.closed}
                              onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                              disabled={!isEditing}
                              className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-gray-400">Closed</span>
                          </label>
                        </div>
                        
                        {!hours.closed && (
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-400">Open:</label>
                              <input
                                type="time"
                                value={hours.open}
                                onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                disabled={!isEditing}
                                className="p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-400">Close:</label>
                              <input
                                type="time"
                                value={hours.close}
                                onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                disabled={!isEditing}
                                className="p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Available Services</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(profileData.services).map(([service, enabled]) => (
                      <div key={service} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                            {service === 'delivery' && <Truck className="h-5 w-5 text-orange-400" />}
                            {service === 'pickup' && <Store className="h-5 w-5 text-orange-400" />}
                            {service === 'dineIn' && <Utensils className="h-5 w-5 text-orange-400" />}
                            {service === 'catering' && <Users className="h-5 w-5 text-orange-400" />}
                          </div>
                          <div>
                            <h4 className="font-medium capitalize">
                              {service === 'dineIn' ? 'Dine In' : service}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {service === 'delivery' && 'Deliver food to customers'}
                              {service === 'pickup' && 'Customers pick up orders'}
                              {service === 'dineIn' && 'Customers dine at restaurant'}
                              {service === 'catering' && 'Large event catering'}
                            </p>
                          </div>
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => handleInputChange('services', service, e.target.checked)}
                            disabled={!isEditing}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 disabled:opacity-50"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Methods Tab */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Payment Methods</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(profileData.paymentMethods).map(([method, enabled]) => (
                      <div key={method} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-medium capitalize">
                              {method === 'creditCard' ? 'Credit Card' : 
                               method === 'debitCard' ? 'Debit Card' :
                               method === 'digitalWallet' ? 'Digital Wallet' :
                               method === 'onlinePayment' ? 'Online Payment' : method}
                            </h4>
                          </div>
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => handleInputChange('paymentMethods', method, e.target.checked)}
                            disabled={!isEditing}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 disabled:opacity-50"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media Tab */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Social Media Links</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg">
                      <Facebook className="h-6 w-6 text-blue-500" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">Facebook</label>
                        <input
                          type="url"
                          value={profileData.socialMedia.facebook}
                          onChange={(e) => handleInputChange('socialMedia', 'facebook', e.target.value)}
                          disabled={!isEditing}
                          placeholder="https://facebook.com/yourrestaurant"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg">
                      <Instagram className="h-6 w-6 text-pink-500" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">Instagram</label>
                        <input
                          type="url"
                          value={profileData.socialMedia.instagram}
                          onChange={(e) => handleInputChange('socialMedia', 'instagram', e.target.value)}
                          disabled={!isEditing}
                          placeholder="https://instagram.com/yourrestaurant"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg">
                      <Twitter className="h-6 w-6 text-blue-400" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">Twitter</label>
                        <input
                          type="url"
                          value={profileData.socialMedia.twitter}
                          onChange={(e) => handleInputChange('socialMedia', 'twitter', e.target.value)}
                          disabled={!isEditing}
                          placeholder="https://twitter.com/yourrestaurant"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Restaurant Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Accept New Orders</h4>
                        <p className="text-sm text-gray-400">Allow customers to place new orders</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.settings.acceptOrders}
                          onChange={(e) => handleInputChange('settings', 'acceptOrders', e.target.checked)}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 disabled:opacity-50"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">Auto Accept Orders</h4>
                        <p className="text-sm text-gray-400">Automatically accept incoming orders</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.settings.autoAcceptOrders}
                          onChange={(e) => handleInputChange('settings', 'autoAcceptOrders', e.target.checked)}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 disabled:opacity-50"></div>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Minimum Order Amount ($)</label>
                        <input
                          type="number"
                          value={profileData.settings.minimumOrderAmount}
                          onChange={(e) => handleInputChange('settings', 'minimumOrderAmount', parseFloat(e.target.value))}
                          disabled={!isEditing}
                          step="0.01"
                          min="0"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Delivery Radius (miles)</label>
                        <input
                          type="number"
                          value={profileData.settings.deliveryRadius}
                          onChange={(e) => handleInputChange('settings', 'deliveryRadius', parseInt(e.target.value))}
                          disabled={!isEditing}
                          min="1"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Estimated Delivery Time (minutes)</label>
                        <input
                          type="number"
                          value={profileData.settings.estimatedDeliveryTime}
                          onChange={(e) => handleInputChange('settings', 'estimatedDeliveryTime', parseInt(e.target.value))}
                          disabled={!isEditing}
                          min="5"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Average Preparation Time (minutes)</label>
                        <input
                          type="number"
                          value={profileData.settings.preparationTime}
                          onChange={(e) => handleInputChange('settings', 'preparationTime', parseInt(e.target.value))}
                          disabled={!isEditing}
                          min="5"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
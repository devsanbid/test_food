'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function RestaurantViewEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('id');
  const mode = searchParams.get('mode') || 'add'; // 'add', 'view', 'edit'
  
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';
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
    owner: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
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
    { id: 'owner', name: 'Owner Details', icon: User },
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
        if (!currentUser || currentUser.role !== 'admin') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        
        if (restaurantId) {
          await fetchRestaurantDetails();
        } else {
          setLoading(false);
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
          owner: {
            firstName: data.restaurant.owner?.firstName || '',
            lastName: data.restaurant.owner?.lastName || '',
            email: data.restaurant.owner?.email || '',
            phone: data.restaurant.owner?.phone || ''
          },
          bankDetails: data.restaurant.bankDetails || formData.bankDetails
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
      
      const url = restaurantId 
        ? `/api/admin/restaurants/${restaurantId}`
        : '/api/admin/restaurants';
      
      const method = restaurantId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(restaurantId ? 'Restaurant updated successfully!' : 'Restaurant created successfully!');
        if (restaurantId) {
          router.push(`/admin/restaurant/add?id=${restaurantId}&mode=view`);
        } else {
          router.push('/admin/restaurant/list');
        }
      } else {
        alert(data.message || 'Failed to save restaurant');
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      alert('Error saving restaurant');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label, value, field, type = 'text', options = null, required = false) => {
    if (isViewMode) {
      return (
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">{label}</label>
          <div className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
            {type === 'select' && options ? 
              options.find(opt => opt.value === value)?.label || value :
              value || 'Not specified'
            }
          </div>
        </div>
      );
    }

    if (type === 'select') {
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{label} {required && '*'}</label>
          <select
            value={String(value || '')}
            onChange={(e) => handleInputChange(field, e.target.value)}
            disabled={isViewMode}
            className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors[field] ? 'border-red-500' : 'border-slate-600'
            } ${isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{label} {required && '*'}</label>
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={4}
            disabled={isViewMode}
            className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors[field] ? 'border-red-500' : 'border-slate-600'
            } ${isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
          {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium mb-2">{label} {required && '*'}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          disabled={isViewMode}
          className={`w-full bg-slate-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors[field] ? 'border-red-500' : 'border-slate-600'
          } ${isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
        {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
      </div>
    );
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
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
      <header className="bg-slate-800 p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/restaurant/list')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to List</span>
            </button>
            <div className="h-6 w-px bg-gray-600"></div>
            <h1 className="text-2xl font-bold">
              {restaurantId ? (isEditMode ? 'Edit Restaurant' : 'View Restaurant') : 'Add Restaurant'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {isViewMode && (
              <button
                onClick={() => router.push(`/admin/restaurant/add?id=${restaurantId}&mode=edit`)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
            {(isEditMode || isAddMode) && (
              <>
                <button
                  onClick={() => {
                    if (restaurantId) {
                      router.push(`/admin/restaurant/add?id=${restaurantId}&mode=view`);
                    } else {
                      router.push('/admin/restaurant/list');
                    }
                  }}
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
                  <span>{saving ? 'Saving...' : (isAddMode ? 'Add Restaurant' : 'Save Changes')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <div className="w-64 bg-slate-800 min-h-screen">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {isViewMode ? 'View Sections' : isEditMode ? 'Edit Sections' : 'Restaurant Sections'}
            </h3>
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

        <div className="flex-1 p-6">
          <div className="bg-slate-800 rounded-lg p-8">
            {activeTab === 'basic' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {renderField('Restaurant Name', formData.name, 'name', 'text', null, true)}
                  {renderField('Cuisine Type', formData.cuisine, 'cuisine', 'select', cuisineTypes.map(c => ({value: c, label: c})), true)}
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {renderField('Email', formData.email, 'email', 'email', null, true)}
                  {renderField('Phone', formData.phone, 'phone', 'tel', null, true)}
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {renderField('Website', formData.website, 'website', 'url')}
                  {renderField('Price Range', formData.priceRange, 'priceRange', 'select', priceRanges)}
                </div>
                
                <div className="mb-6">
                  {renderField('Description', formData.description, 'description', 'textarea')}
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {renderField('Delivery Fee ($)', formData.deliveryFee, 'deliveryFee', 'number')}
                  {renderField('Minimum Order ($)', formData.minimumOrderAmount, 'minimumOrderAmount', 'number')}
                  {renderField('Delivery Radius (km)', formData.deliveryRadius, 'deliveryRadius', 'number')}
                </div>
              </div>
            )}

            {activeTab === 'location' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Location Details</h2>
                
                <div className="mb-6">
                  {renderField('Address', formData.address, 'address', 'text', null, true)}
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {renderField('City', formData.city, 'city', 'text', null, true)}
                  {renderField('State/Province', formData.state, 'state')}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {renderField('ZIP/Postal Code', formData.zipCode, 'zipCode')}
                  {renderField('Country', formData.country, 'country')}
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Operating Hours</h2>
                
                <div className="space-y-4">
                  {Object.entries(formData.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4 p-4 bg-slate-700 rounded-lg">
                      <div className="w-24 font-medium capitalize">{day}</div>
                      
                      {(isEditMode || isAddMode) ? (
                        <>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={!hours.closed}
                              onChange={(e) => handleOperatingHoursChange(day, 'closed', !e.target.checked)}
                              className="rounded"
                            />
                            <span>Open</span>
                          </label>
                          
                          {!hours.closed && (
                            <>
                              <input
                                type="time"
                                value={hours.open}
                                onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                                className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={hours.close}
                                onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                                className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                              />
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center space-x-4">
                          {hours.closed ? (
                            <span className="text-red-400">Closed</span>
                          ) : (
                            <span className="text-green-400">{hours.open} - {hours.close}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'owner' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Owner Details</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {renderField('First Name', formData.owner.firstName, 'owner.firstName')}
                  {renderField('Last Name', formData.owner.lastName, 'owner.lastName')}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {renderField('Email', formData.owner.email, 'owner.email', 'email')}
                  {renderField('Phone', formData.owner.phone, 'owner.phone', 'tel')}
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Bank Details</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {renderField('Bank Name', formData.bankDetails.bankName, 'bankDetails.bankName')}
                  {renderField('Account Holder Name', formData.bankDetails.accountHolderName, 'bankDetails.accountHolderName')}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {renderField('Account Number', formData.bankDetails.accountNumber, 'bankDetails.accountNumber')}
                  {renderField('Routing Number', formData.bankDetails.routingNumber, 'bankDetails.routingNumber')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
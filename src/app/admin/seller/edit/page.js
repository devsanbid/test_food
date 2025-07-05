"use client"

import React, { useState } from 'react';
import { 
  ChevronRight,
  ChevronDown,
  User,
  Wallet,
  FileText,
  Shield,
  AlertCircle,
  Grid3X3,
  Zap,
  ArrowUp,
  Sun,
  Camera,
  Mail,
  Phone,
  MapPin,
  Save,
  RotateCcw,
  UserPlus,
  Building,
  Globe,
  Edit3
} from 'lucide-react';

export default function EditSellerPage() {
  const [activeSection, setActiveSection] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    firstName: 'Gustavo',
    lastName: 'Philips',
    username: 'gustavophilips07',
    email: 'gustavophilips07@mail.com',
    phone: '877855658',
    country: 'us',
    state: 'ca',
    zip: '90210',
    address: '123 Main Street, Downtown',
    businessName: 'Gustavo\'s Kitchen',
    businessType: 'restaurant',
    description: 'Hi, I\'m Kalya Botosh, it has been the industry\'s standard dummy text since the 1500s when an unknown printer took a galley of type.',
    profileImage: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, profileImage: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    return newErrors;
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
      address: '',
      businessName: '',
      businessType: '',
      description: '',
      profileImage: null
    });
    setErrors({});
  };

  const handleSave = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Seller updated:', formData);
    } catch (error) {
      console.error('Error updating seller:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Edit3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Seller</h1>
              <p className="text-gray-600 mt-1">Update seller information and business details</p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span>Sellers</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-blue-600 font-medium">Edit Seller</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-8">
              {/* Profile Image Section */}
              <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 mx-auto backdrop-blur-sm">
                      {formData.profileImage ? (
                        <img 
                          src={formData.profileImage} 
                          alt="Profile" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 group">
                      <Camera className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <h3 className="font-semibold text-lg">{formData.firstName} {formData.lastName}</h3>
                  <p className="text-blue-100 text-sm">{formData.businessName}</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="p-6">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveSection('personal')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === 'personal'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Personal Info</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('business')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === 'business'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Building className="w-5 h-5" />
                    <span className="font-medium">Business Info</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('location')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === 'location'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Location</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('additional')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === 'additional'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Additional Info</span>
                  </button>
                </nav>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-100 space-y-3">
                <button
                  onClick={handleClear}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Form</span>
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Updating...' : 'Update Seller'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

              {/* Form Content */}
              <div className="p-8">
                {/* Personal Information Section */}
                {activeSection === 'personal' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <User className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                            errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                          }`}
                          placeholder="Enter first name"
                        />
                        {errors.firstName && (
                          <div className="flex items-center space-x-2 mt-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{errors.firstName}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                            errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                          }`}
                          placeholder="Enter last name"
                        />
                        {errors.lastName && (
                          <div className="flex items-center space-x-2 mt-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{errors.lastName}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                            errors.username ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                          }`}
                          placeholder="Enter username"
                        />
                        {errors.username && (
                          <div className="flex items-center space-x-2 mt-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{errors.username}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                              errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                            }`}
                            placeholder="Enter email address"
                          />
                        </div>
                        {errors.email && (
                          <div className="flex items-center space-x-2 mt-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{errors.email}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                              errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                            }`}
                            placeholder="Enter phone number"
                          />
                        </div>
                        {errors.phone && (
                          <div className="flex items-center space-x-2 mt-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{errors.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Business Information Section */}
                {activeSection === 'business' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Building className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                              errors.businessName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                            }`}
                            placeholder="Enter business name"
                          />
                        </div>
                        {errors.businessName && (
                          <div className="flex items-center space-x-2 mt-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{errors.businessName}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type</label>
                        <div className="relative">
                          <select
                            name="businessType"
                            value={formData.businessType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                          >
                            <option value="">Select business type</option>
                            <option value="restaurant">Restaurant</option>
                            <option value="cafe">Cafe</option>
                            <option value="bakery">Bakery</option>
                            <option value="food_truck">Food Truck</option>
                            <option value="catering">Catering Service</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Location Information Section */}
                {activeSection === 'location' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <MapPin className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Location Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Country/Region</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                          >
                            <option value="">Select country</option>
                            <option value="us">United States</option>
                            <option value="ca">Canada</option>
                            <option value="uk">United Kingdom</option>
                            <option value="au">Australia</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <select
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                          >
                            <option value="">Select state</option>
                            <option value="ca">California</option>
                            <option value="ny">New York</option>
                            <option value="tx">Texas</option>
                            <option value="fl">Florida</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP/Postal Code</label>
                        <input
                          type="text"
                          name="zip"
                          value={formData.zip}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200"
                          placeholder="Enter ZIP/postal code"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200"
                          placeholder="Enter full address"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Additional Information Section */}
                {activeSection === 'additional' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Additional Information</h2>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={6}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 resize-none"
                          placeholder="Enter seller description..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2024 FoodSewa. All rights reserved.</p>
        </div>
      </div>
      
      {/* Floating Action Buttons */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:scale-110">
        <Sun className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" />
      </button>
      
      <button className="fixed bottom-24 right-6 w-12 h-12 bg-white text-gray-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border border-gray-200 hover:bg-gray-50 hover:scale-110">
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
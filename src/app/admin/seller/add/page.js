"use client"

import { useState } from 'react';
import { 
  ChevronRight, 
  User, 
  ChevronDown, 
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
  Globe
} from 'lucide-react';

export default function AddSellerPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    zip: '',
    description: '',
    address: '',
    businessName: '',
    businessType: '',
    profileImage: null
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      console.log('Saving seller data:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving seller:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <UserPlus className="w-8 h-8 mr-3 text-orange-500" />
            Add New Seller
          </h1>
          <nav className="text-sm text-slate-400">
            <span>Admin</span>
            <ChevronRight className="w-4 h-4 inline mx-2" />
            <span>Sellers</span>
            <ChevronRight className="w-4 h-4 inline mx-2" />
            <span className="text-orange-500">Add Seller</span>
          </nav>
        </div>

        <div className="flex gap-8">
          <div className="w-80 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6 h-fit sticky top-8">
            <div className="mb-8">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 bg-slate-700/50 rounded-full border-4 border-dashed border-slate-600 hover:border-orange-500/50 transition-all cursor-pointer group relative overflow-hidden">
                {formData.profileImage ? (
                  <img
                    src={URL.createObjectURL(formData.profileImage)}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-slate-400 group-hover:text-orange-500 transition-colors" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-center text-xs text-slate-400">Upload Photo</p>
            </div>

            <nav className="space-y-2">
                  <div 
                    onClick={() => setActiveSection('personal')}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      activeSection === 'personal' 
                        ? 'text-orange-500 bg-orange-500/10 border border-orange-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <User className="w-5 h-5 mr-3" />
                    <span className={activeSection === 'personal' ? 'font-medium' : ''}>Personal Info</span>
                  </div>
                  <div 
                    onClick={() => setActiveSection('business')}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      activeSection === 'business' 
                        ? 'text-orange-500 bg-orange-500/10 border border-orange-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <Building className="w-5 h-5 mr-3" />
                    <span className={activeSection === 'business' ? 'font-medium' : ''}>Business Info</span>
                  </div>
                  <div 
                    onClick={() => setActiveSection('location')}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      activeSection === 'location' 
                        ? 'text-orange-500 bg-orange-500/10 border border-orange-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <MapPin className="w-5 h-5 mr-3" />
                    <span className={activeSection === 'location' ? 'font-medium' : ''}>Location</span>
                  </div>
                  <div 
                    onClick={() => setActiveSection('additional')}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      activeSection === 'additional' 
                        ? 'text-orange-500 bg-orange-500/10 border border-orange-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    <span className={activeSection === 'additional' ? 'font-medium' : ''}>Additional Info</span>
                  </div>
                </nav>

            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleClear}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 hover:border-slate-500"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear Form</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Create Seller</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
            {activeSection === 'personal' && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <User className="w-6 h-6 mr-3 text-orange-500" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Enter first name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all ${
                          errors.firstName ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Enter last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all ${
                          errors.lastName ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="username"
                        placeholder="Enter username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all ${
                          errors.username ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all ${
                          errors.email ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all ${
                          errors.phone ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'business' && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <Building className="w-6 h-6 mr-3 text-orange-500" />
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Business Name *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="businessName"
                        placeholder="Enter business name"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all ${
                          errors.businessName ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                    </div>
                    {errors.businessName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.businessName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Business Type
                    </label>
                    <div className="relative">
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all appearance-none"
                      >
                        <option value="">Select business type</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="cafe">Cafe</option>
                        <option value="bakery">Bakery</option>
                        <option value="food-truck">Food Truck</option>
                        <option value="catering">Catering Service</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'location' && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <MapPin className="w-6 h-6 mr-3 text-orange-500" />
                  Location Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Country/Region
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-11 pr-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all appearance-none"
                      >
                        <option value="">Select country</option>
                        <option value="us">United States</option>
                        <option value="ca">Canada</option>
                        <option value="uk">United Kingdom</option>
                        <option value="au">Australia</option>
                        <option value="de">Germany</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      State/Province
                    </label>
                    <div className="relative">
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all appearance-none"
                      >
                        <option value="">Select state</option>
                        <option value="ca">California</option>
                        <option value="ny">New York</option>
                        <option value="tx">Texas</option>
                        <option value="fl">Florida</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      name="zip"
                      placeholder="Enter ZIP code"
                      value={formData.zip}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Street Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-4 w-5 h-5 text-slate-400" />
                    <textarea
                      name="address"
                      rows={3}
                      placeholder="Enter complete street address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'additional' && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-orange-500" />
                  Additional Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={6}
                    placeholder="Enter a brief description about the seller or business..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-slate-500 transition-all resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>© 2024 FoodSewa Admin Panel. All rights reserved.</p>
        </div>
        {/* Theme Toggle Button */}
        <button className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <Sun className="w-5 h-5" />
        </button>

        {/* Scroll to Top Button */}
        <button className="fixed bottom-6 right-20 w-12 h-12 bg-slate-700/80 hover:bg-slate-600/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
      </div>
    );
  }
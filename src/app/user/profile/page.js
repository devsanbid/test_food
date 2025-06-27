"use client"

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, Camera, Bell, Shield, CreditCard, Heart, Clock, Settings } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  
  const [profileData, setProfileData] = useState({
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, New York, NY 10001',
    joinDate: 'January 2023',
    bio: 'Food enthusiast who loves trying new restaurants and cuisines.'
  });

  const [tempData, setTempData] = useState({ ...profileData });
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'user') {
          router.push('/login');
          return;
        }
        setUserData(user);
        
        // Update profile data with user information if available
        if (user.username) {
          setProfileData(prevData => ({
            ...prevData,
            name: user.username,
            email: user.email || prevData.email
          }));
          setTempData(prevData => ({
            ...prevData,
            name: user.username,
            email: user.email || prevData.email
          }));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    setTempData({ ...profileData });
  };

  const handleSave = () => {
    setProfileData({ ...tempData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempData({ ...profileData });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setTempData(prev => ({ ...prev, [field]: value }));
  };



  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Y</span>
                </div>
                <h1 className="text-xl font-bold text-white">Yum</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800 rounded-lg">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-lg p-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {profileData.name.split(' ').map(n => n[0]).join('')}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{profileData.name}</h2>
                <p className="text-white/80 text-lg">Member since {profileData.joinDate}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
           <div className="p-8">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-2xl font-semibold">Profile Information</h3>
               {!isEditing ? (
                 <button
                   onClick={handleEdit}
                   className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                 >
                   <Edit3 className="w-4 h-4" />
                   <span>Edit Profile</span>
                 </button>
               ) : (
                 <div className="flex space-x-2">
                   <button
                     onClick={handleSave}
                     className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                   >
                     <Save className="w-4 h-4" />
                     <span>Save</span>
                   </button>
                   <button
                     onClick={handleCancel}
                     className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors"
                   >
                     <X className="w-4 h-4" />
                     <span>Cancel</span>
                   </button>
                 </div>
               )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={tempData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-700 rounded-lg">{profileData.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={tempData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-700 rounded-lg">{profileData.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={tempData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-700 rounded-lg">{profileData.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Member Since
                      </label>
                      <p className="px-4 py-3 bg-slate-700 rounded-lg text-slate-400">{profileData.joinDate}</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Address
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={tempData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-700 rounded-lg">{profileData.address}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bio
                      </label>
                      {isEditing ? (
                        <textarea
                          value={tempData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-slate-700 rounded-lg">{profileData.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
}
"use client"

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, Bell, Shield, Globe, CreditCard, User, Moon, Sun, 
  Smartphone, Mail, Volume2, VolumeX, Eye, EyeOff, Lock, 
  MapPin, Clock, Trash2, Download, Upload, LogOut, HelpCircle,
  ChevronRight, ToggleLeft, ToggleRight, Monitor, Palette
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [settings, setSettings] = useState({
    // General Settings
    theme: 'dark',
    language: 'en',
    timezone: 'UTC-5',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotionalEmails: false,
    soundEnabled: true,
    
    // Privacy Settings
    profileVisibility: 'public',
    locationSharing: true,
    dataCollection: false,
    cookiePreferences: 'essential',
    
    // Security Settings
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30,
    
    // Account Settings
    autoSave: true,
    defaultPaymentMethod: 'card-1234',
    deliveryInstructions: '',
    
    // Display Settings
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false
  });
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'user') {
          router.push('/login');
          return;
        }
        setUserData(user);
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

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingsSections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'account', label: 'Account', icon: User },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'data', label: 'Data & Storage', icon: Download },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];

  const Toggle = ({ enabled, onChange, size = 'default' }) => {
    const sizeClasses = size === 'small' ? 'w-8 h-5' : 'w-10 h-6';
    const dotSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';
    
    return (
      <button
        onClick={() => onChange(!enabled)}
        className={`${sizeClasses} rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
          enabled ? 'bg-orange-500' : 'bg-slate-600'
        }`}
      >
        <div
          className={`${dotSize} bg-white rounded-full transition-transform duration-200 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    );
  };

  const SettingRow = ({ label, description, children, danger = false }) => (
    <div className={`flex items-center justify-between py-4 px-6 hover:bg-slate-700 transition-colors ${danger ? 'hover:bg-red-900/20' : ''}`}>
      <div className="flex-1">
        <h4 className={`font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</h4>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );

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
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <h2 className="text-lg font-medium text-slate-300">Settings</h2>
            </div>
            <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-4 sticky top-8">
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-orange-500 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              
              {/* General Settings */}
              {activeSection === 'general' && (
                <div>
                  <div className="p-6 border-b border-slate-700">
                    <h3 className="text-2xl font-semibold">General Settings</h3>
                    <p className="text-slate-400 mt-1">Manage your basic preferences and app behavior</p>
                  </div>
                  
                  <div className="divide-y divide-slate-700">
                    <SettingRow 
                      label="Theme" 
                      description="Choose your preferred color scheme"
                    >
                      <select 
                        value={settings.theme}
                        onChange={(e) => updateSetting('theme', e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">System</option>
                      </select>
                    </SettingRow>

                    <SettingRow 
                      label="Language" 
                      description="Select your preferred language"
                    >
                      <select 
                        value={settings.language}
                        onChange={(e) => updateSetting('language', e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </SettingRow>

                    <SettingRow 
                      label="Timezone" 
                      description="Set your local timezone for accurate delivery times"
                    >
                      <select 
                        value={settings.timezone}
                        onChange={(e) => updateSetting('timezone', e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="UTC-8">Pacific Time (UTC-8)</option>
                        <option value="UTC-5">Eastern Time (UTC-5)</option>
                        <option value="UTC+0">Greenwich Mean Time (UTC+0)</option>
                        <option value="UTC+1">Central European Time (UTC+1)</option>
                      </select>
                    </SettingRow>

                    <SettingRow 
                      label="Auto-save preferences" 
                      description="Automatically save your order preferences"
                    >
                      <Toggle 
                        enabled={settings.autoSave}
                        onChange={(value) => updateSetting('autoSave', value)}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div>
                  <div className="p-6 border-b border-slate-700">
                    <h3 className="text-2xl font-semibold">Notification Settings</h3>
                    <p className="text-slate-400 mt-1">Control how and when you receive notifications</p>
                  </div>
                  
                  <div className="divide-y divide-slate-700">
                    <SettingRow 
                      label="Email Notifications" 
                      description="Receive order updates and news via email"
                    >
                      <Toggle 
                        enabled={settings.emailNotifications}
                        onChange={(value) => updateSetting('emailNotifications', value)}
                      />
                    </SettingRow>

                    <SettingRow 
                      label="Push Notifications" 
                      description="Get real-time notifications on your device"
                    >
                      <Toggle 
                        enabled={settings.pushNotifications}
                        onChange={(value) => updateSetting('pushNotifications', value)}
                      />
                    </SettingRow>

                    <SettingRow 
                      label="SMS Notifications" 
                      description="Receive text messages for critical updates"
                    >
                      <Toggle 
                        enabled={settings.smsNotifications}
                        onChange={(value) => updateSetting('smsNotifications', value)}
                      />
                    </SettingRow>

                    <SettingRow 
                      label="Order Updates" 
                      description="Get notified about order status changes"
                    >
                      <Toggle 
                        enabled={settings.orderUpdates}
                        onChange={(value) => updateSetting('orderUpdates', value)}
                      />
                    </SettingRow>

                    <SettingRow 
                      label="Promotional Emails" 
                      description="Receive offers, deals, and restaurant recommendations"
                    >
                      <Toggle 
                        enabled={settings.promotionalEmails}
                        onChange={(value) => updateSetting('promotionalEmails', value)}
                      />
                    </SettingRow>

                    <SettingRow 
                      label="Sound Notifications" 
                      description="Play sounds for incoming notifications"
                    >
                      <Toggle 
                        enabled={settings.soundEnabled}
                        onChange={(value) => updateSetting('soundEnabled', value)}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <div>
                  <div className="p-6 border-b border-slate-700">
                    <h3 className="text-2xl font-semibold">Privacy Settings</h3>
                    <p className="text-slate-400 mt-1">Control your privacy and data sharing preferences</p>
                  </div>
                  
                  <div className="divide-y divide-slate-700">
                    <SettingRow 
                      label="Profile Visibility" 
                      description="Control who can see your profile information"
                    >
                      <select 
                        value={settings.profileVisibility}
                        onChange={(e) => updateSetting('profileVisibility', e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </SettingRow>

                    <SettingRow 
                      label="Location Sharing" 
                      description="Share your location for better delivery accuracy"
                    >
                      <Toggle 
                        enabled={settings.locationSharing}
                        onChange={(value) => updateSetting('locationSharing', value)}
                      />
                    </SettingRow>

                    <SettingRow 
                      label="Data Collection" 
                      description="Allow collection of usage data for app improvement"
                    >
                      <Toggle 
                        enabled={settings.dataCollection}
                        onChange={(value) => updateSetting('dataCollection', value)}
                      />
                    </SettingRow>

                    <SettingRow 
                      label="Cookie Preferences" 
                      description="Manage cookie and tracking preferences"
                    >
                      <select 
                        value={settings.cookiePreferences}
                        onChange={(e) => updateSetting('cookiePreferences', e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="all">All Cookies</option>
                        <option value="functional">Functional Only</option>
                        <option value="essential">Essential Only</option>
                      </select>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeSection === 'security' && (
                <div>
                  <div className="p-6 border-b border-slate-700">
                    <h3 className="text-2xl font-semibold">Security Settings</h3>
                    <p className="text-slate-400 mt-1">Manage your account security and authentication</p>
                  </div>
                  
                  <div className="divide-y divide-slate-700">
                    <SettingRow 
                      label="Change Password" 
                      description="Update your account password"
                    >
                      <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">
                        Change
                      </button>
                    </SettingRow>

                    <SettingRow 
                      label="Two-Factor Authentication" 
                      description="Add an extra layer of security to your account"
                    >
                      <div className="flex items-center space-x-3">
                        <Toggle 
                          enabled={settings.twoFactorAuth}
                          onChange={(value) => updateSetting('twoFactorAuth', value)}
                        />
                        {settings.twoFactorAuth && (
                          <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors">
                            Configure
                          </button>
                        )}
                      </div>
                    </SettingRow>

                    <SettingRow 
                      label="Login Alerts" 
                      description="Get notified of new login attempts"
                    >
                      <Toggle 
                        enabled={settings.loginAlerts}
                        onChange={(value) => updateSetting('loginAlerts', value)}
                      />
                    </SettingRow>

                    <SettingRow 
                      label="Session Timeout" 
                      description="Automatically log out after inactivity"
                    >
                      <select 
                        value={settings.sessionTimeout}
                        onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={0}>Never</option>
                      </select>
                    </SettingRow>

                    <SettingRow 
                      label="Active Sessions" 
                      description="View and manage your active login sessions"
                    >
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        Manage
                      </button>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Account Settings */}
              {activeSection === 'account' && (
                <div>
                  <div className="p-6 border-b border-slate-700">
                    <h3 className="text-2xl font-semibold">Account Settings</h3>
                    <p className="text-slate-400 mt-1">Manage your account information and preferences</p>
                  </div>
                  
                  <div className="divide-y divide-slate-700">
                    <SettingRow 
                      label="Default Payment Method" 
                      description="Select your preferred payment method for orders"
                    >
                      <select 
                        value={settings.defaultPaymentMethod}
                        onChange={(e) => updateSetting('defaultPaymentMethod', e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="card-1234">•••• 1234</option>
                        <option value="card-5678">•••• 5678</option>
                        <option value="paypal">PayPal</option>
                      </select>
                    </SettingRow>

                    <SettingRow 
                      label="Default Delivery Instructions" 
                      description="Standard instructions for delivery drivers"
                    >
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        Edit
                      </button>
                    </SettingRow>

                    <SettingRow 
                      label="Download Account Data" 
                      description="Export your account information and order history"
                    >
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </SettingRow>

                    <SettingRow 
                      label="Delete Account" 
                      description="Permanently delete your account and all data"
                      danger={true}
                    >
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Display Settings */}
              {activeSection === 'display' && (
                <div>
                  <div className="p-6 border-b border-slate-700">
                    <h3 className="text-2xl font-semibold">Display Settings</h3>
                    <p className="text-slate-400 mt-1">Customize the appearance and accessibility of the app</p>
                  </div>
                  
                  <div className="divide-y divide-slate-700">
                    <SettingRow 
                      label="Font Size" 
                      description="Adjust text size for better readability"
                    >
                      <select 
                        value={settings.fontSize}
                        onChange={(e) => updateSetting('fontSize', e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="extra-large">Extra Large</option>
                      </select>
                    </SettingRow>

                    <SettingRow 
                      label="Reduce Motion" 
                      description="Minimize animations and transitions"
                    >
                      <Toggle 
                        enabled={settings.reducedMotion}
                        onChange={(value) => updateSetting('reducedMotion', value)}
                      />
                    </SettingRow>

                    <SettingRow 
                      label="High Contrast" 
                      description="Increase contrast for better visibility"
                    >
                      <Toggle 
                        enabled={settings.highContrast}
                        onChange={(value) => updateSetting('highContrast', value)}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Data & Storage */}
              {activeSection === 'data' && (
                <div>
                  <div className="p-6 border-b border-slate-700">
                    <h3 className="text-2xl font-semibold">Data & Storage</h3>
                    <p className="text-slate-400 mt-1">Manage your data usage and storage preferences</p>
                  </div>
                  
                  <div className="divide-y divide-slate-700">
                    <SettingRow 
                      label="Cache Size" 
                      description="Current app cache usage: 127 MB"
                    >
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                        Clear Cache
                      </button>
                    </SettingRow>

                    <SettingRow 
                      label="Offline Data" 
                      description="Download restaurant data for offline viewing"
                    >
                      <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </SettingRow>

                    <SettingRow 
                      label="Auto-sync" 
                      description="Automatically sync data across devices"
                    >
                      <Toggle 
                        enabled={true}
                        onChange={() => {}}
                      />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Help & Support */}
              {activeSection === 'help' && (
                <div>
                  <div className="p-6 border-b border-slate-700">
                    <h3 className="text-2xl font-semibold">Help & Support</h3>
                    <p className="text-slate-400 mt-1">Get assistance and learn more about using Yum</p>
                  </div>
                  
                  <div className="divide-y divide-slate-700">
                    <SettingRow 
                      label="FAQ" 
                      description="Find answers to commonly asked questions"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </SettingRow>

                    <SettingRow 
                      label="Contact Support" 
                      description="Get help from our support team"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </SettingRow>

                    <SettingRow 
                      label="Report a Problem" 
                      description="Report bugs or issues with the app"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </SettingRow>

                    <SettingRow 
                      label="Privacy Policy" 
                      description="Read our privacy policy and terms of service"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </SettingRow>

                    <SettingRow 
                      label="App Version" 
                      description="Version 2.4.1 (Build 241)"
                    >
                      <span className="text-slate-400 text-sm">Latest</span>
                    </SettingRow>
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
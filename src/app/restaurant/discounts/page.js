'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Percent, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  ArrowLeft,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Gift,
  Tag,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { checkRestaurantProfileComplete, ProfileIncompleteMessage } from '@/lib/restaurantProfileUtils';

export default function RestaurantDiscounts() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [discountStats, setDiscountStats] = useState({
    totalDiscounts: 0,
    activeDiscounts: 0,
    totalSavings: 0,
    redemptions: 0,
    conversionRate: 0
  });
  
  const [discounts, setDiscounts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage', // percentage, fixed, bogo, free_delivery
    value: '',
    code: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    userLimit: '',
    startDate: '',
    endDate: '',
    applicableItems: [],
    customerSegment: 'all', // all, new, returning, vip
    isActive: true
  });
  
  const router = useRouter();

  const fetchDiscounts = async (status = '') => {
    try {
      const url = status ? `/api/restaurant/discounts?status=${status}` : '/api/restaurant/discounts';
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const processedDiscounts = data.discounts.map(discount => ({
            ...discount,
            id: discount._id,
            startDate: new Date(discount.startDate),
            endDate: new Date(discount.endDate)
          }));
          setDiscounts(processedDiscounts);
          setDiscountStats({
            totalDiscounts: data.stats.totalDiscounts,
            activeDiscounts: data.stats.activeDiscounts,
            totalSavings: data.stats.totalRevenue,
            redemptions: data.stats.totalRedemptions,
            conversionRate: data.stats.totalRedemptions > 0 ? ((data.stats.totalRedemptions / data.stats.totalDiscounts) * 100).toFixed(1) : 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    }
  };

  const getTabCounts = () => {
    const allCount = discounts.length;
    const activeCount = discounts.filter(d => d.status === 'active').length;
    const scheduledCount = discounts.filter(d => d.status === 'scheduled').length;
    const expiredCount = discounts.filter(d => d.status === 'expired').length;
    
    return {
      all: allCount,
      active: activeCount,
      scheduled: scheduledCount,
      expired: expiredCount
    };
  };

  const tabCounts = getTabCounts();
  const tabs = [
    { id: 'all', name: 'All Discounts', count: tabCounts.all },
    { id: 'active', name: 'Active', count: tabCounts.active },
    { id: 'scheduled', name: 'Scheduled', count: tabCounts.scheduled },
    { id: 'expired', name: 'Expired', count: tabCounts.expired }
  ];

  const discountTypes = [
    { value: 'percentage', label: 'Percentage Off', icon: Percent },
    { value: 'fixed', label: 'Fixed Amount', icon: DollarSign },
    { value: 'bogo', label: 'Buy One Get One', icon: Gift },
    { value: 'free_delivery', label: 'Free Delivery', icon: ShoppingCart }
  ];

  const customerSegments = [
    { value: 'all', label: 'All Customers' },
    { value: 'new', label: 'New Customers' },
    { value: 'returning', label: 'Returning Customers' },
    { value: 'vip', label: 'VIP Customers' }
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
        
        // Check profile completeness
        const profileCheck = await checkRestaurantProfileComplete();
        if (!profileCheck.isComplete) {
          setProfileIncomplete(true);
          setMissingFields(profileCheck.missingFields);
          setLoading(false);
          return;
        }
        
        await fetchDiscounts();
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Update tab counts
  useEffect(() => {
    const activeCount = discounts.filter(d => d.status === 'active').length;
    const scheduledCount = discounts.filter(d => d.status === 'scheduled').length;
    const expiredCount = discounts.filter(d => d.status === 'expired').length;
    
    tabs[0].count = discounts.length;
    tabs[1].count = activeCount;
    tabs[2].count = scheduledCount;
    tabs[3].count = expiredCount;
  }, [discounts]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'scheduled': return 'text-blue-400 bg-blue-400/20';
      case 'expired': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTypeIcon = (type) => {
    const typeConfig = discountTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : Tag;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDiscountValue = (discount) => {
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}% off`;
      case 'fixed':
        return `$${discount.value} off`;
      case 'bogo':
        return `BOGO ${discount.value}% off`;
      case 'free_delivery':
        return 'Free delivery';
      default:
        return discount.value;
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const filteredDiscounts = discounts.filter(discount => {
    const matchesTab = activeTab === 'all' || discount.status === activeTab;
    const matchesSearch = discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discount.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const handleCreateDiscount = () => {
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      code: generateCode(),
      minOrderAmount: '',
      maxDiscount: '',
      usageLimit: '',
      userLimit: '',
      startDate: '',
      endDate: '',
      applicableItems: [],
      customerSegment: 'all',
      isActive: true
    });
    setShowCreateModal(true);
  };

  const handleEditDiscount = (discount) => {
    setSelectedDiscount(discount);
    setFormData({
      name: discount.name,
      description: discount.description,
      type: discount.type,
      value: discount.value.toString(),
      code: discount.code,
      minOrderAmount: discount.minOrderAmount.toString(),
      maxDiscount: discount.maxDiscount.toString(),
      usageLimit: discount.usageLimit.toString(),
      userLimit: discount.userLimit.toString(),
      startDate: discount.startDate.toISOString().split('T')[0],
      endDate: discount.endDate.toISOString().split('T')[0],
      applicableItems: discount.applicableItems,
      customerSegment: discount.customerSegment,
      isActive: discount.isActive
    });
    setShowEditModal(true);
  };

  const handleSubmitDiscount = async () => {
    try {
      const discountData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value),
        code: formData.code,
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        maxDiscount: parseFloat(formData.maxDiscount) || 0,
        usageLimit: parseInt(formData.usageLimit) || 0,
        userLimit: parseInt(formData.userLimit) || 1,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        applicableItems: formData.applicableItems,
        customerSegment: formData.customerSegment,
        isActive: formData.isActive
      };

      if (selectedDiscount) {
        // Update existing discount
        const response = await fetch(`/api/restaurant/discounts/${selectedDiscount.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(discountData)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            await fetchDiscounts();
            setShowEditModal(false);
            setSelectedDiscount(null);
          }
        } else {
          const errorData = await response.json();
          console.error('Failed to update discount:', errorData.message);
        }
      } else {
        // Create new discount
        const response = await fetch('/api/restaurant/discounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(discountData)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            await fetchDiscounts();
            setShowCreateModal(false);
          }
        } else {
          const errorData = await response.json();
          console.error('Failed to create discount:', errorData.message);
        }
      }
    } catch (error) {
      console.error('Failed to submit discount:', error);
    }
  };



  const handleDeleteDiscount = async (discountId) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        const response = await fetch(`/api/restaurant/discounts/${discountId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            await fetchDiscounts();
          }
        } else {
          const errorData = await response.json();
          console.error('Failed to delete discount:', errorData.message);
        }
      } catch (error) {
        console.error('Failed to delete discount:', error);
      }
    }
  };

  const toggleDiscountStatus = async (discountId) => {
    try {
      const discount = discounts.find(d => d.id === discountId);
      if (!discount) {
        console.error('Discount not found');
        return;
      }
      
      console.log('Discount object:', discount);
      console.log('Current isActive value:', discount.isActive);
      
      const response = await fetch(`/api/restaurant/discounts/${discountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !discount.isActive })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchDiscounts();
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to toggle discount status:', errorData.message || errorData.error || 'Unknown error');
        console.error('Full error response:', errorData);
      }
    } catch (error) {
      console.error('Failed to toggle discount status:', error);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show profile incomplete message if profile is not complete
  if (profileIncomplete) {
    return <ProfileIncompleteMessage missingFields={missingFields} />;
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
                <Percent className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold">Discounts & Promotions</span>
              </div>
            </div>
            
            <button
              onClick={handleCreateDiscount}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Discount</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Tag className="h-6 w-6 text-orange-400" />
              </div>
              <Tag className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{discountStats.totalDiscounts}</h3>
            <p className="text-gray-400 text-sm">Total Discounts</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{discountStats.activeDiscounts}</h3>
            <p className="text-gray-400 text-sm">Active Discounts</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">${discountStats.totalSavings}</h3>
            <p className="text-gray-400 text-sm">Customer Savings</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{discountStats.redemptions}</h3>
            <p className="text-gray-400 text-sm">Total Redemptions</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-yellow-400" />
              </div>
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{discountStats.conversionRate}%</h3>
            <p className="text-gray-400 text-sm">Conversion Rate</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-xl mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                fetchDiscounts(tab.id === 'all' ? '' : tab.id);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search discounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button className="flex items-center space-x-2 text-orange-400 hover:text-orange-300">
              <Filter className="h-4 w-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {/* Discounts List */}
        <div className="space-y-6">
          {filteredDiscounts.map(discount => {
            const IconComponent = getTypeIcon(discount.type);
            const usagePercentage = discount.usageLimit > 0 ? (discount.usedCount / discount.usageLimit) * 100 : 0;
            
            return (
              <div key={discount.id} className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold">{discount.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(discount.status)}`}>
                          {discount.status ? discount.status.charAt(0).toUpperCase() + discount.status.slice(1) : 'Active'}
                        </span>
                        {!discount.isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-400 bg-red-400/20">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 mb-3">{discount.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Discount</p>
                          <p className="font-medium">{formatDiscountValue(discount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Code</p>
                          <div className="flex items-center space-x-2">
                            <p className="font-mono font-medium">{discount.code}</p>
                            <button
                              onClick={() => copyCode(discount.code)}
                              className="text-gray-400 hover:text-white"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400">Valid Period</p>
                          <p className="font-medium">{formatDate(discount.startDate)} - {formatDate(discount.endDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Min Order</p>
                          <p className="font-medium">${discount.minOrderAmount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleDiscountStatus(discount.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        discount.isActive 
                          ? 'text-green-400 hover:bg-green-400/20' 
                          : 'text-gray-400 hover:bg-gray-400/20'
                      }`}
                    >
                      {discount.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleEditDiscount(discount)}
                      className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id)}
                      className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Usage Progress */}
                {discount.usageLimit > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Usage</span>
                      <span className="text-sm text-gray-400">{discount.usedCount}/{discount.usageLimit}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{discount.redemptions}</p>
                    <p className="text-sm text-gray-400">Redemptions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">${discount.revenue}</p>
                    <p className="text-sm text-gray-400">Revenue Impact</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{discount.conversionRate}%</p>
                    <p className="text-sm text-gray-400">Conversion Rate</p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredDiscounts.length === 0 && (
            <div className="text-center py-12">
              <Percent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No discounts found</h3>
              <p className="text-gray-500 mb-4">Create your first discount to start attracting customers.</p>
              <button
                onClick={handleCreateDiscount}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Create Discount
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {showCreateModal ? 'Create New Discount' : 'Edit Discount'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedDiscount(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium mb-4">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Discount Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Weekend Special"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Describe your discount offer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {discountTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formData.type === 'percentage' ? 'Percentage (%)' : 
                     formData.type === 'fixed' ? 'Amount ($)' :
                     formData.type === 'bogo' ? 'Second Item Discount (%)' : 'Value'}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                    disabled={formData.type === 'free_delivery'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Discount Code</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                      placeholder="DISCOUNT20"
                    />
                    <button
                      onClick={() => setFormData({...formData, code: generateCode()})}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium mb-4">Settings & Restrictions</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Order Amount ($)</label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Discount ($)</label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Unlimited"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Per User Limit</label>
                    <input
                      type="number"
                      value={formData.userLimit}
                      onChange={(e) => setFormData({...formData, userLimit: e.target.value})}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Segment</label>
                  <select
                    value={formData.customerSegment}
                    onChange={(e) => setFormData({...formData, customerSegment: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {customerSegments.map(segment => (
                      <option key={segment.value} value={segment.value}>{segment.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedDiscount(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDiscount}
                disabled={!formData.name || !formData.code || !formData.startDate || !formData.endDate}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
              >
                {showCreateModal ? 'Create Discount' : 'Update Discount'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
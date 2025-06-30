'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  ShoppingBag,
  Star,
  TrendingUp,
  User,
  Shield,
  Clock,
  Package
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function CustomerViewPage() {
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCustomerDetails();
    }
  }, [params.id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/customers/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setCustomer(data.customer);
      } else {
        console.error('Failed to fetch customer details');
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${params.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        router.push('/admin/customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const getStatusBadge = (customer) => {
    if (!customer.isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-1" />
          Inactive
        </span>
      );
    }
    if (!customer.isVerified) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-4 h-4 mr-1" />
          Unverified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-4 h-4 mr-1" />
        Active
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-white mb-2">Customer Not Found</h2>
          <p className="text-gray-400 mb-4">The customer you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/customer')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/customer')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-gray-400">Customer Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/admin/customer/edit/${customer._id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                  {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <p className="text-gray-400">@{customer.username}</p>
                  {getStatusBadge(customer)}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  {customer.email}
                </div>
                {customer.phone && (
                  <div className="flex items-center text-gray-300">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    {customer.phone}
                  </div>
                )}
                <div className="flex items-center text-gray-300">
                  <User className="w-4 h-4 mr-3 text-gray-400" />
                  {customer.role.charAt(0).toUpperCase() + customer.role.slice(1)}
                </div>
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  Joined {formatDate(customer.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          {customer.address && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Address Information</h2>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div className="text-gray-300">
                  {customer.address.street && <p>{customer.address.street}</p>}
                  <p>
                    {customer.address.city && `${customer.address.city}, `}
                    {customer.address.state && `${customer.address.state} `}
                    {customer.address.zipCode}
                  </p>
                  {customer.address.country && <p>{customer.address.country}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
            {customer.recentOrders && customer.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {customer.recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">Order #{order._id.slice(-6)}</p>
                        <p className="text-gray-400 text-sm">
                          {order.restaurantId?.name || 'Unknown Restaurant'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-gray-400 text-sm">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No orders found</p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          {/* Order Statistics */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Order Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Total Orders</span>
                </div>
                <span className="text-white font-semibold">{customer.stats?.orders?.totalOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Total Spent</span>
                </div>
                <span className="text-white font-semibold">
                  {formatCurrency(customer.stats?.orders?.totalSpent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Avg Order Value</span>
                </div>
                <span className="text-white font-semibold">
                  {formatCurrency(customer.stats?.orders?.avgOrderValue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Completed</span>
                </div>
                <span className="text-white font-semibold">{customer.stats?.orders?.completedOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-gray-300">Cancelled</span>
                </div>
                <span className="text-white font-semibold">{customer.stats?.orders?.cancelledOrders || 0}</span>
              </div>
            </div>
          </div>

          {/* Review Statistics */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Review Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Total Reviews</span>
                </div>
                <span className="text-white font-semibold">{customer.stats?.reviews?.totalReviews || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Avg Rating</span>
                </div>
                <span className="text-white font-semibold">
                  {customer.stats?.reviews?.avgRating ? customer.stats.reviews.avgRating.toFixed(1) : '0.0'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Verified</span>
                </div>
                <span className={`text-sm font-medium ${
                  customer.isVerified ? 'text-green-400' : 'text-red-400'
                }`}>
                  {customer.isVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Active</span>
                </div>
                <span className={`text-sm font-medium ${
                  customer.isActive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {customer.isActive ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Last Updated</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {formatDate(customer.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete {customer.firstName} {customer.lastName}? 
              This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
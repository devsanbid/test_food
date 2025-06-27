"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/authActions';
import { 
  Search, 
  ChevronDown, 
  Star, 
  Eye,
  Filter,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

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

const OrderListPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    restaurantId: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchOrders();
    }
  }, [filters, pagination.currentPage]);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || user.role !== 'admin') {
        router.push('/login');
        return;
      }
      setLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '10',
        ...filters
      });

      const response = await fetch(`/api/admin/orders/list?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setPagination(data.pagination);
        setStats(data.stats);
        setRestaurants(data.restaurants);
      } else {
        setToast({ message: data.message || 'Failed to fetch orders', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setToast({ message: 'Failed to fetch orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch('/api/admin/orders/list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action: 'update-status',
          status: newStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        setToast({ message: 'Order status updated successfully', type: 'success' });
        fetchOrders();
      } else {
        setToast({ message: data.message || 'Failed to update order', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setToast({ message: 'Failed to update order', type: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-purple-500';
      case 'picked_up': return 'bg-indigo-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Toast Component
  const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 
        'bg-blue-600'
      } text-white`}>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <button onClick={onClose} className="ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < fullStars 
                ? 'fill-yellow-400 text-yellow-400' 
                : i === fullStars && hasHalfStar 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getDishIcon = (dish) => {
    const iconClass = "w-6 h-6 text-orange-400";
    if (dish.includes('Pizza')) return '🍕';
    if (dish.includes('Burger')) return '🍔';
    if (dish.includes('Spaghetti')) return '🍝';
    if (dish.includes('Salad')) return '🥗';
    if (dish.includes('Cake')) return '🎂';
    if (dish.includes('Coffee')) return '☕';
    if (dish.includes('Dumplings')) return '🥟';
    if (dish.includes('Thali')) return '🍛';
    if (dish.includes('Hummus')) return '🫘';
    if (dish.includes('Cookies')) return '🍪';
    return '🍽️';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orders Management</h1>
        <p className="text-gray-400">Manage and track all orders across restaurants</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <div className="flex items-center space-x-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search orders..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Restaurant</label>
                <select
                  value={filters.restaurantId}
                  onChange={(e) => handleFilterChange('restaurantId', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">All Restaurants</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white">{stats.totalOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Pending Orders</p>
              <p className="text-2xl font-bold text-white">{stats.pendingOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Completed Orders</p>
              <p className="text-2xl font-bold text-white">{stats.completedOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

        <div className="flex flex-1">
          {/* Main Dashboard Content */}
          <div className="flex-1 p-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-400 mb-6">
              <span>Orders</span>
              <ChevronDown className="w-4 h-4 mx-2 rotate-[-90deg]" />
              <span className="text-orange-500">Orders List</span>
            </div>

            <h1 className="text-2xl font-bold mb-6">Orders List</h1>

      {/* Orders Table */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Orders</h2>
          <div className="flex items-center space-x-4">
            {selectedOrders.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">{selectedOrders.length} selected</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      selectedOrders.forEach(orderId => {
                        const order = orders.find(o => o._id === orderId);
                        if (order) {
                          handleStatusUpdate(order._id, e.target.value);
                        }
                      });
                      setSelectedOrders([]);
                    }
                  }}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Bulk Actions</option>
                  <option value="confirmed">Mark as Confirmed</option>
                  <option value="preparing">Mark as Preparing</option>
                  <option value="ready">Mark as Ready</option>
                  <option value="out_for_delivery">Mark as Out for Delivery</option>
                  <option value="delivered">Mark as Delivered</option>
                  <option value="cancelled">Mark as Cancelled</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(orders.map(order => order._id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                    className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                  />
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Order ID</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Customer</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Restaurant</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders([...selectedOrders, order._id]);
                        } else {
                          setSelectedOrders(selectedOrders.filter(id => id !== order._id));
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                    />
                  </td>
                  <td className="py-4 px-4 text-white font-medium">#{order.orderNumber || order._id.slice(-6)}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-full mr-3 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {order.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-white">{order.user?.name || 'Unknown User'}</div>
                        <div className="text-gray-400 text-sm">{order.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-white">{order.restaurant?.name || 'Unknown Restaurant'}</div>
                    <div className="text-gray-400 text-sm">{order.restaurant?.address}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{formatDate(order.createdAt)}</td>
                  <td className="py-4 px-4 text-white font-medium">{formatCurrency(order.totalAmount)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => router.push(`/admin/order/detail?id=${order._id}`)}
                        className="text-orange-500 hover:text-orange-400 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
         <div className="flex items-center justify-between mt-6">
           <div className="text-sm text-gray-400">
             Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
           </div>
           <div className="flex items-center space-x-2">
             <button
               onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
               disabled={pagination.page === 1}
               className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
             >
               Previous
             </button>
             <span className="px-3 py-1 bg-orange-500 rounded text-sm">
               {pagination.page}
             </span>
             <button
               onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
               disabled={pagination.page * pagination.limit >= pagination.total}
               className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
             >
               Next
             </button>
           </div>
         </div>
      </div>

    </div>
    </div>
    </div>
  );
};

export default OrderListPage;
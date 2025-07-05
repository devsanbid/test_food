"use client"
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/authActions';
import { 
  Search,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Eye,
  Trash2,
  Filter,
  AlertCircle,
  CheckCircle,
  Store,
  Users,
  DollarSign,
  TrendingUp
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

const RestaurantDashboard = () => {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalRevenue: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'name'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || user.role !== 'admin') {
        router.push('/login');
        return false;
      }
      return true;
    } catch (error) {
      router.push('/login');
      return false;
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: filters.status,
        sortBy: filters.sortBy
      });

      const response = await fetch(`/api/admin/restaurants?${params}`);
      const data = await response.json();

      if (data.success) {
        setRestaurants(data.restaurants || []);
        setStats(data.stats || {
          totalRestaurants: 0,
          activeRestaurants: 0,
          totalRevenue: 0,
          totalOrders: 0
        });
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError(data.message || 'Failed to fetch restaurants');
        showToast(data.message || 'Failed to fetch restaurants', 'error');
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to fetch restaurants');
      showToast('Failed to fetch restaurants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        showToast('Restaurant deleted successfully');
        fetchRestaurants();
      } else {
        showToast(data.message || 'Failed to delete restaurant', 'error');
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      showToast('Failed to delete restaurant', 'error');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  useEffect(() => {
    checkAuth().then(isAuthenticated => {
      if (isAuthenticated) {
        fetchRestaurants();
      }
    });
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRestaurants();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, currentPage]);

  if (loading && restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error && restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  const bgColors = [
    "from-blue-500 to-cyan-500",
    "from-yellow-500 to-orange-500",
    "from-red-500 to-pink-500",
    "from-purple-500 to-indigo-500",
    "from-green-500 to-emerald-500",
    "from-pink-500 to-purple-500"
  ];

  const icons = ["🍽️", "🥞", "❤️", "🌙", "🍌", "🍕", "🌿", "🔮"];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Restaurant Management</h1>
            <p className="text-gray-400 mt-1">Manage all restaurants in the system</p>
          </div>
          <button
            onClick={() => router.push('/admin/restaurant/add')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Restaurant
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Restaurants</p>
                <p className="text-2xl font-bold text-white">{stats.totalRestaurants}</p>
              </div>
              <Store className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Restaurants</p>
                <p className="text-2xl font-bold text-white">{stats.activeRestaurants}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="name">Sort by Name</option>
              <option value="createdAt">Sort by Date</option>
              <option value="totalOrders">Sort by Orders</option>
              <option value="revenue">Sort by Revenue</option>
            </select>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading restaurants...</div>
            </div>
          )}

          {!loading && restaurants.length === 0 && (
            <div className="text-center py-8">
              <Store className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No restaurants found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first restaurant</p>
              <button
                onClick={() => router.push('/admin/restaurant/add')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Add Restaurant
              </button>
            </div>
          )}

          {!loading && restaurants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant, index) => {
                const bgColor = bgColors[index % bgColors.length];
                const icon = icons[index % icons.length];
                
                return (
                  <div key={restaurant._id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-orange-500 transition-colors">
                    <div className={`h-32 bg-gradient-to-r ${bgColor} flex items-center justify-center`}>
                      <span className="text-4xl">{icon}</span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg">{restaurant.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            restaurant.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            restaurant.status === 'inactive' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {restaurant.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">Account: @{restaurant.owner?.username || 'N/A'}</p>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Total Menu Items</span>
                          <span className="font-semibold">{restaurant.totalMenuItems || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Total Orders</span>
                          <span className="font-semibold">{restaurant.totalOrders || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Revenue</span>
                          <span className="font-semibold text-green-400">{formatCurrency(restaurant.totalRevenue)}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-400 text-sm">
                            {restaurant.address ? 
                              `${restaurant.address.street || ''}, ${restaurant.address.city || ''}, ${restaurant.address.state || ''} ${restaurant.address.zipCode || ''}`.replace(/^,\s*|,\s*$|,\s*,/g, '').trim() || 'No address provided'
                              : 'No address provided'
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          <p className="text-gray-400 text-sm">{restaurant.email || 'No email provided'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          <p className="text-gray-400 text-sm">{restaurant.phone || 'No phone provided'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => router.push(`/admin/restaurant/details/${restaurant._id}`)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button 
                          onClick={() => router.push(`/admin/restaurant/edit/${restaurant._id}`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRestaurant(restaurant._id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {restaurants.length > 0 && (
          <div className="flex items-center justify-between p-6">
            <p className="text-gray-400 text-sm">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, restaurants.length)} of {stats.totalRestaurants} restaurants
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDashboard;
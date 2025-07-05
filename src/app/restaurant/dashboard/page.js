'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChefHat, 
  ShoppingBag, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Users, 
  Clock, 
  Bell,
  Settings,
  LogOut,
  User,
  Eye,
  Package,
  BarChart3,
  MessageSquare,
  Percent
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { checkRestaurantProfileComplete, ProfileIncompleteModal } from '@/lib/restaurantProfileUtils';

export default function RestaurantDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    activeMenuItems: 0,
    pendingOrders: 0,
    todayOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const router = useRouter();

  // API fetch functions
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/restaurant/stats');
      const data = await response.json();
      if (data.success) {
        setStats({
          totalOrders: data.stats.orders.total,
          totalRevenue: data.stats.revenue.total,
          averageRating: data.stats.rating.average,
          activeMenuItems: stats.activeMenuItems, // Will be updated by fetchMenuStats
          pendingOrders: data.stats.orders.pending,
          todayOrders: data.stats.orders.today
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics');
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await fetch('/api/restaurant/recent-orders');
      const data = await response.json();
      if (data.success) {
        const formattedOrders = data.orders.map(order => ({
          id: order.orderNumber || order._id,
          customerName: `${order.user.firstName} ${order.user.lastName}`,
          items: order.items.map(item => item.name),
          total: order.totalAmount,
          status: order.status,
          orderTime: getTimeAgo(order.createdAt),
          estimatedTime: getEstimatedTime(order.status, order.createdAt)
        }));
        setRecentOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setError('Failed to load recent orders');
    }
  };

  const fetchTopDishes = async () => {
    try {
      const response = await fetch('/api/restaurant/top-dishes');
      const data = await response.json();
      if (data.success) {
        const formattedDishes = data.dishes.map((dish, index) => ({
          id: dish._id,
          name: dish.name,
          orders: dish.totalOrdered,
          revenue: dish.revenue,
          rating: 4.5, // Default rating, can be enhanced later
          image: getDishEmoji(dish.name)
        }));
        setTopDishes(formattedDishes);
      }
    } catch (error) {
      console.error('Error fetching top dishes:', error);
      setError('Failed to load top dishes');
    }
  };

  const fetchMenuStats = async () => {
    try {
      const response = await fetch('/api/restaurant/menu');
      const data = await response.json();
      if (data.success) {
        setStats(prevStats => ({
          ...prevStats,
          activeMenuItems: data.stats.availableItems
        }));
      }
    } catch (error) {
      console.error('Error fetching menu stats:', error);
    }
  };

  // Helper functions
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - orderDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getEstimatedTime = (status, createdAt) => {
    switch (status) {
      case 'pending': return '15-20 mins';
      case 'preparing': return '10-15 mins';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getDishEmoji = (dishName) => {
    const name = dishName.toLowerCase();
    if (name.includes('biryani') || name.includes('rice')) return '🍛';
    if (name.includes('pizza')) return '🍕';
    if (name.includes('burger')) return '🍔';
    if (name.includes('chicken')) return '🍗';
    if (name.includes('noodle') || name.includes('pasta')) return '🍝';
    if (name.includes('salad')) return '🥗';
    if (name.includes('soup')) return '🍲';
    if (name.includes('sandwich')) return '🥪';
    if (name.includes('taco')) return '🌮';
    if (name.includes('curry')) return '🍛';
    return '🍽️';
  };

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
          setShowProfileModal(true);
        }
        
        // Fetch dashboard data
        await Promise.all([
          fetchStats(),
          fetchRecentOrders(),
          fetchTopDishes(),
          fetchMenuStats()
        ]);
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-500/20 text-yellow-400';
      case 'ready': return 'bg-green-500/20 text-green-400';
      case 'delivered': return 'bg-blue-500/20 text-blue-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProfileIncompleteModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        missingFields={missingFields} 
      />
      
      <div className="min-h-screen bg-gray-900 text-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Restaurant Dashboard</h1>
          <p className="text-gray-400">Manage your restaurant operations and track performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-400" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.totalOrders}</h3>
            <p className="text-gray-400 text-sm">Total Orders</p>
            <p className="text-green-400 text-xs mt-1">+{stats.todayOrders} today</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">${stats.totalRevenue.toFixed(2)}</h3>
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-green-400 text-xs mt-1">+12.5% this month</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.averageRating.toFixed(1)}</h3>
            <p className="text-gray-400 text-sm">Average Rating</p>
            <p className="text-green-400 text-xs mt-1">+0.2 this week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Orders</h2>
                <Link href="/restaurant/orders" className="text-orange-500 hover:text-orange-400 text-sm flex items-center">
                  View All <Eye className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent orders found</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">#{order.id}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">{order.customerName}</p>
                      <p className="text-gray-300 text-sm">{order.items.join(', ')}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-green-400 font-semibold">${order.total}</span>
                        <div className="text-xs text-gray-400">
                          <span>{order.orderTime}</span>
                          <span className="mx-2">•</span>
                          <span>{order.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-6">Top Performing Dishes</h2>
              
              <div className="space-y-4">
                {topDishes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No dish data available</p>
                  </div>
                ) : (
                  topDishes.map((dish) => (
                  <div key={dish.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{dish.image}</div>
                      <div>
                        <h3 className="font-semibold">{dish.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{dish.orders} orders</span>
                          <span>•</span>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{dish.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-400">${dish.revenue.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Revenue</p>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
              <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
              
              <div className="space-y-3">
                <Link href="/restaurant/menu" className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                  <Package className="h-5 w-5 text-orange-500" />
                  <span>Manage Menu</span>
                </Link>
                
                <Link href="/restaurant/orders" className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                  <ShoppingBag className="h-5 w-5 text-blue-500" />
                  <span>View Orders</span>
                </Link>
                
                <Link href="/restaurant/analytics" className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  <span>Analytics</span>
                </Link>
                
                <Link href="/restaurant/profile" className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                  <Settings className="h-5 w-5 text-purple-500" />
                  <span>Restaurant Profile</span>
                </Link>
                
                <Link href="/restaurant/reviews" className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                  <MessageSquare className="h-5 w-5 text-yellow-500" />
                  <span>Reviews & Ratings</span>
                </Link>
                
                <Link href="/restaurant/discounts" className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                  <Percent className="h-5 w-5 text-red-500" />
                  <span>Manage Discounts</span>
                </Link>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Today's Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Orders Today</span>
                  <span className="font-semibold">{stats.todayOrders}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Pending Orders</span>
                  <span className="font-semibold text-yellow-400">{stats.pendingOrders}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Menu Items</span>
                  <span className="font-semibold">{stats.activeMenuItems}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="font-semibold">{stats.averageRating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
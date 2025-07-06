'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  ShoppingBag, 
  Clock, 
  Heart, 
  Settings,
  Star,
  TrendingUp,
  Search,
  AlertCircle
} from 'lucide-react';
import { getCurrentUser, getDashboardData } from '@/actions/authActions';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'user') {
          router.push('/login');
          return;
        }
        setUser(userData);
        
        const dashboardResult = await getDashboardData();
        setDashboardData(dashboardResult);
        
      } catch (error) {
        console.error('Dashboard data fetch failed:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Data Available</h2>
          <p className="text-gray-400">Unable to load dashboard data at this time.</p>
        </div>
      </div>
    );
  }

  const { stats, recentOrders, favoriteRestaurants } = dashboardData;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Ready to order something delicious?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-400" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.orders?.totalOrders || 0}</h3>
            <p className="text-gray-400 text-sm">Total Orders</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-400" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{stats.favorites || 0}</h3>
            <p className="text-gray-400 text-sm">Favorite Restaurants</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <span className="text-green-400 font-bold">$</span>
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">${stats.orders?.totalSpent?.toFixed(2) || '0.00'}</h3>
            <p className="text-gray-400 text-sm">Total Spent</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{dashboardData.user?.loyaltyPoints?.current || 0}</h3>
            <p className="text-gray-400 text-sm">Reward Points</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Quick Actions</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Link 
                  href="/user/foodlist" 
                  className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-xl transition-all transform hover:scale-105 flex items-center space-x-4 group"
                >
                  <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Order Food</h3>
                    <p className="text-orange-100 text-sm">Browse restaurants & order</p>
                  </div>
                </Link>
                
                <Link 
                  href="/user/orderhistory" 
                  className="bg-gray-700 hover:bg-gray-600 text-white p-6 rounded-xl transition-all transform hover:scale-105 flex items-center space-x-4"
                >
                  <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Order History</h3>
                    <p className="text-gray-300 text-sm">View past orders</p>
                  </div>
                </Link>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                <div className="space-y-4">
                  {recentOrders && recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div key={order._id} className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{order.restaurant?.name || 'Unknown Restaurant'}</h4>
                          <p className="text-gray-400 text-sm">
                            {order.items?.map(item => `${item.name} x${item.quantity}`).join(', ') || 'Order details unavailable'}
                          </p>
                          <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">${order.pricing?.total?.toFixed(2) || '0.00'}</p>
                          <span className={`text-xs capitalize ${
                            order.status === 'delivered' ? 'text-green-400' :
                            order.status === 'cancelled' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">No recent orders found</p>
                      <Link href="/user/foodlist" className="text-orange-500 hover:text-orange-400 text-sm mt-2 inline-block">
                        Start ordering now
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Favorite Restaurants</h3>
              <div className="space-y-4">
                {favoriteRestaurants && favoriteRestaurants.length > 0 ? (
                  favoriteRestaurants.map((restaurant) => (
                    <div key={restaurant._id} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                        {restaurant.logo ? (
                          <img src={restaurant.logo} alt={restaurant.name} className="w-8 h-8 rounded" />
                        ) : (
                          <span className="text-lg">🍽️</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm">{restaurant.name}</h4>
                        <p className="text-gray-400 text-xs">{restaurant.cuisine}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-300">{restaurant.rating?.average?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-400 text-xs">
                            {restaurant.deliveryTime ? 
                              `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max} min` : 
                              'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">No favorite restaurants yet</p>
                    <Link href="/user/foodlist" className="text-orange-500 hover:text-orange-400 text-sm">
                      Discover restaurants
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link href="/user/profile" className="flex items-center space-x-3 text-gray-300 hover:text-orange-500 transition-colors">
                  <User className="h-5 w-5" />
                  <span>Profile Settings</span>
                </Link>
                <Link href="/user/settings" className="flex items-center space-x-3 text-gray-300 hover:text-orange-500 transition-colors">
                  <Settings className="h-5 w-5" />
                  <span>Account Settings</span>
                </Link>
                <Link href="/user/foodlist" className="flex items-center space-x-3 text-gray-300 hover:text-orange-500 transition-colors">
                  <Search className="h-5 w-5" />
                  <span>Browse Restaurants</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
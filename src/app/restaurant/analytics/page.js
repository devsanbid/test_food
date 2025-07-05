'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Star,
  Calendar,
  Download,
  Filter,
  ArrowLeft,
  Clock,
  Target,
  Award,
  Eye
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { checkRestaurantProfileComplete, ProfileIncompleteMessage } from '@/lib/restaurantProfileUtils';

export default function RestaurantAnalytics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [dateRange, setDateRange] = useState('week');
  const [analytics, setAnalytics] = useState({
    revenue: {
      current: 0,
      previous: 0,
      change: 0
    },
    orders: {
      current: 0,
      previous: 0,
      change: 0
    },
    customers: {
      current: 0,
      previous: 0,
      change: 0
    },
    rating: {
      current: 0,
      previous: 0,
      change: 0
    }
  });
  const [chartData, setChartData] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const router = useRouter();

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
        
        // Mock analytics data based on date range
        const mockAnalytics = {
          week: {
            revenue: { current: 3250.75, previous: 2890.50, change: 12.5 },
            orders: { current: 156, previous: 142, change: 9.9 },
            customers: { current: 89, previous: 78, change: 14.1 },
            rating: { current: 4.6, previous: 4.4, change: 4.5 }
          },
          month: {
            revenue: { current: 14250.75, previous: 12890.50, change: 10.5 },
            orders: { current: 678, previous: 612, change: 10.8 },
            customers: { current: 234, previous: 198, change: 18.2 },
            rating: { current: 4.6, previous: 4.3, change: 7.0 }
          },
          year: {
            revenue: { current: 125250.75, previous: 98890.50, change: 26.7 },
            orders: { current: 5678, previous: 4512, change: 25.8 },
            customers: { current: 1234, previous: 998, change: 23.6 },
            rating: { current: 4.6, previous: 4.2, change: 9.5 }
          }
        };
        
        setAnalytics(mockAnalytics[dateRange]);
        
        // Mock chart data
        const mockChartData = {
          week: [
            { label: 'Mon', revenue: 450, orders: 22 },
            { label: 'Tue', revenue: 520, orders: 28 },
            { label: 'Wed', revenue: 380, orders: 18 },
            { label: 'Thu', revenue: 620, orders: 32 },
            { label: 'Fri', revenue: 750, orders: 38 },
            { label: 'Sat', revenue: 680, orders: 34 },
            { label: 'Sun', revenue: 590, orders: 29 }
          ],
          month: [
            { label: 'Week 1', revenue: 2450, orders: 122 },
            { label: 'Week 2', revenue: 2820, orders: 148 },
            { label: 'Week 3', revenue: 3180, orders: 156 },
            { label: 'Week 4', revenue: 3250, orders: 162 }
          ],
          year: [
            { label: 'Jan', revenue: 8450, orders: 422 },
            { label: 'Feb', revenue: 9520, orders: 478 },
            { label: 'Mar', revenue: 10380, orders: 518 },
            { label: 'Apr', revenue: 11620, orders: 582 },
            { label: 'May', revenue: 12750, orders: 638 },
            { label: 'Jun', revenue: 11680, orders: 584 },
            { label: 'Jul', revenue: 13590, orders: 679 },
            { label: 'Aug', revenue: 14250, orders: 712 },
            { label: 'Sep', revenue: 12890, orders: 644 },
            { label: 'Oct', revenue: 13450, orders: 672 },
            { label: 'Nov', revenue: 14120, orders: 706 },
            { label: 'Dec', revenue: 15250, orders: 762 }
          ]
        };
        
        setChartData(mockChartData[dateRange]);
        
        // Mock top dishes data
        setTopDishes([
          {
            id: 1,
            name: 'Chicken Biryani',
            orders: 156,
            revenue: 3900.00,
            rating: 4.8,
            trend: 'up',
            change: 15.2
          },
          {
            id: 2,
            name: 'Margherita Pizza',
            orders: 89,
            revenue: 1646.50,
            rating: 4.6,
            trend: 'up',
            change: 8.5
          },
          {
            id: 3,
            name: 'Beef Burger',
            orders: 67,
            revenue: 1005.00,
            rating: 4.4,
            trend: 'down',
            change: -3.2
          },
          {
            id: 4,
            name: 'Caesar Salad',
            orders: 45,
            revenue: 540.00,
            rating: 4.3,
            trend: 'up',
            change: 12.8
          },
          {
            id: 5,
            name: 'Chocolate Brownie',
            orders: 78,
            revenue: 663.00,
            rating: 4.9,
            trend: 'up',
            change: 22.1
          }
        ]);
        
        // Mock recent reviews
        setRecentReviews([
          {
            id: 1,
            customerName: 'John Doe',
            rating: 5,
            comment: 'Amazing food quality and fast delivery!',
            dish: 'Chicken Biryani',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            id: 2,
            customerName: 'Sarah Wilson',
            rating: 4,
            comment: 'Good taste but could be a bit warmer.',
            dish: 'Margherita Pizza',
            date: new Date(Date.now() - 5 * 60 * 60 * 1000)
          },
          {
            id: 3,
            customerName: 'Mike Johnson',
            rating: 5,
            comment: 'Perfect burger, exactly as ordered!',
            dish: 'Beef Burger',
            date: new Date(Date.now() - 8 * 60 * 60 * 1000)
          }
        ]);
        
        // Mock hourly data
        setHourlyData([
          { hour: '9 AM', orders: 5, revenue: 125 },
          { hour: '10 AM', orders: 8, revenue: 200 },
          { hour: '11 AM', orders: 12, revenue: 300 },
          { hour: '12 PM', orders: 25, revenue: 625 },
          { hour: '1 PM', orders: 32, revenue: 800 },
          { hour: '2 PM', orders: 18, revenue: 450 },
          { hour: '3 PM', orders: 10, revenue: 250 },
          { hour: '4 PM', orders: 8, revenue: 200 },
          { hour: '5 PM', orders: 15, revenue: 375 },
          { hour: '6 PM', orders: 28, revenue: 700 },
          { hour: '7 PM', orders: 35, revenue: 875 },
          { hour: '8 PM', orders: 30, revenue: 750 },
          { hour: '9 PM', orders: 22, revenue: 550 },
          { hour: '10 PM', orders: 12, revenue: 300 }
        ]);
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (change) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
  const maxOrders = Math.max(...chartData.map(d => d.orders));

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
                <BarChart3 className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold">Analytics & Reports</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getChangeColor(analytics.revenue.change)}`}>
                {getChangeIcon(analytics.revenue.change)}
                <span>{formatPercentage(analytics.revenue.change)}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{formatCurrency(analytics.revenue.current)}</h3>
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-1">vs {formatCurrency(analytics.revenue.previous)} last period</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-400" />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getChangeColor(analytics.orders.change)}`}>
                {getChangeIcon(analytics.orders.change)}
                <span>{formatPercentage(analytics.orders.change)}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{analytics.orders.current}</h3>
            <p className="text-gray-400 text-sm">Total Orders</p>
            <p className="text-xs text-gray-500 mt-1">vs {analytics.orders.previous} last period</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getChangeColor(analytics.customers.change)}`}>
                {getChangeIcon(analytics.customers.change)}
                <span>{formatPercentage(analytics.customers.change)}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{analytics.customers.current}</h3>
            <p className="text-gray-400 text-sm">Unique Customers</p>
            <p className="text-xs text-gray-500 mt-1">vs {analytics.customers.previous} last period</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getChangeColor(analytics.rating.change)}`}>
                {getChangeIcon(analytics.rating.change)}
                <span>{formatPercentage(analytics.rating.change)}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{analytics.rating.current}</h3>
            <p className="text-gray-400 text-sm">Average Rating</p>
            <p className="text-xs text-gray-500 mt-1">vs {analytics.rating.previous} last period</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Revenue & Orders Trend</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400">Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-400">Orders</span>
                </div>
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                  <div className="w-full flex flex-col items-center space-y-1">
                    <div 
                      className="w-full bg-green-500/30 rounded-t-lg relative group cursor-pointer"
                      style={{ height: `${(data.revenue / maxRevenue) * 200}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-700 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatCurrency(data.revenue)}
                      </div>
                    </div>
                    <div 
                      className="w-full bg-blue-500/30 rounded-t-lg relative group cursor-pointer"
                      style={{ height: `${(data.orders / maxOrders) * 100}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-700 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {data.orders} orders
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{data.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Dishes */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Top Performing Dishes</h2>
              <Link href="/restaurant/menu" className="text-orange-500 hover:text-orange-400 text-sm flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {topDishes.slice(0, 5).map((dish, index) => (
                <div key={dish.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-sm font-bold text-orange-400">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{dish.name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{dish.orders} orders</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          <span>{dish.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400 text-sm">{formatCurrency(dish.revenue)}</p>
                    <div className={`flex items-center text-xs ${dish.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {dish.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      <span>{formatPercentage(dish.change)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hourly Performance */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-6">Hourly Performance</h2>
            
            <div className="space-y-3">
              {hourlyData.map((hour, index) => {
                const maxHourlyOrders = Math.max(...hourlyData.map(h => h.orders));
                const orderPercentage = (hour.orders / maxHourlyOrders) * 100;
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 w-20">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-400">{hour.hour}</span>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${orderPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right w-24">
                      <p className="text-sm font-medium">{hour.orders} orders</p>
                      <p className="text-xs text-gray-400">{formatCurrency(hour.revenue)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Recent Reviews</h2>
              <Link href="/restaurant/reviews" className="text-orange-500 hover:text-orange-400 text-sm flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">{review.customerName.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-sm">{review.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{review.comment}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{review.dish}</span>
                    <span>{review.date.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
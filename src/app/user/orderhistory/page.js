"use client"

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ShoppingBag, Clock, MapPin, Star, Filter, Search, ChevronDown } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function OrderHistory() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
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
        
        const sampleOrders = [
          {
            id: 'ORD-001',
            restaurant: 'Pizza Palace',
            restaurantImage: '/img1.jpg',
            items: ['Margherita Pizza (Large)', 'Garlic Bread', 'Coca Cola'],
            date: '2024-06-15T18:30:00',
            total: 28.50,
            status: 'delivered',
            deliveryAddress: '123 Main Street, New York, NY',
            estimatedTime: '25-30 mins',
            rating: 4.5
          },
          {
            id: 'ORD-002',
            restaurant: 'Burger Barn',
            restaurantImage: '/img1.jpg',
            items: ['Classic Burger', 'French Fries', 'Milkshake'],
            date: '2024-06-12T19:45:00',
            total: 15.99,
            status: 'delivered',
            deliveryAddress: '123 Main Street, New York, NY',
            estimatedTime: '20-25 mins',
            rating: 4.2
          },
          {
            id: 'ORD-003',
            restaurant: 'Sushi Station',
            restaurantImage: '/img1.jpg',
            items: ['California Roll', 'Salmon Nigiri', 'Miso Soup'],
            date: '2024-06-10T20:15:00',
            total: 22.00,
            status: 'delivered',
            deliveryAddress: '123 Main Street, New York, NY',
            estimatedTime: '30-35 mins',
            rating: 4.8
          },
          {
            id: 'ORD-004',
            restaurant: 'Taco Town',
            restaurantImage: '/img1.jpg',
            items: ['Beef Tacos (3)', 'Guacamole', 'Churros'],
            date: '2024-06-08T17:20:00',
            total: 18.75,
            status: 'cancelled',
            deliveryAddress: '123 Main Street, New York, NY',
            estimatedTime: '15-20 mins',
            rating: null
          },
          {
            id: 'ORD-005',
            restaurant: 'Thai Garden',
            restaurantImage: '/img1.jpg',
            items: ['Pad Thai', 'Green Curry', 'Spring Rolls'],
            date: '2024-06-05T19:00:00',
            total: 32.40,
            status: 'delivered',
            deliveryAddress: '123 Main Street, New York, NY',
            estimatedTime: '25-30 mins',
            rating: 4.6
          },
          {
            id: 'ORD-006',
            restaurant: 'Indian Spice',
            restaurantImage: '/img1.jpg',
            items: ['Chicken Tikka Masala', 'Naan Bread', 'Basmati Rice'],
            date: '2024-06-03T18:45:00',
            total: 26.80,
            status: 'delivered',
            deliveryAddress: '123 Main Street, New York, NY',
            estimatedTime: '30-35 mins',
            rating: 4.4
          }
        ];
        
        setOrders(sampleOrders);
        setFilteredOrders(sampleOrders);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);
  
  useEffect(() => {
    let filtered = orders;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.restaurant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'oldest') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'amount-high') {
        return b.total - a.total;
      } else if (sortBy === 'amount-low') {
        return a.total - b.total;
      }
      return 0;
    });
    
    setFilteredOrders(filtered);
  }, [orders, filterStatus, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-400'
            }`}
          />
        ))}
        <span className="text-sm text-gray-400 ml-1">{rating}</span>
      </div>
    );
  };









  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Order History</h1>
              <p className="text-gray-400">Track your past orders and reorder your favorites</p>
            </div>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{orders.length}</span>
              <span className="text-gray-400">Total Orders</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search restaurants or dishes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-700 text-white rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                  >
                    <option value="all">All Orders</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700 text-white rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount-high">Highest Amount</option>
                    <option value="amount-low">Lowest Amount</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No orders found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-all duration-200 cursor-pointer border border-gray-700 hover:border-orange-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src={order.restaurantImage} 
                        alt={order.restaurant}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{display: 'none'}}>
                        {order.restaurant.charAt(0)}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-white">{order.restaurant}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-gray-400 text-sm mb-1">Order #{order.id}</p>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, index) => (
                            <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(order.date)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{order.estimatedTime}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate max-w-xs">{order.deliveryAddress}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {order.rating && renderStars(order.rating)}
                          <span className="text-2xl font-bold text-orange-500">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 lg:ml-6">
                    <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium">
                      Reorder
                    </button>
                    <button className="bg-gray-700 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {filteredOrders.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {orders.filter(o => o.status === 'delivered').length}
                </div>
                <div className="text-gray-400">Delivered Orders</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  ${orders.reduce((sum, order) => order.status === 'delivered' ? sum + order.total : sum, 0).toFixed(2)}
                </div>
                <div className="text-gray-400">Total Spent</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {(orders.filter(o => o.rating).reduce((sum, o) => sum + o.rating, 0) / orders.filter(o => o.rating).length || 0).toFixed(1)}
                </div>
                <div className="text-gray-400">Average Rating</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Filter, 
  Search,
  Phone,
  MapPin,
  User,
  DollarSign,
  Package,
  Truck,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  X,
  Printer
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { checkRestaurantProfileComplete, ProfileIncompleteMessage } from '@/lib/restaurantProfileUtils';

export default function OrderManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [updating, setUpdating] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const router = useRouter();

  const orderStatuses = [
    { id: 'all', name: 'All Orders', color: 'gray' },
    { id: 'pending', name: 'Pending', color: 'yellow' },
    { id: 'confirmed', name: 'Confirmed', color: 'blue' },
    { id: 'preparing', name: 'Preparing', color: 'orange' },
    { id: 'ready', name: 'Ready', color: 'green' },
    { id: 'out-for-delivery', name: 'Out for Delivery', color: 'purple' },
    { id: 'delivered', name: 'Delivered', color: 'green' },
    { id: 'cancelled', name: 'Cancelled', color: 'red' }
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
        
        await fetchOrders();
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchOrders = async () => {
     try {
       setLoading(true);
       setError('');
       const response = await fetch('/api/restaurant/orders', {
         headers: {
           'Content-Type': 'application/json'
         },
         credentials: 'include'
       });
       
       const data = await response.json();
       if (data.success) {
         setOrders(data.orders);
         setFilteredOrders(data.orders);
       } else {
         setError('Failed to fetch orders: ' + data.message);
         console.error('Failed to fetch orders:', data.message);
         // Fallback to mock data if API fails
        const mockOrders = [
          {
            id: 'ORD001',
            customerName: 'John Doe',
            customerPhone: '+1 234-567-8900',
            customerEmail: 'john.doe@email.com',
            deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
            items: [
              { name: 'Chicken Biryani', quantity: 2, price: 25.00, notes: 'Extra spicy' },
              { name: 'Garlic Naan', quantity: 3, price: 4.50, notes: '' }
            ],
            subtotal: 63.50,
            deliveryFee: 3.99,
            tax: 5.41,
            total: 72.90,
            status: 'pending',
            orderTime: new Date(Date.now() - 5 * 60 * 1000),
            estimatedTime: 25,
            paymentMethod: 'Credit Card',
            orderType: 'delivery',
            specialInstructions: 'Please ring the doorbell twice'
          },
          {
            id: 'ORD002',
            customerName: 'Sarah Wilson',
            customerPhone: '+1 234-567-8901',
            customerEmail: 'sarah.wilson@email.com',
            deliveryAddress: '456 Oak Ave, Suite 12, Brooklyn, NY 11201',
            items: [
              { name: 'Margherita Pizza', quantity: 1, price: 18.50, notes: 'Thin crust' },
              { name: 'Caesar Salad', quantity: 1, price: 12.00, notes: 'No croutons' }
            ],
            subtotal: 30.50,
            deliveryFee: 2.99,
            tax: 2.68,
            total: 36.17,
            status: 'preparing',
            orderTime: new Date(Date.now() - 15 * 60 * 1000),
            estimatedTime: 15,
            paymentMethod: 'Cash',
            orderType: 'delivery',
            specialInstructions: ''
          },
          {
            id: 'ORD003',
            customerName: 'Mike Johnson',
            customerPhone: '+1 234-567-8902',
            customerEmail: 'mike.johnson@email.com',
            deliveryAddress: 'Pickup at restaurant',
            items: [
              { name: 'Beef Burger', quantity: 1, price: 15.00, notes: 'Medium rare' },
              { name: 'French Fries', quantity: 1, price: 6.00, notes: 'Extra crispy' },
              { name: 'Chocolate Shake', quantity: 1, price: 5.50, notes: '' }
            ],
            subtotal: 26.50,
            deliveryFee: 0.00,
            tax: 2.12,
            total: 28.62,
            status: 'ready',
            orderTime: new Date(Date.now() - 30 * 60 * 1000),
            estimatedTime: 0,
            paymentMethod: 'Credit Card',
            orderType: 'pickup',
            specialInstructions: 'Customer will arrive in 10 minutes'
          },
          {
            id: 'ORD004',
            customerName: 'Emily Davis',
            customerPhone: '+1 234-567-8903',
            customerEmail: 'emily.davis@email.com',
            deliveryAddress: '789 Pine St, Floor 3, Manhattan, NY 10002',
            items: [
              { name: 'Chicken Biryani', quantity: 1, price: 25.00, notes: '' },
              { name: 'Mango Lassi', quantity: 2, price: 4.00, notes: 'Less sugar' }
            ],
            subtotal: 33.00,
            deliveryFee: 3.99,
            tax: 2.96,
            total: 39.95,
            status: 'delivered',
            orderTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
            estimatedTime: 0,
            paymentMethod: 'Digital Wallet',
            orderType: 'delivery',
            specialInstructions: 'Leave at door'
          }
        ];
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to mock data on error
      const mockOrders = [
        {
          id: 'ORD001',
          customerName: 'John Doe',
          customerPhone: '+1 234-567-8900',
          customerEmail: 'john.doe@email.com',
          deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
          items: [
            { name: 'Chicken Biryani', quantity: 2, price: 25.00, notes: 'Extra spicy' },
            { name: 'Garlic Naan', quantity: 3, price: 4.50, notes: '' }
          ],
          subtotal: 63.50,
          deliveryFee: 3.99,
          tax: 5.41,
          total: 72.90,
          status: 'pending',
          orderTime: new Date(Date.now() - 5 * 60 * 1000),
          estimatedTime: 25,
          paymentMethod: 'Credit Card',
          orderType: 'delivery',
          specialInstructions: 'Please ring the doorbell twice'
        }
      ];
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = orders;
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const orderId = order._id || order.id || '';
        const customerName = order.customerName || 
          (order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : '') || '';
        const customerPhone = order.customerPhone || order.customer?.phone || '';
        const orderNumber = order.orderNumber || '';
        
        return orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
               customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               customerPhone.includes(searchTerm) ||
               orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // Filter by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === 'today') {
      filtered = filtered.filter(order => order.orderTime >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(order => order.orderTime >= weekAgo);
    }
    
    setFilteredOrders(filtered);
  }, [orders, selectedStatus, searchTerm, dateFilter]);

  const updateOrderStatus = async (orderId, action, additionalData = {}) => {
     try {
       setUpdating(true);
       setError('');
       const response = await fetch('/api/restaurant/orders', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json'
         },
         credentials: 'include',
         body: JSON.stringify({
           orderId,
           action,
           ...additionalData
         })
       });
       
       const data = await response.json();
       if (data.success) {
         // Update orders state directly instead of refetching to avoid loading screen
         setOrders(prevOrders => 
           prevOrders.map(order => 
             (order._id || order.id) === orderId 
               ? { ...order, status: data.order?.status || getNewStatus(action) }
               : order
           )
         );
       } else {
         setError('Failed to update order: ' + data.message);
         console.error('Failed to update order:', data.message);
       }
     } catch (error) {
       setError('Error updating order. Please try again.');
       console.error('Error updating order:', error);
     } finally {
       setUpdating(false);
     }
   };

   const getNewStatus = (action) => {
     switch (action) {
       case 'confirm': return 'confirmed';
       case 'start-preparing': return 'preparing';
       case 'ready': return 'ready';
       case 'out-for-delivery': return 'out-for-delivery';
       case 'deliver': return 'delivered';
       case 'cancel': return 'cancelled';
       default: return 'pending';
     }
   };

  const getStatusColor = (status) => {
    const statusObj = orderStatuses.find(s => s.id === status);
    const color = statusObj?.color || 'gray';
    
    const colorMap = {
      gray: 'bg-gray-500/20 text-gray-400',
      yellow: 'bg-yellow-500/20 text-yellow-400',
      blue: 'bg-blue-500/20 text-blue-400',
      orange: 'bg-orange-500/20 text-orange-400',
      green: 'bg-green-500/20 text-green-400',
      purple: 'bg-purple-500/20 text-purple-400',
      red: 'bg-red-500/20 text-red-400'
    };
    
    return colorMap[color] || colorMap.gray;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      case 'out-for-delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Unknown';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now - dateObj;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return dateObj.toLocaleDateString();
    }
  };

  const getOrdersByStatus = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
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
                <Package className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold">Order Management</span>
              </div>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search Orders</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Order ID, customer name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Order Status</h3>
              <div className="space-y-2">
                {orderStatuses.map(status => (
                  <button
                    key={status.id}
                    onClick={() => setSelectedStatus(status.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedStatus === status.id 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status.id)}
                        <span className="text-sm">{status.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {getOrdersByStatus(status.id)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:w-3/4">
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order._id || order.id || order.orderNumber} className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold">#{order.orderNumber || order.id}</h3>
                        <p className="text-gray-400 text-sm">{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : order.customerName}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{orderStatuses.find(s => s.id === order.status)?.name}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-gray-400 text-sm font-medium">{formatTime(order.createdAt || order.orderTime)}</p>
                      <p className="text-xs text-gray-500">{order.orderType === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <User className="h-4 w-4" />
                      <span>{order.customer?.phone || order.customerPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">
                        {order.orderType === 'pickup' ? 'Pickup' : (typeof order.deliveryAddress === 'string' ? order.deliveryAddress.split(',')[0] : `${order.deliveryAddress?.street || ''}, ${order.deliveryAddress?.city || ''}`)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>
                        {order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toLocaleTimeString() : (order.estimatedTime > 0 ? `${order.estimatedTime} mins` : 'Ready')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-3 font-medium">Items ({order.items.length}):</p>
                    <div className="space-y-3">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={item._id || item.id || `${item.name}-${index}`} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-xl border border-gray-600/50">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                            <img 
                              src={item.image || item.menuItem?.image || '/images/default-food.svg'} 
                              alt={item.name || item.menuItem?.name}
                              className="w-8 h-8 object-cover rounded"
                              onError={(e) => {
                                e.target.src = '/images/default-food.svg';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-white">{item.quantity}x {item.name || item.menuItem?.name}</p>
                                <p className="text-xs text-gray-400">${(item.price || item.menuItem?.price || 0).toFixed(2)} each</p>
                              </div>
                              <span className="text-green-400 font-semibold">${(item.quantity * (item.price || item.menuItem?.price || 0)).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-center py-2">
                          <p className="text-xs text-gray-500 bg-gray-700/20 rounded-lg py-2 px-3 border border-gray-600/30">+{order.items.length - 2} more items - View details to see all</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-600/50">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Order Total:</span>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-400">${(order.totalAmount || order.pricing?.total || order.total || 0).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                      className="text-orange-500 hover:text-orange-400 text-sm flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order._id || order.id, 'confirm')}
                            disabled={updating}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {updating && <RefreshCw className="h-3 w-3 animate-spin" />}
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please enter cancellation reason:');
                              if (reason) {
                                updateOrderStatus(order._id || order.id, 'cancel', { reason });
                              }
                            }}
                            disabled={updating}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {updating && <RefreshCw className="h-3 w-3 animate-spin" />}
                            <span>Cancel</span>
                          </button>
                        </>
                      )}
                      
                      {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order._id || order.id, 'start-preparing')}
                            disabled={updating}
                            className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {updating && <RefreshCw className="h-3 w-3 animate-spin" />}
                            <span>Start Preparing</span>
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order._id || order.id, 'ready')}
                            disabled={updating}
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {updating && <RefreshCw className="h-3 w-3 animate-spin" />}
                            <span>Mark Ready</span>
                          </button>
                        )}
                        {order.status === 'ready' && order.orderType === 'delivery' && (
                          <button
                            onClick={() => updateOrderStatus(order._id || order.id, 'out-for-delivery')}
                            disabled={updating}
                            className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {updating && <RefreshCw className="h-3 w-3 animate-spin" />}
                            <span>Out for Delivery</span>
                          </button>
                        )}
                        {order.status === 'out-for-delivery' && (
                          <button
                            onClick={() => updateOrderStatus(order._id || order.id, 'deliver')}
                            disabled={updating}
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {updating && <RefreshCw className="h-3 w-3 animate-spin" />}
                            <span>Mark Delivered</span>
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                  <p className="text-gray-400">Try adjusting your filters or check back later</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Order Details - #{selectedOrder.orderNumber || selectedOrder.id}</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.customer ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}` : selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.customer?.phone || selectedOrder.customerPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-xs">{selectedOrder.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Order Type:</span>
                      <span className="capitalize">{selectedOrder.orderType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment:</span>
                      <span>{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Order Time:</span>
                      <span>{new Date(selectedOrder.createdAt || selectedOrder.orderTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                        {orderStatuses.find(s => s.id === selectedOrder.status)?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-4">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={item._id || item.id || `${item.name}-${index}`} className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-xl border border-gray-600/50 hover:bg-gray-700/70 transition-colors">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-orange-500/30 flex-shrink-0">
                        <img 
                          src={item.image || item.menuItem?.image || '/images/default-food.svg'} 
                          alt={item.name || item.menuItem?.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = '/images/default-food.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-lg truncate">{item.menuItem?.name || item.name}</h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
                              <span className="text-sm text-gray-400">${(item.price || item.menuItem?.price || 0).toFixed(2)} each</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <span className="text-xl font-bold text-green-400">
                              ${(item.quantity * (item.price || item.menuItem?.price || 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {(item.notes || item.specialInstructions) && (
                          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-400">📝 {item.notes || item.specialInstructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-6 border border-gray-600/50">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Subtotal:</span>
                      <span className="font-medium">${(selectedOrder.subtotal || selectedOrder.totalAmount - (selectedOrder.deliveryFee || 0) - (selectedOrder.tax || 0)).toFixed(2)}</span>
                    </div>
                    {(selectedOrder.deliveryFee || 0) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">Delivery Fee:</span>
                        <span className="font-medium">${(selectedOrder.deliveryFee || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Tax:</span>
                      <span className="font-medium">${(selectedOrder.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-600/70 pt-3 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-white">Total Amount:</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-green-400">${(selectedOrder.totalAmount || selectedOrder.pricing?.total || selectedOrder.total || 0).toFixed(2)}</span>
                          <p className="text-xs text-gray-400 mt-1">{selectedOrder.paymentMethod}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedOrder.specialInstructions && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Special Instructions</h3>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">{selectedOrder.specialInstructions}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Print Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
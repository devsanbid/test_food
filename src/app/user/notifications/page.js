'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Clock, Truck, ChefHat, Star, Gift, AlertCircle, X, MarkAsRead, Package, MapPin, AlertTriangle } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

// Icon mapping for notification types
const getNotificationIcon = (type) => {
  const iconMap = {
    'order-confirmed': Package,
    'order-preparing': ChefHat,
    'order-ready': Clock,
    'order-out-for-delivery': Truck,
    'order-delivered': Check,
    'order-cancelled': X,
    'order-time-updated': Clock,
    'promotion': Gift,
    'rating_request': Star,
    'new_restaurant': MapPin,
    'loyalty_points': Gift,
    'order_delayed': AlertTriangle,
    'security-alert': AlertTriangle,
    'system': Bell
  };
  return iconMap[type] || Bell;
};

// Color mapping for notification types
const getNotificationColor = (type) => {
  const colorMap = {
    'order-confirmed': { color: 'text-green-500', bgColor: 'bg-green-500/20' },
    'order-preparing': { color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
    'order-ready': { color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
    'order-out-for-delivery': { color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    'order-delivered': { color: 'text-green-500', bgColor: 'bg-green-500/20' },
    'order-cancelled': { color: 'text-red-500', bgColor: 'bg-red-500/20' },
    'order-time-updated': { color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
    'promotion': { color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    'rating_request': { color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
    'new_restaurant': { color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
    'loyalty_points': { color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
    'order_delayed': { color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
    'security-alert': { color: 'text-red-500', bgColor: 'bg-red-500/20' },
    'system': { color: 'text-gray-500', bgColor: 'bg-gray-500/20' }
  };
  return colorMap[type] || { color: 'text-gray-500', bgColor: 'bg-gray-500/20' };
};

export default function NotificationsPage() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  // Fetch notifications from backend
  const fetchNotifications = async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.isRead !== undefined) queryParams.append('isRead', filters.isRead);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit || 20);
      
      const response = await fetch(`/api/user/notifications?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setStats(data.data.stats);
          setPagination(data.data.pagination);
          setUnreadCount(data.data.unreadCount);
        }
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'user') {
          router.push('/login');
          return;
        }
        setUser(userData);
        // Fetch notifications after user is loaded
        await fetchNotifications();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch notifications when filter changes
  useEffect(() => {
    if (user) {
      const filters = {};
      if (activeFilter === 'unread') {
        filters.isRead = false;
      } else if (activeFilter === 'orders') {
        filters.type = 'order-confirmed,order-preparing,order-ready,order-out-for-delivery,order-delivered,order-cancelled,order-time-updated';
      } else if (activeFilter === 'promotions') {
        filters.type = 'promotion,loyalty_points';
      }
      fetchNotifications(filters);
    }
  }, [activeFilter, user]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark-read',
          notificationIds: [notificationId]
        })
      });
      
      if (response.ok) {
        setNotifications(notifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark-all-read'
        })
      });
      
      if (response.ok) {
        setNotifications(notifications.map(notification => 
          ({ ...notification, isRead: true })
        ));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/user/notifications?ids=${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const deletedNotification = notifications.find(n => n._id === notificationId);
        setNotifications(notifications.filter(notification => notification._id !== notificationId));
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const filteredNotifications = notifications;

  // Get notification icon and colors dynamically
  const getNotificationDisplay = (notification) => {
    const IconComponent = getNotificationIcon(notification.type);
    const colors = getNotificationColor(notification.type);
    return {
      icon: IconComponent,
      ...colors
    };
  };

  const handleNotificationAction = (notification) => {
    switch (notification.type) {
      case 'order-confirmed':
      case 'order-preparing':
      case 'order-ready':
      case 'order-out-for-delivery':
      case 'order-delivered':
      case 'order-cancelled':
      case 'order-time-updated':
        router.push('/user/orderhistory');
        break;
      case 'rating_request':
        // Open rating modal or navigate to rating page
        alert('Rating feature coming soon!');
        break;
      case 'promotion':
        router.push('/user/foodlist');
        break;
      case 'new_restaurant':
        router.push('/user/search');
        break;
      default:
        break;
    }
    markAsRead(notification._id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Bell className="mr-3 text-orange-500" />
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-gray-400 text-sm">{unreadCount} unread notifications</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Mark All as Read
            </button>
          )}
        </div>

        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { key: 'all', label: 'All', count: stats?.totalNotifications || 0 },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { 
              key: 'orders', 
              label: 'Orders', 
              count: (stats?.typeCounts?.['order-confirmed'] || 0) + 
                     (stats?.typeCounts?.['order-preparing'] || 0) + 
                     (stats?.typeCounts?.['order-ready'] || 0) + 
                     (stats?.typeCounts?.['order-out-for-delivery'] || 0) + 
                     (stats?.typeCounts?.['order-delivered'] || 0) + 
                     (stats?.typeCounts?.['order-cancelled'] || 0) + 
                     (stats?.typeCounts?.['order-time-updated'] || 0)
            },
            { 
              key: 'promotions', 
              label: 'Promotions', 
              count: (stats?.typeCounts?.promotion || 0) + (stats?.typeCounts?.loyalty_points || 0)
            }
          ].map(filter => (
            <button 
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-md transition-colors text-sm ${
                activeFilter === filter.key ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-24 h-24 mx-auto mb-4 text-gray-600" />
            <h2 className="text-2xl font-semibold mb-2">No notifications</h2>
            <p className="text-gray-400">
              {activeFilter === 'unread' ? 'All caught up! No unread notifications.' : 'You have no notifications at the moment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const display = getNotificationDisplay(notification);
              const IconComponent = display.icon;
              return (
                <div 
                  key={notification._id}
                  className={`bg-gray-800 rounded-lg p-4 border-l-4 transition-all duration-300 hover:bg-gray-750 cursor-pointer ${
                    notification.isRead ? 'border-gray-600' : 'border-orange-500'
                  }`}
                  onClick={() => handleNotificationAction(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${display.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${display.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-400' : 'text-gray-300'}`}>
                            {notification.message}
                          </p>
                          
                          {notification.relatedData?.order && (
                            <div className="mt-2">
                              <span className="inline-block bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                                Order #{notification.relatedData.order.orderNumber || notification.relatedData.order._id}
                              </span>
                            </div>
                          )}
                          
                          {notification.data?.couponCode && (
                            <div className="mt-2">
                              <span className="inline-block bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-mono">
                                {notification.data.couponCode}
                              </span>
                            </div>
                          )}
                          
                          {notification.data?.points && (
                            <div className="mt-2">
                              <span className="inline-block bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                                +{notification.data.points} points
                              </span>
                            </div>
                          )}
                          
                          {notification.relatedData?.restaurant && (
                            <div className="mt-2">
                              <span className="inline-block bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                                {notification.relatedData.restaurant.name}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(new Date(notification.createdAt))}
                          </span>
                          
                          {!notification.isRead && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Delete notification"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filteredNotifications.length > 0 && pagination && (
           <div className="mt-8 text-center">
             <p className="text-gray-400 text-sm">
               Showing {filteredNotifications.length} of {pagination.totalNotifications} notifications
             </p>
             {pagination.totalPages > 1 && (
               <div className="flex justify-center space-x-2 mt-4">
                 {pagination.hasPrevPage && (
                   <button 
                     onClick={() => fetchNotifications({ page: pagination.currentPage - 1 })}
                     className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                   >
                     Previous
                   </button>
                 )}
                 <span className="px-3 py-1 text-sm">
                   Page {pagination.currentPage} of {pagination.totalPages}
                 </span>
                 {pagination.hasNextPage && (
                   <button 
                     onClick={() => fetchNotifications({ page: pagination.currentPage + 1 })}
                     className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                   >
                     Next
                   </button>
                 )}
               </div>
             )}
           </div>
         )}
      </div>
    </div>
  );
}
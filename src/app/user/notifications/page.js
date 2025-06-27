'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Clock, Truck, ChefHat, Star, Gift, AlertCircle, X, MarkAsRead } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function NotificationsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const router = useRouter();

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'order_confirmed',
      title: 'Order Confirmed',
      message: 'Your order #34562 has been confirmed and is being prepared.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      isRead: false,
      icon: Check,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      orderId: '34562'
    },
    {
      id: 2,
      type: 'order_preparing',
      title: 'Order Being Prepared',
      message: 'Your delicious meal is being prepared by Ocean Delights.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      isRead: false,
      icon: ChefHat,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      orderId: '34562'
    },
    {
      id: 3,
      type: 'order_delivered',
      title: 'Order Delivered',
      message: 'Your order #34561 has been delivered successfully. Enjoy your meal!',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: true,
      icon: Truck,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      orderId: '34561'
    },
    {
      id: 4,
      type: 'rating_request',
      title: 'Rate Your Experience',
      message: 'How was your meal from Italian Corner? Your feedback helps us improve.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      isRead: false,
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      orderId: '34560'
    },
    {
      id: 5,
      type: 'promotion',
      title: 'Special Offer!',
      message: 'Get 20% off on your next order. Use code SAVE20. Valid until tomorrow!',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      isRead: true,
      icon: Gift,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      couponCode: 'SAVE20'
    },
    {
      id: 6,
      type: 'order_delayed',
      title: 'Order Delayed',
      message: 'Your order #34559 is running 10 minutes late due to high demand. Sorry for the inconvenience.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      orderId: '34559'
    },
    {
      id: 7,
      type: 'new_restaurant',
      title: 'New Restaurant Added',
      message: 'Spice House is now available in your area! Explore authentic Indian cuisine.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isRead: true,
      icon: ChefHat,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      id: 8,
      type: 'loyalty_points',
      title: 'Loyalty Points Earned',
      message: 'You earned 50 loyalty points from your recent order. Total: 1,250 points.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isRead: true,
      icon: Gift,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      points: 50
    }
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'user') {
          router.push('/login');
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const markAsRead = (notificationId) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => 
      ({ ...notification, isRead: true })
    ));
  };

  const deleteNotification = (notificationId) => {
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
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

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.isRead;
    if (activeFilter === 'orders') return ['order_confirmed', 'order_preparing', 'order_delivered', 'order_delayed'].includes(notification.type);
    if (activeFilter === 'promotions') return ['promotion', 'loyalty_points'].includes(notification.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationAction = (notification) => {
    switch (notification.type) {
      case 'order_confirmed':
      case 'order_preparing':
      case 'order_delivered':
      case 'order_delayed':
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
    markAsRead(notification.id);
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
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'orders', label: 'Orders', count: notifications.filter(n => ['order_confirmed', 'order_preparing', 'order_delivered', 'order_delayed'].includes(n.type)).length },
            { key: 'promotions', label: 'Promotions', count: notifications.filter(n => ['promotion', 'loyalty_points'].includes(n.type)).length }
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
              const IconComponent = notification.icon;
              return (
                <div 
                  key={notification.id}
                  className={`bg-gray-800 rounded-lg p-4 border-l-4 transition-all duration-300 hover:bg-gray-750 cursor-pointer ${
                    notification.isRead ? 'border-gray-600' : 'border-orange-500'
                  }`}
                  onClick={() => handleNotificationAction(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${notification.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${notification.color}`} />
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
                          
                          {notification.orderId && (
                            <div className="mt-2">
                              <span className="inline-block bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                                Order #{notification.orderId}
                              </span>
                            </div>
                          )}
                          
                          {notification.couponCode && (
                            <div className="mt-2">
                              <span className="inline-block bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-mono">
                                {notification.couponCode}
                              </span>
                            </div>
                          )}
                          
                          {notification.points && (
                            <div className="mt-2">
                              <span className="inline-block bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                                +{notification.points} points
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                          
                          {!notification.isRead && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
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
                              deleteNotification(notification.id);
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

        {filteredNotifications.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
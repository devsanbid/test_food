export const createNotification = async (notificationData) => {
  try {
    const response = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(notificationData)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, message: 'Failed to create notification' };
  }
};

export const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'info':
    default:
      return 'ℹ️';
  }
};

export const getNotificationColor = (type) => {
  switch (type) {
    case 'success':
      return 'text-green-400';
    case 'warning':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    case 'info':
    default:
      return 'text-blue-400';
  }
};

// Notification types mapping
export const notificationTypes = {
  'order-confirmed': {
    icon: '📋',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'order-preparing': {
    icon: '👨‍🍳',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  'order-ready': {
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'order-out-for-delivery': {
    icon: '🚚',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'order-delivered': {
    icon: '🎉',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'order-cancelled': {
    icon: '❌',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  'order-time-updated': {
    icon: '⏰',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  'payment-successful': {
    icon: '💳',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'payment-failed': {
    icon: '💳',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  'new-restaurant': {
    icon: '🏪',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  'system-maintenance': {
    icon: '🔧',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  'general': {
    icon: 'ℹ️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  }
};

export const createSystemNotification = async (type, data) => {
  const notifications = {
    [notificationTypes.ORDER_PLACED]: {
      title: 'New Order Received',
      message: `Order #${data.orderId} has been placed by ${data.customerName}`,
      type: 'info'
    },
    [notificationTypes.ORDER_COMPLETED]: {
      title: 'Order Completed',
      message: `Order #${data.orderId} has been completed successfully`,
      type: 'success'
    },
    [notificationTypes.ORDER_CANCELLED]: {
      title: 'Order Cancelled',
      message: `Order #${data.orderId} has been cancelled`,
      type: 'warning'
    },
    [notificationTypes.RESTAURANT_APPROVED]: {
      title: 'Restaurant Approved',
      message: `${data.restaurantName} has been approved and is now live`,
      type: 'success'
    },
    [notificationTypes.RESTAURANT_REJECTED]: {
      title: 'Restaurant Rejected',
      message: `${data.restaurantName} application has been rejected`,
      type: 'error'
    },
    [notificationTypes.DISH_ADDED]: {
      title: 'New Dish Added',
      message: `${data.dishName} has been added to ${data.restaurantName}`,
      type: 'info'
    },
    [notificationTypes.USER_REGISTERED]: {
      title: 'New User Registration',
      message: `${data.userName} has registered on the platform`,
      type: 'info'
    },
    [notificationTypes.SYSTEM_MAINTENANCE]: {
      title: 'System Maintenance',
      message: data.message || 'Scheduled maintenance will begin shortly',
      type: 'warning'
    },
    [notificationTypes.PAYMENT_RECEIVED]: {
      title: 'Payment Received',
      message: `Payment of $${data.amount} received for order #${data.orderId}`,
      type: 'success'
    },
    [notificationTypes.REVIEW_SUBMITTED]: {
      title: 'New Review',
      message: `${data.customerName} left a ${data.rating}-star review for ${data.restaurantName}`,
      type: 'info'
    }
  };

  const notification = notifications[type];
  if (!notification) {
    console.error('Unknown notification type:', type);
    return { success: false, message: 'Unknown notification type' };
  }

  return await createNotification(data.userId, notification.title, notification.message, notification.type);
};

export const formatNotificationTime = (date) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  return notificationDate.toLocaleDateString();
};

export const markNotificationsAsRead = async (notificationIds = []) => {
  try {
    const response = await fetch('/api/admin/notifications', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'markAsRead',
        notificationIds
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return { success: false, message: 'Failed to mark notifications as read' };
  }
};

export const deleteNotifications = async (notificationIds) => {
  try {
    const promises = notificationIds.map(id => 
      fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
    );
    
    await Promise.all(promises);
    return { success: true, message: 'Notifications deleted successfully' };
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return { success: false, message: 'Failed to delete notifications' };
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const response = await fetch('/api/admin/notifications?unreadOnly=true&limit=1', {
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    return data.success ? data.unreadCount : 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

export const subscribeToNotifications = (callback) => {
  const interval = setInterval(async () => {
    const count = await getUnreadNotificationCount();
    callback(count);
  }, 30000);
  
  return () => clearInterval(interval);
};
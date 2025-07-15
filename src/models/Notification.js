import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [

      'order-confirmed',
      'order-preparing',
      'order-ready',
      'order-out-for-delivery',
      'order-delivered',
      'order-cancelled',
      'order-time-updated',
      'payment-successful',
      'payment-failed',
      'refund-processed',
      'new-restaurant',
      'promotion',
      'discount-offer',
      'loyalty-reward',
      'review-reminder',
      'review-response',
      'account-update',
      'security-alert',
      'system-maintenance',
      'general'
    ]
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedRestaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: [{
    type: String,
    enum: ['in-app', 'email', 'sms', 'push'],
    default: ['in-app']
  }],
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry: 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  actionButton: {
    text: {
      type: String,
      maxlength: [50, 'Action button text cannot be more than 50 characters']
    },
    url: {
      type: String,
      maxlength: [200, 'Action URL cannot be more than 200 characters']
    },
    action: {
      type: String,
      enum: ['navigate', 'external-link', 'modal', 'api-call']
    }
  },
  image: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  icon: {
    type: String,
    enum: [
      'order',
      'payment',
      'delivery',
      'restaurant',
      'promotion',
      'loyalty',
      'security',
      'system',
      'general'
    ],
    default: 'general'
  },
  metadata: {
    deviceId: String,
    platform: {
      type: String,
      enum: ['web', 'ios', 'android']
    },
    userAgent: String,
    ipAddress: String,
    location: {
      city: String,
      country: String
    }
  },
  deliveryAttempts: {
    type: Number,
    default: 0,
    max: [5, 'Maximum 5 delivery attempts allowed']
  },
  lastAttemptAt: {
    type: Date
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ relatedOrder: 1 });
notificationSchema.index({ relatedRestaurant: 1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Virtual for formatted time
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Method to mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Method to mark as failed
notificationSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.deliveryAttempts += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

// Method to check if notification is expired
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Method to check if can retry delivery
notificationSchema.methods.canRetryDelivery = function() {
  return this.status === 'failed' && this.deliveryAttempts < 5;
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    user: userId,
    isRead: false,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(userId) {
  const now = new Date();
  return await this.updateMany(
    {
      user: userId,
      isRead: false,
      expiresAt: { $gt: now }
    },
    {
      $set: {
        isRead: true,
        readAt: now,
        status: 'read'
      }
    }
  );
};

// Static method to create order notification
notificationSchema.statics.createOrderNotification = async function(userId, type, customData = {}) {
  
  if (!userId || !type) {
    throw new Error('userId and type are required for notification creation');
  }
  
  if (typeof type !== 'string') {
    throw new Error(`Invalid notification type: expected string, got ${typeof type}. Value: ${JSON.stringify(type)}`);
  }
  
  // Set title and message based on type
  const orderNumber = customData.orderNumber || 'your order';
  const restaurantName = customData.restaurantName || 'the restaurant';
  
  let title, message, icon = 'order', priority = 'high', actionButton;
  
  switch (type) {
    case 'order-confirmed':
      title = 'Order Confirmed!';
      message = `Your order #${orderNumber} has been confirmed by ${restaurantName} and is being prepared.`;
      icon = 'order';
      break;
    case 'order-preparing':
      title = 'Order Being Prepared';
      message = `Your order #${orderNumber} is now being prepared by ${restaurantName}.`;
      icon = 'order';
      break;
    case 'order-ready':
      title = 'Order Ready!';
      message = `Your order #${orderNumber} is ready for pickup/delivery.`;
      icon = 'order';
      break;
    case 'order-out-for-delivery':
      title = 'Out for Delivery';
      message = `Your order #${orderNumber} is on its way to you!${customData.deliveryPersonName ? ` Delivered by ${customData.deliveryPersonName}` : ''}`;
      icon = 'delivery';
      break;
    case 'order-delivered':
      title = 'Order Delivered';
      message = `Your order #${orderNumber} has been delivered. Enjoy your meal!`;
      icon = 'delivery';
      actionButton = {
        text: 'Rate Order',
        url: `/user/orders/${customData.orderId}/review`,
        action: 'navigate'
      };
      break;
    case 'order-cancelled':
      title = 'Order Cancelled';
      message = `Your order #${orderNumber} has been cancelled.${customData.cancellationReason ? ` Reason: ${customData.cancellationReason}` : ''}`;
      icon = 'order';
      break;
    case 'order-time-updated':
      title = 'Preparation Time Updated';
      message = `Estimated preparation time for order #${orderNumber} has been updated${customData.estimatedTime ? ` to ${customData.estimatedTime} minutes` : ''}.`;
      icon = 'order';
      priority = 'medium';
      break;
    default:
      title = 'Order Update';
      message = `Your order #${orderNumber} has been updated.`;
      icon = 'order';
  }
  
  const notificationData = {
    user: userId,
    type: String(type),
    title: title,
    message: message,
    relatedOrder: customData.orderId || null,
    relatedRestaurant: customData.restaurantId || null,
    channels: ['in-app', 'push'],
    priority: priority,
    icon: icon,
    data: customData
  };
  
  if (actionButton) {
    notificationData.actionButton = actionButton;
  }
  
  return await this.create(notificationData);
};

// Static method to create promotion notification
notificationSchema.statics.createPromotionNotification = async function(userId, promotionData) {
  return await this.create({
    user: userId,
    type: 'promotion',
    title: promotionData.title || 'Special Offer!',
    message: promotionData.message,
    channels: ['in-app', 'push'],
    priority: 'medium',
    icon: 'promotion',
    image: promotionData.image,
    actionButton: promotionData.actionButton,
    data: promotionData.data || {}
  });
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
import mongoose from 'mongoose';
import Notification from '../../src/models/Notification';

describe('Notification Model', () => {

  describe('Notification Schema Validation', () => {
    test('should create a valid notification', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'order-confirmed',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed and is being prepared.',
        relatedOrder: new mongoose.Types.ObjectId(),
        priority: 'high',
        channels: ['in-app', 'email']
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification._id).toBeDefined();
      expect(savedNotification.user).toEqual(notificationData.user);
      expect(savedNotification.type).toBe('order-confirmed');
      expect(savedNotification.title).toBe('Order Confirmed');
      expect(savedNotification.status).toBe('pending');
      expect(savedNotification.isRead).toBe(false);
      expect(savedNotification.priority).toBe('high');
      expect(savedNotification.channels).toEqual(['in-app', 'email']);
      expect(savedNotification.deliveryAttempts).toBe(0);
    });

    test('should fail validation for missing required fields', async () => {
      const notification = new Notification({});
      await expect(notification.save()).rejects.toThrow();
    });

    test('should fail validation for invalid notification type', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'invalid-type',
        title: 'Test Notification',
        message: 'Test message'
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should fail validation for long title', async () => {
      const longTitle = 'a'.repeat(101);
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: longTitle,
        message: 'Test message'
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should fail validation for long message', async () => {
      const longMessage = 'a'.repeat(501);
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: longMessage
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should validate priority enum', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        priority: 'invalid-priority'
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should validate status enum', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        status: 'invalid-status'
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should validate channels enum', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        channels: ['invalid-channel']
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should validate icon enum', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        icon: 'invalid-icon'
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });
  });

  describe('Notification Defaults', () => {
    test('should set default values correctly', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.priority).toBe('medium');
      expect(savedNotification.status).toBe('pending');
      expect(savedNotification.isRead).toBe(false);
      expect(savedNotification.icon).toBe('general');
      expect(savedNotification.deliveryAttempts).toBe(0);
      expect(savedNotification.data).toEqual({});
      expect(savedNotification.expiresAt).toBeDefined();
    });

    test('should set default expiry time to 30 days', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      const daysDiff = (savedNotification.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(30, 0);
    });
  });

  describe('Notification Types', () => {
    test('should create order-related notification', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'order-delivered',
        title: 'Order Delivered',
        message: 'Your order has been delivered successfully.',
        relatedOrder: new mongoose.Types.ObjectId(),
        relatedRestaurant: new mongoose.Types.ObjectId(),
        icon: 'delivery'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.type).toBe('order-delivered');
      expect(savedNotification.relatedOrder).toBeDefined();
      expect(savedNotification.relatedRestaurant).toBeDefined();
      expect(savedNotification.icon).toBe('delivery');
    });

    test('should create payment-related notification', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'payment-successful',
        title: 'Payment Successful',
        message: 'Your payment has been processed successfully.',
        icon: 'payment',
        priority: 'high'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.type).toBe('payment-successful');
      expect(savedNotification.icon).toBe('payment');
    });

    test('should create promotion notification', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'promotion',
        title: '50% Off Today!',
        message: 'Get 50% off on your next order from selected restaurants.',
        icon: 'promotion',
        priority: 'low',
        data: {
          discountCode: 'SAVE50',
          validUntil: '2024-12-31'
        }
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.type).toBe('promotion');
      expect(savedNotification.data.discountCode).toBe('SAVE50');
    });
  });

  describe('Action Button', () => {
    test('should handle action button data', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'order-ready',
        title: 'Order Ready',
        message: 'Your order is ready for pickup.',
        actionButton: {
          text: 'View Order',
          url: '/orders/123',
          action: 'navigate'
        }
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.actionButton.text).toBe('View Order');
      expect(savedNotification.actionButton.url).toBe('/orders/123');
      expect(savedNotification.actionButton.action).toBe('navigate');
    });

    test('should validate action button text length', async () => {
      const longText = 'a'.repeat(51);
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        actionButton: {
          text: longText,
          url: '/test',
          action: 'navigate'
        }
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should validate action button URL length', async () => {
      const longUrl = 'a'.repeat(201);
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        actionButton: {
          text: 'Click',
          url: longUrl,
          action: 'navigate'
        }
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should validate action enum', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        actionButton: {
          text: 'Click',
          url: '/test',
          action: 'invalid-action'
        }
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });
  });

  describe('Image Validation', () => {
    test('should accept valid image URL', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        image: 'https://example.com/image.jpg'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.image).toBe('https://example.com/image.jpg');
    });

    test('should reject invalid image URL', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        image: 'invalid-url'
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });
  });

  describe('Metadata', () => {
    test('should handle metadata correctly', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        metadata: {
          deviceId: 'device-123',
          platform: 'web',
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          location: {
            city: 'New York',
            country: 'USA'
          }
        }
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.metadata.deviceId).toBe('device-123');
      expect(savedNotification.metadata.platform).toBe('web');
      expect(savedNotification.metadata.location.city).toBe('New York');
    });

    test('should validate platform enum in metadata', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        metadata: {
          platform: 'invalid-platform'
        }
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });
  });

  describe('Delivery Attempts', () => {
    test('should validate maximum delivery attempts', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        deliveryAttempts: 6
      };

      const notification = new Notification(notificationData);
      await expect(notification.save()).rejects.toThrow();
    });

    test('should allow valid delivery attempts', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        deliveryAttempts: 3,
        lastAttemptAt: new Date(),
        errorMessage: 'Network timeout'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification.deliveryAttempts).toBe(3);
      expect(savedNotification.lastAttemptAt).toBeDefined();
      expect(savedNotification.errorMessage).toBe('Network timeout');
    });
  });

  describe('Notification Methods', () => {
    test('markAsRead should update read status and timestamp', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.isRead).toBe(false);
      expect(savedNotification.readAt).toBeUndefined();
      
      await savedNotification.markAsRead();
      
      expect(savedNotification.isRead).toBe(true);
      expect(savedNotification.readAt).toBeDefined();
      expect(savedNotification.status).toBe('read');
    });

    test('markAsRead should not update if already read', async () => {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        isRead: true,
        readAt: new Date(),
        status: 'read'
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();
      const originalReadAt = savedNotification.readAt;
      
      await savedNotification.markAsRead();
      
      expect(savedNotification.readAt).toEqual(originalReadAt);
    });
  });

  describe('Notification Virtuals', () => {
    test('should calculate notification age', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const notification = new Notification({
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        createdAt: pastDate
      });

      expect(notification.age).toBeGreaterThan(0);
    });

    test('should format time ago correctly', () => {
      const notification = new Notification({
        user: new mongoose.Types.ObjectId(),
        type: 'general',
        title: 'Test Title',
        message: 'Test message',
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      });

      expect(notification.timeAgo).toBe('30m ago');
    });
  });
});
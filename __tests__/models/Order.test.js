import mongoose from 'mongoose';
import Order from '../../src/models/Order';

describe('Order Model', () => {

  describe('Order Schema Validation', () => {
    test('should create a valid delivery order', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-001',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Margherita Pizza',
          price: 12.99,
          quantity: 2,
          specialInstructions: 'Extra cheese'
        }],
        orderType: 'delivery',
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060
          },
          deliveryInstructions: 'Ring doorbell'
        },
        pricing: {
          subtotal: 25.98,
          tax: 2.60,
          deliveryFee: 3.99,
          serviceFee: 1.50,
          total: 34.07
        },
        payment: {
          method: 'card',
          amount: 34.07,
          currency: 'USD'
        },
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.orderNumber).toBe(orderData.orderNumber);
      expect(savedOrder.status).toBe('pending');
      expect(savedOrder.orderType).toBe('delivery');
      expect(savedOrder.items).toHaveLength(1);
      expect(savedOrder.pricing.total).toBe(34.07);
      expect(savedOrder.payment.status).toBe('pending');
    });

    test('should create a valid pickup order', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-002',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Caesar Salad',
          price: 8.99,
          quantity: 1
        }],
        orderType: 'pickup',
        pricing: {
          subtotal: 8.99,
          tax: 0.90,
          total: 9.89
        },
        payment: {
          method: 'cash',
          amount: 9.89
        },
        estimatedPickupTime: new Date(Date.now() + 20 * 60 * 1000)
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.orderType).toBe('pickup');
      expect(savedOrder.deliveryAddress).toBeUndefined();
      expect(savedOrder.estimatedPickupTime).toBeDefined();
    });

    test('should fail validation for missing required fields', async () => {
      const order = new Order({});
      await expect(order.save()).rejects.toThrow();
    });

    test('should fail validation for delivery order without delivery address', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-003',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1
        }],
        orderType: 'delivery',
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'card',
          amount: 14.29
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should validate order status enum', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-004',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1
        }],
        orderType: 'pickup',
        status: 'invalid-status',
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'card',
          amount: 14.29
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should validate payment method enum', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-005',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1
        }],
        orderType: 'pickup',
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'invalid-method',
          amount: 14.29
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Order Items Validation', () => {
    test('should validate order item required fields', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-006',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          price: 12.99,
          quantity: 1
        }],
        orderType: 'pickup',
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'card',
          amount: 14.29
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should validate minimum quantity', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-007',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 0
        }],
        orderType: 'pickup',
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'card',
          amount: 14.29
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should validate negative price', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-008',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: -5,
          quantity: 1
        }],
        orderType: 'pickup',
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'card',
          amount: 14.29
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should handle customizations', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-009',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Custom Pizza',
          price: 12.99,
          quantity: 1,
          customizations: [{
            name: 'Size',
            value: 'Large',
            additionalPrice: 3.00
          }, {
            name: 'Toppings',
            value: 'Extra Cheese',
            additionalPrice: 1.50
          }]
        }],
        orderType: 'pickup',
        pricing: {
          subtotal: 17.49,
          tax: 1.75,
          total: 19.24
        },
        payment: {
          method: 'card',
          amount: 19.24
        },
        estimatedPickupTime: new Date(Date.now() + 20 * 60 * 1000)
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.items[0].customizations).toHaveLength(2);
      expect(savedOrder.items[0].customizations[0].additionalPrice).toBe(3.00);
    });
  });

  describe('Pricing Validation', () => {
    test('should validate negative pricing values', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-010',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1
        }],
        orderType: 'pickup',
        pricing: {
          subtotal: -12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'card',
          amount: 14.29
        }
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should handle discount and tip', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-011',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1
        }],
        orderType: 'delivery',
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          deliveryFee: 3.99,
          discount: 2.00,
          tip: 3.00,
          total: 19.28
        },
        payment: {
          method: 'card',
          amount: 19.28
        },
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.pricing.discount).toBe(2.00);
      expect(savedOrder.pricing.tip).toBe(3.00);
    });
  });

  describe('Delivery Address Validation', () => {
    test('should validate delivery address required fields', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-012',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1
        }],
        orderType: 'delivery',
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York'
        },
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'card',
          amount: 14.29
        },
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });

    test('should handle optional delivery address fields', async () => {
      const orderData = {
        orderNumber: 'ORD-2024-013',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1
        }],
        orderType: 'delivery',
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          apartmentNumber: 'Apt 4B',
          deliveryInstructions: 'Leave at door',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        },
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'card',
          amount: 14.29
        },
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000)
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.deliveryAddress.apartmentNumber).toBe('Apt 4B');
      expect(savedOrder.deliveryAddress.deliveryInstructions).toBe('Leave at door');
    });
  });

  describe('Special Instructions', () => {
    test('should validate special instructions length', async () => {
      const longInstructions = 'a'.repeat(501);
      const orderData = {
        orderNumber: 'ORD-2024-014',
        customer: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1
        }],
        orderType: 'pickup',
        pricing: {
          subtotal: 12.99,
          tax: 1.30,
          total: 14.29
        },
        payment: {
          method: 'card',
          amount: 14.29
        },
        specialInstructions: longInstructions
      };

      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow();
    });
  });
});
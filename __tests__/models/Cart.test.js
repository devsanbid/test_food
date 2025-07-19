import mongoose from 'mongoose';
import Cart from '../../src/models/Cart';

describe('Cart Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/foodsewa_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Cart.deleteMany({});
  });

  describe('Cart Schema Validation', () => {
    test('should create a valid cart', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        restaurantName: 'Pizza Palace',
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Margherita Pizza',
          description: 'Classic pizza with tomato and mozzarella',
          price: 12.99,
          quantity: 2,
          category: 'Pizza',
          customizations: [{
            name: 'Size',
            value: 'Large',
            additionalPrice: 3.00
          }],
          specialInstructions: 'Extra cheese please'
        }],
        deliveryFee: 3.99,
        minimumOrderAmount: 15.00
      };

      const cart = new Cart(cartData);
      const savedCart = await cart.save();

      expect(savedCart._id).toBeDefined();
      expect(savedCart.user).toEqual(cartData.user);
      expect(savedCart.items).toHaveLength(1);
      expect(savedCart.items[0].name).toBe('Margherita Pizza');
      expect(savedCart.items[0].quantity).toBe(2);
      expect(savedCart.isActive).toBe(true);
      expect(savedCart.expiresAt).toBeDefined();
    });

    test('should fail validation for missing required fields', async () => {
      const cart = new Cart({});
      await expect(cart.save()).rejects.toThrow();
    });

    test('should enforce unique user constraint', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cartData1 = {
        user: userId,
        items: []
      };
      const cartData2 = {
        user: userId,
        items: []
      };

      await new Cart(cartData1).save();
      const cart2 = new Cart(cartData2);
      
      await expect(cart2.save()).rejects.toThrow();
    });

    test('should validate negative subtotal', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [],
        subtotal: -10
      };

      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow();
    });

    test('should validate negative delivery fee', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [],
        deliveryFee: -5
      };

      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow();
    });
  });

  describe('Cart Items Validation', () => {
    test('should validate cart item required fields', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          price: 12.99,
          quantity: 1
        }]
      };

      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow();
    });

    test('should validate minimum quantity', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 0,
          category: 'Pizza'
        }]
      };

      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow();
    });

    test('should validate maximum quantity', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 15,
          category: 'Pizza'
        }]
      };

      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow();
    });

    test('should validate negative price', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: -5,
          quantity: 1,
          category: 'Pizza'
        }]
      };

      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow();
    });

    test('should handle customizations', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Custom Pizza',
          price: 12.99,
          quantity: 1,
          category: 'Pizza',
          customizations: [{
            name: 'Size',
            value: 'Large',
            additionalPrice: 3.00
          }, {
            name: 'Crust',
            value: 'Thin',
            additionalPrice: 0
          }]
        }]
      };

      const cart = new Cart(cartData);
      const savedCart = await cart.save();

      expect(savedCart.items[0].customizations).toHaveLength(2);
      expect(savedCart.items[0].customizations[0].additionalPrice).toBe(3.00);
      expect(savedCart.items[0].customizations[1].additionalPrice).toBe(0);
    });

    test('should validate customization required fields', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1,
          category: 'Pizza',
          customizations: [{
            name: 'Size',
            additionalPrice: 3.00
          }]
        }]
      };

      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow();
    });

    test('should validate special instructions length', async () => {
      const longInstructions = 'a'.repeat(201);
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 12.99,
          quantity: 1,
          category: 'Pizza',
          specialInstructions: longInstructions
        }]
      };

      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow();
    });
  });

  describe('Cart Virtuals', () => {
    test('should calculate total price correctly', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 10.00,
          quantity: 2,
          category: 'Pizza',
          customizations: [{
            name: 'Size',
            value: 'Large',
            additionalPrice: 3.00
          }]
        }, {
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Salad',
          price: 8.00,
          quantity: 1,
          category: 'Salad'
        }]
      };

      const cart = new Cart(cartData);
      const savedCart = await cart.save();

      expect(savedCart.totalPrice).toBe(34.00);
    });

    test('should calculate total items correctly', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 10.00,
          quantity: 3,
          category: 'Pizza'
        }, {
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Salad',
          price: 8.00,
          quantity: 2,
          category: 'Salad'
        }]
      };

      const cart = new Cart(cartData);
      const savedCart = await cart.save();

      expect(savedCart.totalItems).toBe(5);
    });

    test('should calculate estimated prep time correctly', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 10.00,
          quantity: 1,
          category: 'Pizza',
          preparationTime: 20
        }, {
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pasta',
          price: 12.00,
          quantity: 1,
          category: 'Pasta',
          preparationTime: 25
        }]
      };

      const cart = new Cart(cartData);
      const savedCart = await cart.save();

      expect(savedCart.estimatedPrepTime).toBe(25);
    });
  });

  describe('Cart Pre-save Middleware', () => {
    test('should update calculated fields on save', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [{
          menuItem: new mongoose.Types.ObjectId(),
          restaurant: new mongoose.Types.ObjectId(),
          name: 'Pizza',
          price: 15.00,
          quantity: 2,
          category: 'Pizza'
        }]
      };

      const cart = new Cart(cartData);
      const savedCart = await cart.save();

      expect(savedCart.subtotal).toBe(30.00);
      expect(savedCart.itemCount).toBe(2);
      expect(savedCart.lastUpdated).toBeDefined();
      expect(savedCart.expiresAt).toBeDefined();
    });
  });

  describe('Device Info', () => {
    test('should handle device information', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [],
        deviceInfo: {
          platform: 'web',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        sessionId: 'session-123'
      };

      const cart = new Cart(cartData);
      const savedCart = await cart.save();

      expect(savedCart.deviceInfo.platform).toBe('web');
      expect(savedCart.sessionId).toBe('session-123');
    });

    test('should validate platform enum', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: [],
        deviceInfo: {
          platform: 'invalid-platform'
        }
      };

      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow();
    });
  });

  describe('Cart Expiry', () => {
    test('should set default expiry time', async () => {
      const cartData = {
        user: new mongoose.Types.ObjectId(),
        items: []
      };

      const cart = new Cart(cartData);
      const savedCart = await cart.save();

      expect(savedCart.expiresAt.getTime()).toBeGreaterThan(Date.now());
      const hoursDiff = (savedCart.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeCloseTo(24, 0);
    });
  });
});
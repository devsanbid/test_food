import mongoose from 'mongoose';
import Discount from '../../src/models/Discount';

describe('Discount Model', () => {

  describe('Discount Schema Validation', () => {
    test('should create a valid discount', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Summer Sale',
        description: 'Get 20% off on all orders',
        type: 'percentage',
        value: 20,
        code: 'SUMMER20',
        minimumOrderAmount: 500,
        maximumDiscount: 200,
        usageLimit: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount._id).toBeDefined();
      expect(savedDiscount.restaurant).toEqual(discountData.restaurant);
      expect(savedDiscount.name).toBe('Summer Sale');
      expect(savedDiscount.type).toBe('percentage');
      expect(savedDiscount.value).toBe(20);
      expect(savedDiscount.code).toBe('SUMMER20');
      expect(savedDiscount.isActive).toBe(true);
      expect(savedDiscount.usageCount).toBe(0);
    });

    test('should fail validation for missing required fields', async () => {
      const discount = new Discount({});
      await expect(discount.save()).rejects.toThrow();
    });

    test('should fail validation for invalid discount type', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'invalid-type',
        value: 20,
        code: 'TEST20'
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });

    test('should fail validation for negative value', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: -10,
        code: 'TEST20'
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });

    test('should fail validation for percentage value over 100', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: 150,
        code: 'TEST20'
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });

    test('should fail validation for negative minimum order amount', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: 20,
        code: 'TEST20',
        minimumOrderAmount: -100
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });

    test('should fail validation for negative maximum discount', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: 20,
        code: 'TEST20',
        maximumDiscount: -50
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });

    test('should fail validation for negative usage limit', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: 20,
        code: 'TEST20',
        usageLimit: -10
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });

    test('should fail validation for long name', async () => {
      const longName = 'a'.repeat(101);
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: longName,
        description: 'Test description',
        type: 'percentage',
        value: 20,
        code: 'TEST20'
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });

    test('should fail validation for long description', async () => {
      const longDescription = 'a'.repeat(501);
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: longDescription,
        type: 'percentage',
        value: 20,
        code: 'TEST20'
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });

    test('should fail validation for long code', async () => {
      const longCode = 'a'.repeat(21);
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: 20,
        code: longCode
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });
  });

  describe('Discount Types', () => {
    test('should create percentage discount', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Percentage Discount',
        description: 'Get 25% off',
        type: 'percentage',
        value: 25,
        code: 'PERCENT25',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount.type).toBe('percentage');
      expect(savedDiscount.value).toBe(25);
    });

    test('should create fixed amount discount', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Fixed Discount',
        description: 'Get Rs. 100 off',
        type: 'fixed',
        value: 100,
        code: 'FIXED100',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount.type).toBe('fixed');
      expect(savedDiscount.value).toBe(100);
    });

    test('should create free delivery discount', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Free Delivery',
        description: 'Free delivery on all orders',
        type: 'free-delivery',
        value: 0,
        code: 'FREEDEL',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount.type).toBe('free-delivery');
    });

    test('should create buy-one-get-one discount', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'BOGO Offer',
        description: 'Buy one get one free',
        type: 'bogo',
        value: 50,
        code: 'BOGO50',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount.type).toBe('bogo');
    });
  });

  describe('Discount Defaults', () => {
    test('should set default values correctly', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: 20,
        code: 'TEST20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount.minimumOrderAmount).toBe(0);
      expect(savedDiscount.usageCount).toBe(0);
      expect(savedDiscount.isActive).toBe(true);
      expect(savedDiscount.applicableItems).toEqual([]);
      expect(savedDiscount.customerSegment).toEqual([]);
    });
  });

  describe('Applicable Items', () => {
    test('should handle applicable menu items', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Item Specific Discount',
        description: 'Discount on specific items',
        type: 'percentage',
        value: 15,
        code: 'ITEM15',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        applicableItems: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId()
        ]
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount.applicableItems).toHaveLength(2);
      expect(savedDiscount.applicableItems[0]).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });

  describe('Customer Segment', () => {
    test('should validate customer segment enum', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'VIP Discount',
        description: 'Discount for VIP customers',
        type: 'percentage',
        value: 30,
        code: 'VIP30',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        customerSegment: ['vip', 'premium']
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount.customerSegment).toEqual(['vip', 'premium']);
    });

    test('should fail validation for invalid customer segment', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: 20,
        code: 'TEST20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        customerSegment: ['invalid-segment']
      };

      const discount = new Discount(discountData);
      await expect(discount.save()).rejects.toThrow();
    });
  });

  describe('Date Validation', () => {
    test('should handle start and end dates', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Time Limited Discount',
        description: 'Limited time offer',
        type: 'percentage',
        value: 20,
        code: 'LIMITED20',
        startDate: startDate,
        endDate: endDate
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount.startDate).toEqual(startDate);
      expect(savedDiscount.endDate).toEqual(endDate);
    });
  });

  describe('Usage Tracking', () => {
    test('should track usage count and limit', async () => {
      const discountData = {
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Limited Use Discount',
        description: 'Limited usage discount',
        type: 'percentage',
        value: 20,
        code: 'LIMITED20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        usageLimit: 5,
        usageCount: 3
      };

      const discount = new Discount(discountData);
      const savedDiscount = await discount.save();

      expect(savedDiscount.usageLimit).toBe(5);
      expect(savedDiscount.usageCount).toBe(3);
    });
  });

  describe('Discount Virtuals', () => {
    test('should calculate status as active when conditions are met', () => {
      const discount = new Discount({
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Active Discount',
        description: 'Currently active discount',
        type: 'percentage',
        value: 20,
        code: 'ACTIVE20',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usageLimit: 100,
        usageCount: 50,
        isActive: true
      });

      expect(discount.status).toBe('active');
    });

    test('should calculate status as expired when end date passed', () => {
      const discount = new Discount({
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Expired Discount',
        description: 'Expired discount',
        type: 'percentage',
        value: 20,
        code: 'EXPIRED20',
        startDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isActive: true
      });

      expect(discount.status).toBe('expired');
    });

    test('should calculate status as upcoming when start date is future', () => {
      const discount = new Discount({
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Upcoming Discount',
        description: 'Future discount',
        type: 'percentage',
        value: 20,
        code: 'UPCOMING20',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true
      });

      expect(discount.status).toBe('upcoming');
    });

    test('should calculate status as exhausted when usage limit reached', () => {
      const discount = new Discount({
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Exhausted Discount',
        description: 'Usage limit reached',
        type: 'percentage',
        value: 20,
        code: 'EXHAUSTED20',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usageLimit: 100,
        usageCount: 100,
        isActive: true
      });

      expect(discount.status).toBe('exhausted');
    });

    test('should calculate status as inactive when isActive is false', () => {
      const discount = new Discount({
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Inactive Discount',
        description: 'Manually deactivated',
        type: 'percentage',
        value: 20,
        code: 'INACTIVE20',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: false
      });

      expect(discount.status).toBe('inactive');
    });

    test('should calculate usage percentage correctly', () => {
      const discount = new Discount({
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: 20,
        code: 'TEST20',
        usageLimit: 100,
        usageCount: 25
      });

      expect(discount.usagePercentage).toBe(25);
    });

    test('should return 0 usage percentage when no limit set', () => {
      const discount = new Discount({
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Test Discount',
        description: 'Test description',
        type: 'percentage',
        value: 20,
        code: 'TEST20',
        usageCount: 25
      });

      expect(discount.usagePercentage).toBe(0);
    });

    test('should calculate isCurrentlyActive correctly', () => {
      const activeDiscount = new Discount({
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Active Discount',
        description: 'Currently active',
        type: 'percentage',
        value: 20,
        code: 'ACTIVE20',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usageLimit: 100,
        usageCount: 50,
        isActive: true
      });

      expect(activeDiscount.isCurrentlyActive).toBe(true);

      const inactiveDiscount = new Discount({
        restaurant: new mongoose.Types.ObjectId(),
        name: 'Inactive Discount',
        description: 'Not active',
        type: 'percentage',
        value: 20,
        code: 'INACTIVE20',
        isActive: false
      });

      expect(inactiveDiscount.isCurrentlyActive).toBe(false);
    });
  });

  describe('Unique Code Constraint', () => {
    test('should enforce unique discount codes per restaurant', async () => {
      const restaurant = new mongoose.Types.ObjectId();
      
      const firstDiscount = new Discount({
        restaurant: restaurant,
        name: 'First Discount',
        description: 'First discount',
        type: 'percentage',
        value: 20,
        code: 'UNIQUE20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await firstDiscount.save();

      const secondDiscount = new Discount({
        restaurant: restaurant,
        name: 'Second Discount',
        description: 'Second discount',
        type: 'percentage',
        value: 15,
        code: 'UNIQUE20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await expect(secondDiscount.save()).rejects.toThrow();
    });

    test('should allow same code for different restaurants', async () => {
      const restaurant1 = new mongoose.Types.ObjectId();
      const restaurant2 = new mongoose.Types.ObjectId();
      
      const firstDiscount = new Discount({
        restaurant: restaurant1,
        name: 'First Discount',
        description: 'First discount',
        type: 'percentage',
        value: 20,
        code: 'SAME20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const secondDiscount = new Discount({
        restaurant: restaurant2,
        name: 'Second Discount',
        description: 'Second discount',
        type: 'percentage',
        value: 15,
        code: 'SAME20',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await firstDiscount.save();
      await expect(secondDiscount.save()).resolves.toBeDefined();
    });
  });
});
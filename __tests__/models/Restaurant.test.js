import mongoose from 'mongoose';
import Restaurant from '../../src/models/Restaurant';

describe('Restaurant Model', () => {

  describe('Restaurant Schema Validation', () => {
    test('should create a valid restaurant', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        description: 'Best pizza in town',
        cuisine: ['Italian', 'Pizza'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: {
          min: 30,
          max: 45
        }
      };

      const restaurant = new Restaurant(restaurantData);
      const savedRestaurant = await restaurant.save();

      expect(savedRestaurant._id).toBeDefined();
      expect(savedRestaurant.name).toBe(restaurantData.name);
      expect(savedRestaurant.cuisine).toEqual(restaurantData.cuisine);
      expect(savedRestaurant.rating.average).toBe(0);
      expect(savedRestaurant.rating.count).toBe(0);
      expect(savedRestaurant.deliveryFee).toBe(0);
    });

    test('should fail validation for missing required fields', async () => {
      const restaurant = new Restaurant({});
      await expect(restaurant.save()).rejects.toThrow();
    });

    test('should fail validation for invalid email', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'invalid-email',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 }
      };

      const restaurant = new Restaurant(restaurantData);
      await expect(restaurant.save()).rejects.toThrow();
    });

    test('should fail validation for invalid phone number', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: 'invalid-phone',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 }
      };

      const restaurant = new Restaurant(restaurantData);
      await expect(restaurant.save()).rejects.toThrow();
    });

    test('should validate price range enum', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: 'invalid',
        deliveryTime: { min: 30, max: 45 }
      };

      const restaurant = new Restaurant(restaurantData);
      await expect(restaurant.save()).rejects.toThrow();
    });

    test('should validate rating bounds', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 },
        rating: { average: 6, count: 10 }
      };

      const restaurant = new Restaurant(restaurantData);
      await expect(restaurant.save()).rejects.toThrow();
    });

    test('should validate negative delivery fee', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 },
        deliveryFee: -5
      };

      const restaurant = new Restaurant(restaurantData);
      await expect(restaurant.save()).rejects.toThrow();
    });
  });

  describe('Menu Items', () => {
    test('should add menu items to restaurant', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 },
        menu: [{
          name: 'Margherita Pizza',
          description: 'Classic pizza with tomato and mozzarella',
          price: 12.99,
          category: 'Pizza',
          isVegetarian: true,
          spiceLevel: 'mild',
          ingredients: ['tomato', 'mozzarella', 'basil'],
          nutritionalInfo: {
            calories: 250,
            protein: 12,
            carbs: 30,
            fat: 8
          }
        }]
      };

      const restaurant = new Restaurant(restaurantData);
      const savedRestaurant = await restaurant.save();

      expect(savedRestaurant.menu).toHaveLength(1);
      expect(savedRestaurant.menu[0].name).toBe('Margherita Pizza');
      expect(savedRestaurant.menu[0].price).toBe(12.99);
      expect(savedRestaurant.menu[0].isVegetarian).toBe(true);
      expect(savedRestaurant.menu[0].isAvailable).toBe(true);
      expect(savedRestaurant.menu[0].preparationTime).toBe(15);
    });

    test('should validate menu item required fields', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 },
        menu: [{
          description: 'Pizza without name',
          price: 12.99
        }]
      };

      const restaurant = new Restaurant(restaurantData);
      await expect(restaurant.save()).rejects.toThrow();
    });

    test('should validate negative menu item price', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 },
        menu: [{
          name: 'Free Pizza',
          price: -5,
          category: 'Pizza'
        }]
      };

      const restaurant = new Restaurant(restaurantData);
      await expect(restaurant.save()).rejects.toThrow();
    });

    test('should validate spice level enum', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 },
        menu: [{
          name: 'Spicy Pizza',
          price: 15.99,
          category: 'Pizza',
          spiceLevel: 'super-hot'
        }]
      };

      const restaurant = new Restaurant(restaurantData);
      await expect(restaurant.save()).rejects.toThrow();
    });
  });

  describe('Operating Hours', () => {
    test('should save restaurant with operating hours', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 },
        operatingHours: {
          monday: { open: '09:00', close: '22:00', isClosed: false },
          tuesday: { open: '09:00', close: '22:00', isClosed: false },
          wednesday: { open: '09:00', close: '22:00', isClosed: false },
          thursday: { open: '09:00', close: '22:00', isClosed: false },
          friday: { open: '09:00', close: '23:00', isClosed: false },
          saturday: { open: '10:00', close: '23:00', isClosed: false },
          sunday: { isClosed: true }
        }
      };

      const restaurant = new Restaurant(restaurantData);
      const savedRestaurant = await restaurant.save();

      expect(savedRestaurant.operatingHours.monday.open).toBe('09:00');
      expect(savedRestaurant.operatingHours.sunday.isClosed).toBe(true);
    });
  });

  describe('Restaurant Images', () => {
    test('should handle multiple images', async () => {
      const restaurantData = {
        name: 'Pizza Palace',
        cuisine: ['Italian'],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        phone: '+1234567890',
        email: 'info@pizzapalace.com',
        priceRange: '$$',
        deliveryTime: { min: 30, max: 45 },
        images: ['/images/restaurant1.jpg', '/images/restaurant2.jpg'],
        logo: '/images/logo.jpg',
        bannerImage: '/images/banner.jpg'
      };

      const restaurant = new Restaurant(restaurantData);
      const savedRestaurant = await restaurant.save();

      expect(savedRestaurant.images).toHaveLength(2);
      expect(savedRestaurant.logo).toBe('/images/logo.jpg');
      expect(savedRestaurant.bannerImage).toBe('/images/banner.jpg');
    });
  });
});
import mongoose from 'mongoose';
import Favorite from '../../src/models/Favorite';

describe('Favorite Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/foodsewa_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Favorite.deleteMany({});
  });

  describe('Favorite Schema Validation', () => {
    test('should create a valid restaurant favorite', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        type: 'restaurant'
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite._id).toBeDefined();
      expect(savedFavorite.userId).toEqual(favoriteData.userId);
      expect(savedFavorite.restaurantId).toEqual(favoriteData.restaurantId);
      expect(savedFavorite.type).toBe('restaurant');
      expect(savedFavorite.isActive).toBe(true);
      expect(savedFavorite.addedAt).toBeDefined();
    });

    test('should create a valid dish favorite', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        menuItemId: new mongoose.Types.ObjectId(),
        type: 'dish',
        dishDetails: {
          name: 'Margherita Pizza',
          price: 12.99,
          image: '/images/pizza.jpg',
          category: 'Pizza'
        }
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite.type).toBe('dish');
      expect(savedFavorite.menuItemId).toEqual(favoriteData.menuItemId);
      expect(savedFavorite.dishDetails.name).toBe('Margherita Pizza');
      expect(savedFavorite.dishDetails.price).toBe(12.99);
    });

    test('should fail validation for missing required fields', async () => {
      const favorite = new Favorite({});
      await expect(favorite.save()).rejects.toThrow();
    });

    test('should fail validation for invalid type', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        type: 'invalid-type'
      };

      const favorite = new Favorite(favoriteData);
      await expect(favorite.save()).rejects.toThrow();
    });

    test('should require menuItemId for dish type', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        type: 'dish'
      };

      const favorite = new Favorite(favoriteData);
      await expect(favorite.save()).rejects.toThrow();
    });

    test('should not require menuItemId for restaurant type', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        type: 'restaurant'
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite.menuItemId).toBeUndefined();
    });
  });

  describe('Favorite Unique Constraints', () => {
    test('should enforce unique restaurant favorite per user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const restaurantId = new mongoose.Types.ObjectId();
      
      const favoriteData1 = {
        userId: userId,
        restaurantId: restaurantId,
        type: 'restaurant'
      };

      const favoriteData2 = {
        userId: userId,
        restaurantId: restaurantId,
        type: 'restaurant'
      };

      await new Favorite(favoriteData1).save();
      const favorite2 = new Favorite(favoriteData2);
      
      await expect(favorite2.save()).rejects.toThrow();
    });

    test('should enforce unique dish favorite per user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const restaurantId = new mongoose.Types.ObjectId();
      const menuItemId = new mongoose.Types.ObjectId();
      
      const favoriteData1 = {
        userId: userId,
        restaurantId: restaurantId,
        menuItemId: menuItemId,
        type: 'dish'
      };

      const favoriteData2 = {
        userId: userId,
        restaurantId: restaurantId,
        menuItemId: menuItemId,
        type: 'dish'
      };

      await new Favorite(favoriteData1).save();
      const favorite2 = new Favorite(favoriteData2);
      
      await expect(favorite2.save()).rejects.toThrow();
    });

    test('should allow same user to favorite restaurant and dish from same restaurant', async () => {
      const userId = new mongoose.Types.ObjectId();
      const restaurantId = new mongoose.Types.ObjectId();
      const menuItemId = new mongoose.Types.ObjectId();
      
      const restaurantFavorite = {
        userId: userId,
        restaurantId: restaurantId,
        type: 'restaurant'
      };

      const dishFavorite = {
        userId: userId,
        restaurantId: restaurantId,
        menuItemId: menuItemId,
        type: 'dish'
      };

      const savedRestaurantFavorite = await new Favorite(restaurantFavorite).save();
      const savedDishFavorite = await new Favorite(dishFavorite).save();
      
      expect(savedRestaurantFavorite._id).toBeDefined();
      expect(savedDishFavorite._id).toBeDefined();
    });

    test('should allow different users to favorite same restaurant', async () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();
      const restaurantId = new mongoose.Types.ObjectId();
      
      const favoriteData1 = {
        userId: userId1,
        restaurantId: restaurantId,
        type: 'restaurant'
      };

      const favoriteData2 = {
        userId: userId2,
        restaurantId: restaurantId,
        type: 'restaurant'
      };

      const savedFavorite1 = await new Favorite(favoriteData1).save();
      const savedFavorite2 = await new Favorite(favoriteData2).save();
      
      expect(savedFavorite1._id).toBeDefined();
      expect(savedFavorite2._id).toBeDefined();
    });

    test('should allow different users to favorite same dish', async () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();
      const restaurantId = new mongoose.Types.ObjectId();
      const menuItemId = new mongoose.Types.ObjectId();
      
      const favoriteData1 = {
        userId: userId1,
        restaurantId: restaurantId,
        menuItemId: menuItemId,
        type: 'dish'
      };

      const favoriteData2 = {
        userId: userId2,
        restaurantId: restaurantId,
        menuItemId: menuItemId,
        type: 'dish'
      };

      const savedFavorite1 = await new Favorite(favoriteData1).save();
      const savedFavorite2 = await new Favorite(favoriteData2).save();
      
      expect(savedFavorite1._id).toBeDefined();
      expect(savedFavorite2._id).toBeDefined();
    });
  });

  describe('Dish Details', () => {
    test('should save dish details correctly', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        menuItemId: new mongoose.Types.ObjectId(),
        type: 'dish',
        dishDetails: {
          name: 'Chicken Tikka Masala',
          price: 15.99,
          image: '/images/chicken-tikka.jpg',
          category: 'Indian'
        }
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite.dishDetails.name).toBe('Chicken Tikka Masala');
      expect(savedFavorite.dishDetails.price).toBe(15.99);
      expect(savedFavorite.dishDetails.image).toBe('/images/chicken-tikka.jpg');
      expect(savedFavorite.dishDetails.category).toBe('Indian');
    });

    test('should handle partial dish details', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        menuItemId: new mongoose.Types.ObjectId(),
        type: 'dish',
        dishDetails: {
          name: 'Simple Dish',
          price: 10.00
        }
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite.dishDetails.name).toBe('Simple Dish');
      expect(savedFavorite.dishDetails.price).toBe(10.00);
      expect(savedFavorite.dishDetails.image).toBeUndefined();
      expect(savedFavorite.dishDetails.category).toBeUndefined();
    });

    test('should handle empty dish details for dish type', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        menuItemId: new mongoose.Types.ObjectId(),
        type: 'dish'
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite.dishDetails).toBeDefined();
    });
  });

  describe('Favorite Status', () => {
    test('should default isActive to true', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        type: 'restaurant'
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite.isActive).toBe(true);
    });

    test('should allow setting isActive to false', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        type: 'restaurant',
        isActive: false
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite.isActive).toBe(false);
    });
  });

  describe('Timestamps', () => {
    test('should set addedAt timestamp', async () => {
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        type: 'restaurant'
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite.addedAt).toBeDefined();
      expect(savedFavorite.addedAt).toBeInstanceOf(Date);
      expect(savedFavorite.createdAt).toBeDefined();
      expect(savedFavorite.updatedAt).toBeDefined();
    });

    test('should allow custom addedAt timestamp', async () => {
      const customDate = new Date('2024-01-01');
      const favoriteData = {
        userId: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(),
        type: 'restaurant',
        addedAt: customDate
      };

      const favorite = new Favorite(favoriteData);
      const savedFavorite = await favorite.save();

      expect(savedFavorite.addedAt).toEqual(customDate);
    });
  });
});
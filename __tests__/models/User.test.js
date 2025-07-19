import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../src/models/User';

describe('User Model', () => {

  describe('User Schema Validation', () => {
    test('should create a valid user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('user');
      expect(savedUser.isVerified).toBe(false);
      expect(savedUser.isActive).toBe(true);
    });

    test('should fail validation for missing required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation for invalid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'invalid-email',
        password: 'password123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation for short password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: '123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation for short username', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'jo',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const userData1 = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe1',
        email: 'john@example.com',
        password: 'password123'
      };

      const userData2 = {
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'janedoe',
        email: 'john@example.com',
        password: 'password123'
      };

      await new User(userData1).save();
      const user2 = new User(userData2);
      
      await expect(user2.save()).rejects.toThrow();
    });

    test('should enforce unique username', async () => {
      const userData1 = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john1@example.com',
        password: 'password123'
      };

      const userData2 = {
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john2@example.com',
        password: 'password123'
      };

      await new User(userData1).save();
      const user2 = new User(userData2);
      
      await expect(user2.save()).rejects.toThrow();
    });

    test('should validate role enum', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        role: 'invalid_role'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(50);
    });

    test('should not rehash password if not modified', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();
      const originalHash = user.password;

      user.firstName = 'Jane';
      await user.save();

      expect(user.password).toBe(originalHash);
    });
  });

  describe('User Methods', () => {
    test('comparePassword should return true for correct password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    test('comparePassword should return false for incorrect password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    test('generateResetToken should create reset token and expiry', () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      });

      const resetToken = user.generateResetToken();

      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();
      expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('User Address', () => {
    test('should save user with complete address', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.address.street).toBe('123 Main St');
      expect(savedUser.address.city).toBe('New York');
      expect(savedUser.address.zipCode).toBe('10001');
    });
  });

  describe('User Favorites', () => {
    test('should handle favorite dishes array', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        favoriteDishes: [{
          restaurantId: new mongoose.Types.ObjectId(),
          menuItemId: new mongoose.Types.ObjectId(),
          name: 'Pizza Margherita',
          price: 12.99,
          image: '/images/pizza.jpg'
        }]
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.favoriteDishes).toHaveLength(1);
      expect(savedUser.favoriteDishes[0].name).toBe('Pizza Margherita');
      expect(savedUser.favoriteDishes[0].price).toBe(12.99);
      expect(savedUser.favoriteDishes[0].addedAt).toBeDefined();
    });
  });
});
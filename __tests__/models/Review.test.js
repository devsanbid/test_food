import mongoose from 'mongoose';
import Review from '../../src/models/Review';

describe('Review Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/foodsewa_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Review.deleteMany({});
  });

  describe('Review Schema Validation', () => {
    test('should create a valid review', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 4,
          service: 5,
          delivery: 4
        },
        comment: 'Great food and excellent service! The delivery was on time and the food was still hot.',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.png'],
        tags: ['excellent-food', 'fast-delivery', 'great-service']
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();

      expect(savedReview._id).toBeDefined();
      expect(savedReview.user).toEqual(reviewData.user);
      expect(savedReview.rating.food).toBe(4);
      expect(savedReview.rating.service).toBe(5);
      expect(savedReview.rating.delivery).toBe(4);
      expect(savedReview.rating.overall).toBeDefined();
      expect(savedReview.isVerified).toBe(false);
      expect(savedReview.moderationStatus).toBe('pending');
      expect(savedReview.helpfulVotes).toBe(0);
    });

    test('should fail validation for missing required fields', async () => {
      const review = new Review({});
      await expect(review.save()).rejects.toThrow();
    });

    test('should fail validation for invalid rating values', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 6,
          service: 5
        },
        comment: 'This is a test review with invalid rating.'
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should fail validation for rating below minimum', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 0,
          service: 5
        },
        comment: 'This is a test review with invalid rating.'
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should fail validation for short comment', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 4,
          service: 5
        },
        comment: 'Short'
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should fail validation for long comment', async () => {
      const longComment = 'a'.repeat(1001);
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 4,
          service: 5
        },
        comment: longComment
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should validate image URLs', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 4,
          service: 5
        },
        comment: 'Great food and service!',
        images: ['invalid-url', 'https://example.com/valid.jpg']
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should validate moderation status enum', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 4,
          service: 5
        },
        comment: 'Great food and service!',
        moderationStatus: 'invalid-status'
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should validate tags enum', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 4,
          service: 5
        },
        comment: 'Great food and service!',
        tags: ['excellent-food', 'invalid-tag']
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    test('should enforce unique review per user per order', async () => {
      const userId = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId();
      
      const reviewData1 = {
        user: userId,
        restaurant: new mongoose.Types.ObjectId(),
        order: orderId,
        rating: {
          food: 4,
          service: 5
        },
        comment: 'First review for this order.'
      };

      const reviewData2 = {
        user: userId,
        restaurant: new mongoose.Types.ObjectId(),
        order: orderId,
        rating: {
          food: 3,
          service: 4
        },
        comment: 'Second review for same order.'
      };

      await new Review(reviewData1).save();
      const review2 = new Review(reviewData2);
      
      await expect(review2.save()).rejects.toThrow();
    });
  });

  describe('Review Rating Calculation', () => {
    test('should calculate overall rating from food and service', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 4,
          service: 5
        },
        comment: 'Good food and excellent service!'
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();

      expect(savedReview.rating.overall).toBe(4.5);
    });

    test('should calculate overall rating including delivery', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 4,
          service: 5,
          delivery: 3
        },
        comment: 'Good food, excellent service, but slow delivery.'
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();

      expect(savedReview.rating.overall).toBe(4.0);
    });

    test('should recalculate overall rating when ratings are modified', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: {
          food: 3,
          service: 3
        },
        comment: 'Average experience.'
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();
      expect(savedReview.rating.overall).toBe(3.0);

      savedReview.rating.food = 5;
      savedReview.rating.service = 5;
      const updatedReview = await savedReview.save();
      
      expect(updatedReview.rating.overall).toBe(5.0);
    });
  });

  describe('Review Methods', () => {
    test('canBeEdited should return true for recent pending review', () => {
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Test review',
        moderationStatus: 'pending',
        createdAt: new Date()
      });

      expect(review.canBeEdited()).toBe(true);
    });

    test('canBeEdited should return false for old review', () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Test review',
        moderationStatus: 'pending',
        createdAt: oldDate
      });

      expect(review.canBeEdited()).toBe(false);
    });

    test('canBeEdited should return false for approved review', () => {
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Test review',
        moderationStatus: 'approved',
        createdAt: new Date()
      });

      expect(review.canBeEdited()).toBe(false);
    });

    test('markAsHelpful should increment helpful votes', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Helpful review content here.'
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();
      
      expect(savedReview.helpfulVotes).toBe(0);
      
      await savedReview.markAsHelpful();
      expect(savedReview.helpfulVotes).toBe(1);
    });

    test('report should increment report count and flag if threshold reached', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Review that will be reported.'
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();
      
      expect(savedReview.reportCount).toBe(0);
      expect(savedReview.moderationStatus).toBe('pending');
      
      for (let i = 0; i < 5; i++) {
        await savedReview.report('inappropriate');
      }
      
      expect(savedReview.reportCount).toBe(5);
      expect(savedReview.moderationStatus).toBe('flagged');
    });
  });

  describe('Review Response', () => {
    test('should handle restaurant response', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Great experience!',
        response: {
          message: 'Thank you for your feedback!',
          respondedBy: new mongoose.Types.ObjectId(),
          respondedAt: new Date()
        }
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();

      expect(savedReview.response.message).toBe('Thank you for your feedback!');
      expect(savedReview.response.respondedBy).toBeDefined();
      expect(savedReview.response.respondedAt).toBeDefined();
    });

    test('should validate response message length', async () => {
      const longResponse = 'a'.repeat(501);
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Great experience!',
        response: {
          message: longResponse,
          respondedBy: new mongoose.Types.ObjectId()
        }
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });
  });

  describe('Review Order Details', () => {
    test('should handle order details with item ratings', async () => {
      const reviewData = {
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Great experience!',
        orderDetails: {
          items: [{
            name: 'Margherita Pizza',
            rating: 5,
            comment: 'Perfect pizza!'
          }, {
            name: 'Caesar Salad',
            rating: 4,
            comment: 'Fresh and tasty'
          }],
          deliveryTime: 35,
          orderValue: 28.99
        }
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();

      expect(savedReview.orderDetails.items).toHaveLength(2);
      expect(savedReview.orderDetails.items[0].rating).toBe(5);
      expect(savedReview.orderDetails.deliveryTime).toBe(35);
      expect(savedReview.orderDetails.orderValue).toBe(28.99);
    });
  });

  describe('Review Virtuals', () => {
    test('should calculate review age', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Test review',
        createdAt: pastDate
      });

      expect(review.reviewAge).toBeGreaterThan(0);
    });

    test('should format date correctly', () => {
      const testDate = new Date('2024-01-15');
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        restaurant: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        rating: { food: 4, service: 5 },
        comment: 'Test review',
        createdAt: testDate
      });

      expect(review.formattedDate).toContain('January');
      expect(review.formattedDate).toContain('15');
      expect(review.formattedDate).toContain('2024');
    });
  });
});
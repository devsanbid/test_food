import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant is required']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required']
  },
  rating: {
    food: {
      type: Number,
      required: [true, 'Food rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    service: {
      type: Number,
      required: [true, 'Service rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    delivery: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    }
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [1000, 'Review cannot be more than 1000 characters']
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Helpful votes cannot be negative']
  },
  reportCount: {
    type: Number,
    default: 0,
    min: [0, 'Report count cannot be negative']
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationNotes: {
    type: String,
    trim: true
  },
  response: {
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Response cannot be more than 500 characters']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  tags: [{
    type: String,
    enum: [
      'excellent-food',
      'fast-delivery',
      'great-service',
      'good-value',
      'fresh-ingredients',
      'hot-food',
      'accurate-order',
      'friendly-staff',
      'clean-packaging',
      'on-time',
      'poor-quality',
      'late-delivery',
      'cold-food',
      'wrong-order',
      'expensive',
      'poor-packaging',
      'rude-staff'
    ]
  }],
  orderDetails: {
    items: [{
      name: String,
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String
    }],
    deliveryTime: Number, // in minutes
    orderValue: Number
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ moderationStatus: 1 });
reviewSchema.index({ isHidden: 1 });

// Compound index for restaurant reviews with filters
reviewSchema.index({ restaurant: 1, 'rating.overall': -1, createdAt: -1 });

// Ensure one review per user per order
reviewSchema.index({ user: 1, order: 1 }, { unique: true });

// Pre-save middleware to calculate overall rating
reviewSchema.pre('save', function(next) {
  if (this.isModified('rating.food') || this.isModified('rating.service') || this.isModified('rating.delivery')) {
    const ratings = [this.rating.food, this.rating.service];
    if (this.rating.delivery) {
      ratings.push(this.rating.delivery);
    }
    
    this.rating.overall = Math.round(
      (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10
    ) / 10;
  }
  next();
});

// Virtual for review age
reviewSchema.virtual('reviewAge').get(function() {
  return Date.now() - this.createdAt;
});

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to check if review can be edited
reviewSchema.methods.canBeEdited = function() {
  const hoursSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24 && this.moderationStatus === 'pending';
};

// Method to mark as helpful
reviewSchema.methods.markAsHelpful = function() {
  this.helpfulVotes += 1;
  return this.save();
};

// Method to report review
reviewSchema.methods.report = function(reason) {
  this.reportCount += 1;
  if (this.reportCount >= 5) {
    this.moderationStatus = 'flagged';
  }
  return this.save();
};

// Static method to get restaurant average rating
reviewSchema.statics.getRestaurantAverageRating = async function(restaurantId) {
  const result = await this.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        isHidden: false,
        moderationStatus: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageFood: { $avg: '$rating.food' },
        averageService: { $avg: '$rating.service' },
        averageDelivery: { $avg: '$rating.delivery' },
        averageOverall: { $avg: '$rating.overall' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating.overall'
        }
      }
    },
    {
      $project: {
        averageFood: { $round: ['$averageFood', 1] },
        averageService: { $round: ['$averageService', 1] },
        averageDelivery: { $round: ['$averageDelivery', 1] },
        averageOverall: { $round: ['$averageOverall', 1] },
        totalReviews: 1,
        ratingDistribution: {
          5: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $gte: ['$$this', 4.5] }
              }
            }
          },
          4: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $and: [{ $gte: ['$$this', 3.5] }, { $lt: ['$$this', 4.5] }] }
              }
            }
          },
          3: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $and: [{ $gte: ['$$this', 2.5] }, { $lt: ['$$this', 3.5] }] }
              }
            }
          },
          2: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $and: [{ $gte: ['$$this', 1.5] }, { $lt: ['$$this', 2.5] }] }
              }
            }
          },
          1: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $lt: ['$$this', 1.5] }
              }
            }
          }
        }
      }
    }
  ]);
  
  return result[0] || {
    averageFood: 0,
    averageService: 0,
    averageDelivery: 0,
    averageOverall: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
};

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
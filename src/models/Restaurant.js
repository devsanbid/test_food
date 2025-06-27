import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['appetizer', 'main', 'dessert', 'beverage', 'side']
  },
  image: {
    type: String,
    default: '/images/default-food.jpg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15 // in minutes
  },
  ingredients: [{
    type: String
  }],
  allergens: [{
    type: String
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'extra-hot'],
    default: 'mild'
  }
}, {
  timestamps: true
});

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  cuisine: [{
    type: String,
    required: [true, 'At least one cuisine type is required']
  }],
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required']
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  website: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  logo: {
    type: String,
    default: '/images/default-restaurant.jpg'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    required: [true, 'Price range is required']
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative']
  },
  minimumOrder: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order cannot be negative']
  },
  deliveryTime: {
    min: {
      type: Number,
      required: [true, 'Minimum delivery time is required']
    },
    max: {
      type: Number,
      required: [true, 'Maximum delivery time is required']
    }
  },
  operatingHours: {
    monday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    tuesday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    wednesday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    thursday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    friday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    saturday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    sunday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    }
  },
  menu: [menuItemSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Restaurant owner is required']
  },
  tags: [{
    type: String
  }],
  features: [{
    type: String,
    enum: ['delivery', 'pickup', 'dine-in', 'outdoor-seating', 'wifi', 'parking', 'wheelchair-accessible']
  }],
  paymentMethods: [{
    type: String,
    enum: ['cash', 'card', 'digital-wallet', 'online']
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
restaurantSchema.index({ 'address.coordinates': '2dsphere' });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ 'rating.average': -1 });
restaurantSchema.index({ name: 'text', description: 'text' });

// Virtual for full address
restaurantSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Method to check if restaurant is currently open
restaurantSchema.methods.isCurrentlyOpen = function() {
  const now = new Date();
  const currentDay = now.toLocaleLowerCase().substring(0, 3); // mon, tue, etc.
  const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
  
  const daySchedule = this.operatingHours[currentDay];
  if (!daySchedule || daySchedule.isClosed) {
    return false;
  }
  
  return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
};

// Method to calculate distance from user location
restaurantSchema.methods.calculateDistance = function(userLat, userLng) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (userLat - this.address.coordinates.latitude) * Math.PI / 180;
  const dLng = (userLng - this.address.coordinates.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.address.coordinates.latitude * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Menu item reference is required']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant is required']
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Maximum 10 items allowed per menu item']
  },
  image: {
    type: String,
    default: '/images/default-food.jpg'
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  customizations: [{
    name: {
      type: String,
      required: [true, 'Customization name is required']
    },
    value: {
      type: String,
      required: [true, 'Customization value is required']
    },
    additionalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Additional price cannot be negative']
    }
  }],
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Special instructions cannot be more than 200 characters']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15 // in minutes
  }
}, {
  _id: false,
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  items: [cartItemSchema],
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  restaurantName: {
    type: String
  },
  subtotal: {
    type: Number,
    default: 0,
    min: [0, 'Subtotal cannot be negative']
  },
  itemCount: {
    type: Number,
    default: 0,
    min: [0, 'Item count cannot be negative']
  },
  estimatedDeliveryTime: {
    type: Number, // in minutes
    default: 30
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative']
  },
  minimumOrderAmount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    trim: true
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Cart expires after 24 hours of inactivity
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sessionId: {
    type: String
  },
  deviceInfo: {
    platform: {
      type: String,
      enum: ['web', 'ios', 'android']
    },
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
cartSchema.index({ user: 1 });
cartSchema.index({ restaurant: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cartSchema.index({ lastUpdated: 1 });
cartSchema.index({ isActive: 1 });

// Virtual for total price including customizations
cartSchema.virtual('totalPrice').get(function() {
  return this.items.reduce((total, item) => {
    const itemPrice = item.price * item.quantity;
    const customizationPrice = item.customizations.reduce((sum, custom) => {
      return sum + (custom.additionalPrice * item.quantity);
    }, 0);
    return total + itemPrice + customizationPrice;
  }, 0);
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for estimated total preparation time
cartSchema.virtual('estimatedPrepTime').get(function() {
  if (this.items.length === 0) return 0;
  return Math.max(...this.items.map(item => item.preparationTime || 15));
});

// Pre-save middleware to update calculated fields
cartSchema.pre('save', function(next) {
  this.subtotal = this.totalPrice;
  this.itemCount = this.totalItems;
  this.lastUpdated = new Date();
  
  // Reset expiry time on update
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(itemData) {
  // Check if cart is from different restaurant
  if (this.restaurant && this.restaurant.toString() !== itemData.restaurant.toString()) {
    throw new Error('Cannot add items from different restaurants. Please clear your cart first.');
  }
  
  // Set restaurant if this is the first item
  if (!this.restaurant) {
    this.restaurant = itemData.restaurant;
    this.restaurantName = itemData.restaurantName;
  }
  
  // Check if item with same customizations already exists
  const existingItemIndex = this.items.findIndex(item => 
    item.menuItem.toString() === itemData.menuItem.toString() &&
    JSON.stringify(item.customizations) === JSON.stringify(itemData.customizations || []) &&
    item.specialInstructions === (itemData.specialInstructions || '')
  );
  
  if (existingItemIndex > -1) {
    // Update quantity of existing item
    const newQuantity = this.items[existingItemIndex].quantity + (itemData.quantity || 1);
    if (newQuantity > 10) {
      throw new Error('Maximum 10 items allowed per menu item');
    }
    this.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    this.items.push({
      menuItem: itemData.menuItem,
      restaurant: itemData.restaurant,
      name: itemData.name,
      description: itemData.description,
      price: itemData.price,
      quantity: itemData.quantity || 1,
      image: itemData.image,
      category: itemData.category,
      customizations: itemData.customizations || [],
      specialInstructions: itemData.specialInstructions || '',
      isAvailable: itemData.isAvailable !== false,
      preparationTime: itemData.preparationTime || 15
    });
  }
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemIndex, quantity) {
  if (itemIndex < 0 || itemIndex >= this.items.length) {
    throw new Error('Invalid item index');
  }
  
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }
  
  if (quantity > 10) {
    throw new Error('Maximum 10 items allowed per menu item');
  }
  
  this.items[itemIndex].quantity = quantity;
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemIndex) {
  if (itemIndex < 0 || itemIndex >= this.items.length) {
    throw new Error('Invalid item index');
  }
  
  this.items.splice(itemIndex, 1);
  
  // Clear restaurant if no items left
  if (this.items.length === 0) {
    this.restaurant = undefined;
    this.restaurantName = undefined;
    this.couponCode = undefined;
    this.discount = 0;
  }
  
  return this.save();
};

// Method to clear entire cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.restaurant = undefined;
  this.restaurantName = undefined;
  this.couponCode = undefined;
  this.discount = 0;
  this.subtotal = 0;
  this.itemCount = 0;
  
  return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discountAmount) {
  this.couponCode = couponCode;
  this.discount = discountAmount;
  return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function() {
  this.couponCode = undefined;
  this.discount = 0;
  return this.save();
};

// Method to check if cart meets minimum order requirement
cartSchema.methods.meetsMinimumOrder = function() {
  return this.subtotal >= this.minimumOrderAmount;
};

// Method to get cart summary
cartSchema.methods.getSummary = function() {
  return {
    itemCount: this.totalItems,
    subtotal: this.subtotal,
    discount: this.discount,
    deliveryFee: this.deliveryFee,
    total: this.subtotal + this.deliveryFee - this.discount,
    restaurant: {
      id: this.restaurant,
      name: this.restaurantName
    },
    estimatedDeliveryTime: this.estimatedDeliveryTime,
    meetsMinimumOrder: this.meetsMinimumOrder()
  };
};

// Method to validate cart items availability
cartSchema.methods.validateAvailability = async function() {
  const Restaurant = mongoose.model('Restaurant');
  
  if (!this.restaurant) {
    return { isValid: true, unavailableItems: [] };
  }
  
  const restaurant = await Restaurant.findById(this.restaurant);
  if (!restaurant) {
    return { isValid: false, error: 'Restaurant not found' };
  }
  
  const unavailableItems = [];
  
  for (let i = 0; i < this.items.length; i++) {
    const cartItem = this.items[i];
    const menuItem = restaurant.menu.id(cartItem.menuItem);
    
    if (!menuItem || !menuItem.isAvailable) {
      unavailableItems.push({
        index: i,
        name: cartItem.name,
        reason: !menuItem ? 'Item no longer available' : 'Item temporarily unavailable'
      });
    }
  }
  
  return {
    isValid: unavailableItems.length === 0,
    unavailableItems
  };
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId, isActive: true });
  
  if (!cart) {
    cart = await this.create({ user: userId });
  }
  
  return cart;
};

// Static method to cleanup expired carts
cartSchema.statics.cleanupExpiredCarts = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export default Cart;
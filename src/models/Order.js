import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Menu item is required']
  },
  name: {
    type: String,
    required: [true, 'Item name is required']
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Special instructions cannot be more than 200 characters']
  },
  customizations: [{
    name: String,
    value: String,
    additionalPrice: {
      type: Number,
      default: 0
    }
  }]
}, {
  _id: false
});

const deliveryAddressSchema = new mongoose.Schema({
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
    latitude: Number,
    longitude: Number
  },
  apartmentNumber: String,
  deliveryInstructions: {
    type: String,
    maxlength: [200, 'Delivery instructions cannot be more than 200 characters']
  }
}, {
  _id: false
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'card', 'digital-wallet', 'online']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  amount: {
    type: Number,
    required: [true, 'Payment amount is required']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paidAt: Date,
  refundedAt: Date,
  refundAmount: Number
}, {
  _id: false
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: [true, 'Order number is required']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant is required']
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out-for-delivery',
      'delivered',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup', 'dine-in'],
    required: [true, 'Order type is required']
  },
  deliveryAddress: {
    type: deliveryAddressSchema,
    required: function() {
      return this.orderType === 'delivery';
    }
  },
  pricing: {
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    },
    tax: {
      type: Number,
      required: [true, 'Tax is required'],
      min: [0, 'Tax cannot be negative']
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, 'Delivery fee cannot be negative']
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: [0, 'Service fee cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    tip: {
      type: Number,
      default: 0,
      min: [0, 'Tip cannot be negative']
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative']
    }
  },
  payment: paymentSchema,
  estimatedDeliveryTime: {
    type: Date,
    required: function() {
      return this.orderType === 'delivery';
    }
  },
  estimatedPickupTime: {
    type: Date,
    required: function() {
      return this.orderType === 'pickup';
    }
  },
  actualDeliveryTime: Date,
  preparationTime: {
    estimated: Number, // in minutes
    actual: Number // in minutes
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Special instructions cannot be more than 500 characters']
  },
  couponCode: {
    type: String,
    trim: true
  },
  rating: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot be more than 500 characters']
    },
    ratedAt: Date
  },
  trackingInfo: {
    driverName: String,
    driverPhone: String,
    driverLocation: {
      latitude: Number,
      longitude: Number,
      lastUpdated: Date
    },
    estimatedArrival: Date
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['customer', 'restaurant', 'admin', 'system']
    },
    cancelledAt: Date,
    refundAmount: Number
  },
  tracking: {
    history: [{
      status: {
        type: String,
        enum: [
          'pending',
          'confirmed',
          'preparing',
          'ready',
          'out-for-delivery',
          'delivered',
          'cancelled'
        ]
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      description: String,
      location: String
    }],
    currentLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      lastUpdated: Date
    }
  },
  notifications: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'push', 'in-app']
    },
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });

// Pre-save middleware to generate order number and initialize tracking
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `FS${timestamp.slice(-6)}${random}`;
  }
  
  // Initialize tracking history for new orders
  if (this.isNew && (!this.tracking || !this.tracking.history || this.tracking.history.length === 0)) {
    this.tracking = {
      history: [{
        status: this.status || 'pending',
        timestamp: new Date(),
        description: `Order ${this.status || 'pending'}`,
        location: 'System'
      }],
      currentLocation: {}
    };
  }
  
  next();
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Date.now() - this.createdAt;
});

// Method to calculate total price
orderSchema.methods.calculateTotal = function() {
  const subtotal = this.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const customizationTotal = item.customizations.reduce((customSum, custom) => {
      return customSum + (custom.additionalPrice || 0);
    }, 0);
    return sum + itemTotal + customizationTotal;
  }, 0);
  
  this.pricing.subtotal = subtotal;
  this.pricing.total = subtotal + this.pricing.tax + this.pricing.deliveryFee + 
                     this.pricing.serviceFee + this.pricing.tip - this.pricing.discount;
  
  return this.pricing.total;
};

// Method to check if order can be cancelled
orderSchema.methods.canCancel = function() {
  const nonCancellableStatuses = ['delivered', 'cancelled', 'refunded'];
  return !nonCancellableStatuses.includes(this.status);
};

// Method to check if order can be rated
orderSchema.methods.canRate = function() {
  return this.status === 'delivered' && !this.rating.overall;
};

// Method to get estimated delivery time
orderSchema.methods.getEstimatedDeliveryTime = function() {
  if (this.orderType !== 'delivery') return null;
  
  const now = new Date();
  const prepTime = this.preparationTime.estimated || 30; // default 30 minutes
  const deliveryTime = 20; // default 20 minutes delivery time
  
  return new Date(now.getTime() + (prepTime + deliveryTime) * 60000);
};

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
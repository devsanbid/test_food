import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'bogo', 'free-delivery'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        if (this.type === 'percentage') {
          return v <= 100;
        }
        return true;
      },
      message: 'Percentage value cannot exceed 100'
    }
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Code cannot be more than 20 characters']
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  maximumDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Maximum discount cannot be negative']
  },
  usageLimit: {
    type: Number,
    default: 0,
    min: [0, 'Usage limit cannot be negative']
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  userLimit: {
    type: Number,
    default: 1,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  applicableItems: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  customerSegment: {
    type: [String],
    enum: ['all', 'new', 'returning', 'vip', 'premium'],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  redemptions: {
    type: Number,
    default: 0,
    min: 0
  },
  revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  conversionRate: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

discountSchema.virtual('status').get(function() {
  const now = new Date();
  if (!this.isActive) {
    return 'inactive';
  }
  if (this.usageLimit > 0 && this.usageCount >= this.usageLimit) {
    return 'exhausted';
  }
  if (this.endDate < now) {
    return 'expired';
  }
  if (this.startDate > now) {
    return 'upcoming';
  }
  return 'active';
});

discountSchema.virtual('usagePercentage').get(function() {
  if (this.usageLimit === 0) return 0;
  return (this.usageCount / this.usageLimit) * 100;
});

discountSchema.virtual('isExpired').get(function() {
  return this.endDate < new Date();
});

discountSchema.virtual('isScheduled').get(function() {
  return this.startDate > new Date();
});

discountSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

discountSchema.set('toJSON', { virtuals: true });
discountSchema.set('toObject', { virtuals: true });

discountSchema.index({ restaurant: 1, code: 1 }, { unique: true });
discountSchema.index({ restaurant: 1, isActive: 1 });
discountSchema.index({ restaurant: 1, startDate: 1, endDate: 1 });

const Discount = mongoose.models.Discount || mongoose.model('Discount', discountSchema);

export default Discount;
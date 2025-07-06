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
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'bogo', 'free_delivery'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  usageLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  usedCount: {
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
  applicableItems: [{
    type: String,
    trim: true
  }],
  customerSegment: {
    type: String,
    enum: ['all', 'new', 'returning', 'vip'],
    default: 'all'
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
  if (this.endDate < now) {
    return 'expired';
  } else if (this.startDate > now) {
    return 'scheduled';
  } else {
    return 'active';
  }
});

discountSchema.virtual('usagePercentage').get(function() {
  if (this.usageLimit === 0) return 0;
  return (this.usedCount / this.usageLimit) * 100;
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

discountSchema.index({ restaurant: 1, code: 1 });
discountSchema.index({ restaurant: 1, isActive: 1 });
discountSchema.index({ restaurant: 1, startDate: 1, endDate: 1 });
discountSchema.index({ code: 1 }, { unique: true });

const Discount = mongoose.models.Discount || mongoose.model('Discount', discountSchema);

export default Discount;
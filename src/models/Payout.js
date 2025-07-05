import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  payoutId: {
    type: String,
    unique: true,
    required: [true, 'Payout ID is required']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payout amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  commission: {
    type: Number,
    required: [true, 'Commission amount is required'],
    min: [0, 'Commission cannot be negative']
  },
  netAmount: {
    type: Number,
    required: [true, 'Net amount is required'],
    min: [0, 'Net amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe', 'check'],
      required: true
    },
    details: {
      accountNumber: String,
      routingNumber: String,
      accountName: String,
      email: String
    }
  },
  reference: {
    type: String,
    required: [true, 'Payment reference is required']
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  orderCount: {
    type: Number,
    required: [true, 'Order count is required'],
    min: [0, 'Order count cannot be negative']
  },
  period: {
    startDate: {
      type: Date,
      required: [true, 'Period start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Period end date is required']
    }
  },
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  failureReason: String,
  notes: String
}, {
  timestamps: true
});

payoutSchema.index({ restaurant: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ payoutId: 1 });

payoutSchema.pre('save', async function(next) {
  if (!this.payoutId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.payoutId = `PO-${new Date().getFullYear()}-${timestamp.slice(-6)}${random}`;
  }
  next();
});

payoutSchema.virtual('payoutAge').get(function() {
  return Date.now() - this.createdAt;
});

payoutSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.processedAt = new Date();
  return this.save();
};

payoutSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

payoutSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  return this.save();
};

const Payout = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);

export default Payout;
import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.type === 'dish';
    }
  },
  type: {
    type: String,
    enum: ['restaurant', 'dish'],
    required: true
  },
  dishDetails: {
    name: String,
    price: Number,
    image: String,
    category: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

favoriteSchema.index({ userId: 1, restaurantId: 1, type: 1 }, { unique: true, partialFilterExpression: { type: 'restaurant' } });
favoriteSchema.index({ userId: 1, restaurantId: 1, menuItemId: 1 }, { unique: true, partialFilterExpression: { type: 'dish' } });
favoriteSchema.index({ userId: 1, type: 1 });
favoriteSchema.index({ userId: 1, addedAt: -1 });

if (mongoose.models.Favorite) {
  delete mongoose.models.Favorite;
}

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
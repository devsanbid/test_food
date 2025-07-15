import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import Restaurant from '@/models/Restaurant';
import Review from '@/models/Review';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Get restaurant details with menu
export async function GET(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const includeMenu = searchParams.get('includeMenu') !== 'false';
    const includeReviews = searchParams.get('includeReviews') === 'true';
    const menuCategory = searchParams.get('menuCategory') || '';
    const reviewsPage = parseInt(searchParams.get('reviewsPage')) || 1;
    const reviewsLimit = parseInt(searchParams.get('reviewsLimit')) || 10;
    const userLatitude = parseFloat(searchParams.get('latitude'));
    const userLongitude = parseFloat(searchParams.get('longitude'));

    // Validate restaurant ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid restaurant ID' },
        { status: 400 }
      );
    }

    // Build restaurant query
    let restaurantQuery = Restaurant.findById(id);
    
    if (!includeMenu) {
      restaurantQuery = restaurantQuery.select('-menu');
    }

    const restaurant = await restaurantQuery.exec();

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (!restaurant.isActive) {
      return NextResponse.json(
        { success: false, message: 'Restaurant is not available' },
        { status: 404 }
      );
    }

    // Calculate distance if user location provided
    let distance = null;
    if (userLatitude && userLongitude) {
      distance = restaurant.calculateDistance(userLatitude, userLongitude);
    }

    // Check if restaurant is currently open
    const isCurrentlyOpen = restaurant.isCurrentlyOpen();

    // Filter menu by category if specified
    let menu = restaurant.menu;
    if (includeMenu && menuCategory) {
      menu = restaurant.menu.filter(item => 
        item.category.toLowerCase() === menuCategory.toLowerCase()
      );
    }

    // Get menu categories
    const menuCategories = includeMenu ? 
      [...new Set(restaurant.menu.map(item => item.category))] : [];

    // Prepare restaurant data
    const restaurantData = {
      _id: restaurant._id,
      name: restaurant.name,
      description: restaurant.description,
      cuisine: restaurant.cuisine,
      profileImage: restaurant.profileImage,
      bannerImage: restaurant.bannerImage,
      address: restaurant.address,
      phone: restaurant.phone,
      email: restaurant.email,
      website: restaurant.website,
      images: restaurant.images,
      logo: restaurant.logo,
      rating: restaurant.rating,
      priceRange: restaurant.priceRange,
      deliveryFee: restaurant.deliveryFee,
      minimumOrder: restaurant.minimumOrder,
      deliveryTime: restaurant.deliveryTime,
      operatingHours: restaurant.operatingHours,
      features: restaurant.features,
      paymentMethods: restaurant.paymentMethods,
      tags: restaurant.tags,
      isCurrentlyOpen,
      distance,
      menuCategories
    };

    if (includeMenu) {
      restaurantData.menu = menu;
    }

    // Get reviews if requested
    let reviewsData = null;
    if (includeReviews) {
      const reviewsSkip = (reviewsPage - 1) * reviewsLimit;
      
      const reviews = await Review.find({
        restaurant: id,
        isHidden: false,
        moderationStatus: { $in: ['approved', 'pending'] }
      })
      .populate('user', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .skip(reviewsSkip)
      .limit(reviewsLimit)
      .select('-reportCount -moderationNotes');

      const totalReviews = await Review.countDocuments({
        restaurant: id,
        isHidden: false,
        moderationStatus: { $in: ['approved', 'pending'] }
      });

      const reviewStats = await Review.getRestaurantAverageRating(id);

      reviewsData = {
        reviews,
        pagination: {
          currentPage: reviewsPage,
          totalPages: Math.ceil(totalReviews / reviewsLimit),
          totalReviews,
          hasNextPage: reviewsPage < Math.ceil(totalReviews / reviewsLimit),
          hasPrevPage: reviewsPage > 1
        },
        stats: reviewStats
      };
    }

    // Check if user has this restaurant in favorites
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findById(user.id).select('favorites');
    const isFavorite = userDoc?.favorites?.includes(id) || false;

    // Get similar restaurants
    const similarRestaurants = await Restaurant.find({
      _id: { $ne: id },
      cuisine: { $in: restaurant.cuisine },
      isActive: true,
      isVerified: true
    })
    .select('name logo rating priceRange deliveryTime deliveryFee cuisine')
    .sort({ 'rating.average': -1 })
    .limit(4);

    return NextResponse.json({
      success: true,
      data: {
        restaurant: restaurantData,
        reviews: reviewsData,
        isFavorite,
        similarRestaurants
      }
    });
  } catch (error) {
    console.error('Restaurant details fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add review or perform other actions
export async function POST(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Validate restaurant ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid restaurant ID' },
        { status: 400 }
      );
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'toggle-favorite':
        const User = (await import('@/models/User')).default;
        
        const userDoc = await User.findById(user.id);
        if (!userDoc) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }

        const favorites = userDoc.favorites || [];
        const isFavorite = favorites.includes(id);

        let updatedFavorites;
        if (isFavorite) {
          updatedFavorites = favorites.filter(favId => favId.toString() !== id);
        } else {
          updatedFavorites = [...favorites, id];
        }

        await User.findByIdAndUpdate(user.id, {
          favorites: updatedFavorites
        });

        return NextResponse.json({
          success: true,
          message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
          isFavorite: !isFavorite
        });

      case 'add-review':
        const { orderId, rating, comment, images, tags } = body;

        // Validate required fields
        if (!orderId || !rating || !comment) {
          return NextResponse.json(
            { success: false, message: 'Order ID, rating, and comment are required' },
            { status: 400 }
          );
        }

        // Validate rating
        if (!rating.food || !rating.service || !rating.overall) {
          return NextResponse.json(
            { success: false, message: 'Food, service, and overall ratings are required' },
            { status: 400 }
          );
        }

        // Check if user has already reviewed this order
        const existingReview = await Review.findOne({
          user: user.id,
          order: orderId
        });

        if (existingReview) {
          return NextResponse.json(
            { success: false, message: 'You have already reviewed this order' },
            { status: 400 }
          );
        }

        // Verify order belongs to user and restaurant
        const Order = (await import('@/models/Order')).default;
        const order = await Order.findOne({
          _id: orderId,
          customer: user.id,
          restaurant: id,
          status: 'delivered'
        });

        if (!order) {
          return NextResponse.json(
            { success: false, message: 'Invalid order or order not delivered yet' },
            { status: 400 }
          );
        }

        // Create review
        const review = await Review.create({
          user: user.id,
          restaurant: id,
          order: orderId,
          rating,
          comment: comment.trim(),
          images: images || [],
          tags: tags || [],
          orderDetails: {
            items: order.items.map(item => ({
              name: item.name,
              rating: rating.food // Default to food rating
            })),
            deliveryTime: order.actualDeliveryTime ? 
              Math.round((order.actualDeliveryTime - order.createdAt) / 60000) : null,
            orderValue: order.pricing.total
          }
        });

        // Update restaurant rating
        const updatedStats = await Review.getRestaurantAverageRating(id);
        await Restaurant.findByIdAndUpdate(id, {
          'rating.average': updatedStats.averageOverall,
          'rating.count': updatedStats.totalReviews
        });

        return NextResponse.json({
          success: true,
          message: 'Review added successfully',
          review
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant action error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, message: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
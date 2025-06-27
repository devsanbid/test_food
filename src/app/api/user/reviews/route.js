import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Get user's reviews with filtering and pagination
export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const rating = parseInt(searchParams.get('rating')) || 0;
    const restaurantId = searchParams.get('restaurantId') || '';
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const isHidden = searchParams.get('isHidden');

    // Build query
    let query = { user: user.id };

    // Rating filter
    if (rating > 0) {
      query['rating.overall'] = rating;
    }

    // Restaurant filter
    if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
      query.restaurant = restaurantId;
    }

    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    // Hidden status filter
    if (isHidden !== null && isHidden !== '') {
      query.isHidden = isHidden === 'true';
    }

    // Search filter (comment content)
    if (search) {
      query.comment = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    let sort = {};
    if (sortBy === 'rating') {
      sort['rating.overall'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'helpful') {
      sort.helpfulVotes = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const reviews = await Review.find(query)
      .populate('restaurant', 'name logo cuisine priceRange')
      .populate('order', 'orderNumber createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limit);

    // Get review statistics
    const stats = await Review.aggregate([
      { $match: { user: mongoose.Types.ObjectId(user.id) } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgOverallRating: { $avg: '$rating.overall' },
          avgFoodRating: { $avg: '$rating.food' },
          avgServiceRating: { $avg: '$rating.service' },
          avgDeliveryRating: { $avg: '$rating.delivery' },
          totalHelpfulVotes: { $sum: '$helpfulVotes' },
          ratingDistribution: {
            $push: '$rating.overall'
          },
          reviewsWithImages: {
            $sum: {
              $cond: [
                { $gt: [{ $size: '$images' }, 0] },
                1,
                0
              ]
            }
          },
          verifiedReviews: {
            $sum: {
              $cond: ['$isVerified', 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          avgOverallRating: { $round: ['$avgOverallRating', 1] },
          avgFoodRating: { $round: ['$avgFoodRating', 1] },
          avgServiceRating: { $round: ['$avgServiceRating', 1] },
          avgDeliveryRating: { $round: ['$avgDeliveryRating', 1] },
          totalHelpfulVotes: 1,
          reviewsWithImages: 1,
          verifiedReviews: 1,
          ratingDistribution: {
            '5': {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 5] }
                }
              }
            },
            '4': {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 4] }
                }
              }
            },
            '3': {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 3] }
                }
              }
            },
            '2': {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 2] }
                }
              }
            },
            '1': {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 1] }
                }
              }
            }
          }
        }
      }
    ]);

    // Get most reviewed restaurants
    const topRestaurants = await Review.aggregate([
      { $match: { user: mongoose.Types.ObjectId(user.id) } },
      { $group: { _id: '$restaurant', count: { $sum: 1 }, avgRating: { $avg: '$rating.overall' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' },
      {
        $project: {
          _id: '$restaurant._id',
          name: '$restaurant.name',
          logo: '$restaurant.logo',
          cuisine: '$restaurant.cuisine',
          reviewCount: '$count',
          avgRating: { $round: ['$avgRating', 1] }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages,
          totalReviews,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats: stats[0] || {
          totalReviews: 0,
          avgOverallRating: 0,
          avgFoodRating: 0,
          avgServiceRating: 0,
          avgDeliveryRating: 0,
          totalHelpfulVotes: 0,
          reviewsWithImages: 0,
          verifiedReviews: 0,
          ratingDistribution: {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0
          }
        },
        topRestaurants
      }
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new review
export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      restaurantId,
      orderId,
      rating,
      comment,
      images,
      isAnonymous,
      tags
    } = body;

    // Validate required fields
    if (!restaurantId || !orderId || !rating || !rating.overall) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID, Order ID, and overall rating are required' },
        { status: 400 }
      );
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid restaurant ID or order ID' },
        { status: 400 }
      );
    }

    // Validate rating values
    if (rating.overall < 1 || rating.overall > 5) {
      return NextResponse.json(
        { success: false, message: 'Overall rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      customer: user.id,
      restaurant: restaurantId,
      status: 'delivered'
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or not eligible for review' },
        { status: 404 }
      );
    }

    // Check if review already exists for this order
    const existingReview = await Review.findOne({
      user: user.id,
      order: orderId
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: 'Review already exists for this order' },
        { status: 400 }
      );
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Create review
    const review = await Review.create({
      user: user.id,
      restaurant: restaurantId,
      order: orderId,
      rating: {
        food: rating.food || rating.overall,
        service: rating.service || rating.overall,
        delivery: rating.delivery || rating.overall,
        overall: rating.overall
      },
      comment: comment || '',
      images: images || [],
      isVerified: true, // Since it's from a delivered order
      isAnonymous: isAnonymous || false,
      orderType: order.orderType,
      tags: tags || []
    });

    // Update order with review reference
    order.rating = {
      rating: rating.overall,
      review: review._id,
      ratedAt: new Date()
    };
    await order.save();

    // Populate the review for response
    await review.populate('restaurant', 'name logo');
    await review.populate('order', 'orderNumber');

    return NextResponse.json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Review creation error:', error);
    
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

// PUT - Update a review
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      reviewId,
      rating,
      comment,
      images,
      isAnonymous,
      tags
    } = body;

    // Validate review ID
    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { success: false, message: 'Valid review ID is required' },
        { status: 400 }
      );
    }

    // Find review
    const review = await Review.findOne({
      _id: reviewId,
      user: user.id
    });

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if review can be edited
    if (!review.canEdit()) {
      return NextResponse.json(
        { success: false, message: 'Review can no longer be edited' },
        { status: 400 }
      );
    }

    // Update fields if provided
    if (rating && rating.overall) {
      if (rating.overall < 1 || rating.overall > 5) {
        return NextResponse.json(
          { success: false, message: 'Overall rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      
      review.rating = {
        food: rating.food || rating.overall,
        service: rating.service || rating.overall,
        delivery: rating.delivery || rating.overall,
        overall: rating.overall
      };
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    if (images !== undefined) {
      review.images = images;
    }

    if (isAnonymous !== undefined) {
      review.isAnonymous = isAnonymous;
    }

    if (tags !== undefined) {
      review.tags = tags;
    }

    // Mark as edited
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    // Populate the review for response
    await review.populate('restaurant', 'name logo');
    await review.populate('order', 'orderNumber');

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Review update error:', error);
    
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

// DELETE - Delete a review
export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    // Validate review ID
    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { success: false, message: 'Valid review ID is required' },
        { status: 400 }
      );
    }

    // Find review
    const review = await Review.findOne({
      _id: reviewId,
      user: user.id
    });

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if review can be deleted (within 24 hours of creation)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (review.createdAt < twentyFourHoursAgo) {
      return NextResponse.json(
        { success: false, message: 'Review can only be deleted within 24 hours of creation' },
        { status: 400 }
      );
    }

    // Remove review reference from order
    await Order.updateOne(
      { _id: review.order },
      { $unset: { rating: 1 } }
    );

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Review deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
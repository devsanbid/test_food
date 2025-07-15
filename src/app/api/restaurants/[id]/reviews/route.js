import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Review from '@/models/Review';
import Restaurant from '@/models/Restaurant';
import mongoose from 'mongoose';

// GET - Get public reviews for a specific restaurant
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id: restaurantId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const rating = searchParams.get('rating');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    // Validate restaurant ID
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid restaurant ID' },
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

    // Build query for reviews
    let query = {
      restaurant: new mongoose.Types.ObjectId(restaurantId),
      moderationStatus: 'approved',
      isHidden: false
    };

    // Rating filter
    if (rating) {
      query.overall = parseInt(rating);
    }

    // Search filter (comment content)
    if (search) {
      query.comment = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    let sort = {};
    if (sortBy === 'helpful') {
      sort.helpfulVotes = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'overall') {
      sort.overall = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .populate('order', 'orderNumber items')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limit);

    // Get review statistics for the restaurant
    const stats = await Review.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          moderationStatus: 'approved',
          isHidden: false
        }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$overall' },
          averageFood: { $avg: '$food' },
          averageService: { $avg: '$service' },
          averageDelivery: { $avg: '$delivery' },
          totalHelpfulVotes: { $sum: '$helpfulVotes' },
          reviewsWithImages: {
            $sum: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$images', []] } }, 0] },
                1,
                0
              ]
            }
          },
          verifiedReviews: {
            $sum: {
              $cond: ['$isVerified', 1, 0]
            }
          },
          ratingDistribution: {
            $push: '$overall'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 1] },
          averageFood: { $round: ['$averageFood', 1] },
          averageService: { $round: ['$averageService', 1] },
          averageDelivery: { $round: ['$averageDelivery', 1] },
          totalHelpfulVotes: 1,
          reviewsWithImages: 1,
          verifiedReviews: 1,
          ratingDistribution: {
            1: {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 1] }
                }
              }
            },
            2: {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 2] }
                }
              }
            },
            3: {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 3] }
                }
              }
            },
            4: {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 4] }
                }
              }
            },
            5: {
              $size: {
                $filter: {
                  input: '$ratingDistribution',
                  cond: { $eq: ['$$this', 5] }
                }
              }
            }
          }
        }
      }
    ]);

    // Transform reviews data to match frontend expectations
    const transformedReviews = reviews.map(review => ({
      _id: review._id,
      user: {
        name: review.isAnonymous ? 'Anonymous User' : review.user?.name,
        avatar: review.isAnonymous ? null : review.user?.avatar
      },
      overall: review.overall,
      food: review.food,
      service: review.service,
      delivery: review.delivery,
      comment: review.comment,
      images: review.images || [],
      helpfulVotes: review.helpfulVotes || 0,
      isVerified: review.isVerified,
      isAnonymous: review.isAnonymous,
      createdAt: review.createdAt,
      orderDetails: review.orderDetails ? {
        orderNumber: review.order?.orderNumber,
        items: review.orderDetails.items
      } : null,
      response: review.response ? {
        message: review.response.message,
        createdAt: review.response.createdAt
      } : null
    }));

    return NextResponse.json({
      success: true,
      reviews: transformedReviews,
      stats: stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        averageFood: 0,
        averageService: 0,
        averageDelivery: 0,
        totalHelpfulVotes: 0,
        reviewsWithImages: 0,
        verifiedReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalReviews,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Restaurant Reviews GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
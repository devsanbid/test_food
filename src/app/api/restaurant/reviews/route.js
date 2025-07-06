import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import Review from '@/models/Review';
import User from '@/models/User';
import Order from '@/models/Order';
import Notification from '@/models/Notification';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const { searchParams } = new URL(request.url);
    const rating = searchParams.get('rating');
    const hasResponse = searchParams.get('hasResponse');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeStats = searchParams.get('includeStats') === 'true';

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const filter = { restaurant: restaurant._id };

    if (rating) {
      filter.rating = parseInt(rating);
    }

    if (hasResponse !== null && hasResponse !== undefined) {
      if (hasResponse === 'true') {
        filter.restaurantResponse = { $exists: true, $ne: null };
      } else {
        filter.$or = [
          { restaurantResponse: { $exists: false } },
          { restaurantResponse: null }
        ];
      }
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [reviews, totalReviews] = await Promise.all([
      Review.find(filter)
        .populate('user', 'firstName lastName')
        .populate('order', 'orderNumber items')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter)
    ]);

    let stats = null;
    if (includeStats) {
      const [ratingStats, responseStats, recentTrends] = await Promise.all([
        Review.aggregate([
          { $match: { restaurant: restaurant._id } },
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        Review.aggregate([
          { $match: { restaurant: restaurant._id } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              withResponse: {
                $sum: {
                  $cond: [
                    { $and: [
                      { $ne: ['$restaurantResponse', null] },
                      { $ne: ['$restaurantResponse', undefined] }
                    ]},
                    1,
                    0
                  ]
                }
              },
              averageRating: { $avg: '$rating' },
              helpfulVotes: { $sum: '$helpfulVotes' }
            }
          }
        ]),
        Review.aggregate([
          { $match: { restaurant: restaurant._id } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 },
              averageRating: { $avg: '$rating' }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 6 }
        ])
      ]);

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingStats.forEach(stat => {
        ratingDistribution[stat._id] = stat.count;
      });

      stats = {
        total: responseStats[0]?.total || 0,
        averageRating: responseStats[0]?.averageRating || 0,
        responseRate: responseStats[0]?.total > 0 
          ? ((responseStats[0]?.withResponse || 0) / responseStats[0].total * 100).toFixed(1)
          : 0,
        helpfulVotes: responseStats[0]?.helpfulVotes || 0,
        ratingDistribution,
        monthlyTrends: recentTrends
      };
    }

    return NextResponse.json({
      success: true,
      reviews,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: page < Math.ceil(totalReviews / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Restaurant Reviews GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const body = await request.json();
    const { reviewId, action, ...updateData } = body;

    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: 'Review ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const review = await Review.findOne({ _id: reviewId, restaurant: restaurant._id })
      .populate('user', 'firstName lastName');
    
    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'respond':
        const { response } = updateData;
        if (!response || response.trim().length === 0) {
          return NextResponse.json(
            { success: false, message: 'Response text is required' },
            { status: 400 }
          );
        }

        if (response.length > 1000) {
          return NextResponse.json(
            { success: false, message: 'Response must be less than 1000 characters' },
            { status: 400 }
          );
        }

        review.restaurantResponse = {
          text: response.trim(),
          respondedAt: new Date(),
          respondedBy: user.id
        };
        review.updatedAt = new Date();
        await review.save();

        const notification = new Notification({
          user: review.user._id,
          title: 'Restaurant Response',
          message: `${restaurant.name} has responded to your review`,
          type: 'review_response',
          relatedReview: review._id,
          relatedRestaurant: restaurant._id
        });
        await notification.save();

        return NextResponse.json({
          success: true,
          message: 'Response added successfully',
          review
        });

      case 'update-response':
        const { newResponse } = updateData;
        if (!review.restaurantResponse) {
          return NextResponse.json(
            { success: false, message: 'No existing response to update' },
            { status: 400 }
          );
        }

        if (!newResponse || newResponse.trim().length === 0) {
          return NextResponse.json(
            { success: false, message: 'Response text is required' },
            { status: 400 }
          );
        }

        if (newResponse.length > 1000) {
          return NextResponse.json(
            { success: false, message: 'Response must be less than 1000 characters' },
            { status: 400 }
          );
        }

        review.restaurantResponse.text = newResponse.trim();
        review.restaurantResponse.updatedAt = new Date();
        review.updatedAt = new Date();
        await review.save();

        return NextResponse.json({
          success: true,
          message: 'Response updated successfully',
          review
        });

      case 'delete-response':
        if (!review.restaurantResponse) {
          return NextResponse.json(
            { success: false, message: 'No response to delete' },
            { status: 400 }
          );
        }

        review.restaurantResponse = null;
        review.updatedAt = new Date();
        await review.save();

        return NextResponse.json({
          success: true,
          message: 'Response deleted successfully',
          review
        });

      case 'flag-inappropriate':
        const { reason } = updateData;
        if (!reason) {
          return NextResponse.json(
            { success: false, message: 'Flag reason is required' },
            { status: 400 }
          );
        }

        review.flags = review.flags || [];
        review.flags.push({
          flaggedBy: user.id,
          reason,
          flaggedAt: new Date()
        });
        review.updatedAt = new Date();
        await review.save();

        return NextResponse.json({
          success: true,
          message: 'Review flagged successfully',
          review
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant Reviews PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const body = await request.json();
    const { action, ...data } = body;

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'bulk-respond':
        const { reviewIds, response } = data;
        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Review IDs array is required' },
            { status: 400 }
          );
        }

        if (!response || response.trim().length === 0) {
          return NextResponse.json(
            { success: false, message: 'Response text is required' },
            { status: 400 }
          );
        }

        const updateResult = await Review.updateMany(
          { 
            _id: { $in: reviewIds },
            restaurant: restaurant._id,
            $or: [
              { restaurantResponse: { $exists: false } },
              { restaurantResponse: null }
            ]
          },
          { 
            restaurantResponse: {
              text: response.trim(),
              respondedAt: new Date(),
              respondedBy: user.id
            },
            updatedAt: new Date()
          }
        );

        return NextResponse.json({
          success: true,
          message: `${updateResult.modifiedCount} reviews responded to successfully`,
          modifiedCount: updateResult.modifiedCount
        });

      case 'export-reviews':
        const { startDate, endDate, rating, format = 'json' } = data;
        const exportFilter = { restaurant: restaurant._id };
        
        if (startDate && endDate) {
          exportFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }

        if (rating) {
          exportFilter.rating = parseInt(rating);
        }

        const exportReviews = await Review.find(exportFilter)
          .populate('user', 'firstName lastName')
          .populate('order', 'orderNumber')
          .sort({ createdAt: -1 })
          .lean();

        return NextResponse.json({
          success: true,
          reviews: exportReviews,
          count: exportReviews.length,
          format
        });

      case 'generate-insights':
        const insights = await Review.aggregate([
          { $match: { restaurant: restaurant._id } },
          {
            $facet: {
              commonKeywords: [
                { $match: { comment: { $exists: true, $ne: '' } } },
                { $project: { words: { $split: [{ $toLower: '$comment' }, ' '] } } },
                { $unwind: '$words' },
                { $match: { words: { $regex: /^[a-zA-Z]{3,}$/ } } },
                { $group: { _id: '$words', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
              ],
              sentimentByRating: [
                {
                  $group: {
                    _id: '$rating',
                    avgLength: { $avg: { $strLenCP: '$comment' } },
                    count: { $sum: 1 }
                  }
                },
                { $sort: { _id: 1 } }
              ],
              monthlyTrends: [
                {
                  $group: {
                    _id: {
                      year: { $year: '$createdAt' },
                      month: { $month: '$createdAt' }
                    },
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                  }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 }
              ]
            }
          }
        ]);

        return NextResponse.json({
          success: true,
          insights: insights[0]
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant Reviews POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
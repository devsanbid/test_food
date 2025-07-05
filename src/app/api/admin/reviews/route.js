import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Review from '@/models/Review';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';
import Notification from '@/models/Notification';

// GET /api/admin/reviews - Get review details and moderation
export async function GET(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const action = searchParams.get('action') || 'details';

    switch (action) {
      case 'details':
        if (!reviewId) {
          return NextResponse.json(
            { success: false, message: 'Review ID is required' },
            { status: 400 }
          );
        }

        const review = await Review.findById(reviewId)
          .populate('user', 'firstName lastName email')
          .populate('restaurant', 'name')
          .populate('order', 'orderNumber totalAmount');

        if (!review) {
          return NextResponse.json(
            { success: false, message: 'Review not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          review
        });

      case 'flagged':
        const flaggedReviews = await Review.find({
          $or: [
            { 'flags.0': { $exists: true } },
            { 'moderation.status': 'flagged' }
          ]
        })
          .populate('user', 'firstName lastName')
          .populate('restaurant', 'name')
          .sort({ 'moderation.flaggedAt': -1 })
          .limit(100);

        return NextResponse.json({
          success: true,
          flaggedReviews
        });

      case 'pending-moderation':
        const pendingReviews = await Review.find({
          'moderation.status': 'pending'
        })
          .populate('user', 'firstName lastName')
          .populate('restaurant', 'name')
          .sort({ createdAt: -1 })
          .limit(50);

        return NextResponse.json({
          success: true,
          pendingReviews
        });

      case 'analytics':
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const dateFilter = {};
        
        if (startDate && endDate) {
          dateFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }

        const [ratingDistribution, moderationStats, topReviewedRestaurants] = await Promise.all([
          Review.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ]),
          Review.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: '$moderation.status',
                count: { $sum: 1 }
              }
            }
          ]),
          Review.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: '$restaurant',
                reviewCount: { $sum: 1 },
                avgRating: { $avg: '$rating' }
              }
            },
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
                restaurantName: '$restaurant.name',
                reviewCount: 1,
                avgRating: { $round: ['$avgRating', 2] }
              }
            },
            { $sort: { reviewCount: -1 } },
            { $limit: 10 }
          ])
        ]);

        return NextResponse.json({
          success: true,
          analytics: {
            ratingDistribution,
            moderationStats,
            topReviewedRestaurants
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin reviews GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/reviews - Moderate reviews
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { reviewId, action, ...actionData } = await request.json();

    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: 'Review ID is required' },
        { status: 400 }
      );
    }

    const review = await Review.findById(reviewId)
      .populate('user', 'firstName lastName email')
      .populate('restaurant', 'name owner');

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'approve':
        review.moderation = {
          status: 'approved',
          moderatedBy: 'admin',
          moderatedAt: new Date(),
          note: actionData.note || 'Approved by admin'
        };
        review.isVisible = true;
        
        await review.save();

        return NextResponse.json({
          success: true,
          message: 'Review approved successfully',
          review
        });

      case 'reject':
        const { reason } = actionData;
        
        if (!reason) {
          return NextResponse.json(
            { success: false, message: 'Rejection reason is required' },
            { status: 400 }
          );
        }

        review.moderation = {
          status: 'rejected',
          moderatedBy: 'admin',
          moderatedAt: new Date(),
          note: reason
        };
        review.isVisible = false;
        
        await review.save();

        // Notify user
        await Notification.create({
          user: review.user._id,
          type: 'review_rejected',
          title: 'Review Rejected',
          message: `Your review for ${review.restaurant.name} has been rejected. Reason: ${reason}`,
          data: { reviewId: review._id, restaurantName: review.restaurant.name }
        });

        return NextResponse.json({
          success: true,
          message: 'Review rejected successfully',
          review
        });

      case 'hide':
        review.isVisible = false;
        review.moderation = {
          ...review.moderation,
          status: 'hidden',
          moderatedBy: 'admin',
          moderatedAt: new Date(),
          note: actionData.note || 'Hidden by admin'
        };
        
        await review.save();

        return NextResponse.json({
          success: true,
          message: 'Review hidden successfully',
          review
        });

      case 'show':
        review.isVisible = true;
        review.moderation = {
          ...review.moderation,
          status: 'approved',
          moderatedBy: 'admin',
          moderatedAt: new Date(),
          note: actionData.note || 'Shown by admin'
        };
        
        await review.save();

        return NextResponse.json({
          success: true,
          message: 'Review made visible successfully',
          review
        });

      case 'flag':
        const { flagReason, severity = 'medium' } = actionData;
        
        if (!flagReason) {
          return NextResponse.json(
            { success: false, message: 'Flag reason is required' },
            { status: 400 }
          );
        }

        if (!review.flags) {
          review.flags = [];
        }
        
        review.flags.push({
          reason: flagReason,
          flaggedBy: 'admin',
          flaggedAt: new Date(),
          severity
        });
        
        review.moderation = {
          status: 'flagged',
          moderatedBy: 'admin',
          moderatedAt: new Date(),
          note: `Flagged: ${flagReason}`
        };
        
        await review.save();

        return NextResponse.json({
          success: true,
          message: 'Review flagged successfully',
          review
        });

      case 'unflag':
        review.flags = [];
        review.moderation = {
          status: 'approved',
          moderatedBy: 'admin',
          moderatedAt: new Date(),
          note: 'Unflagged by admin'
        };
        
        await review.save();

        return NextResponse.json({
          success: true,
          message: 'Review unflagged successfully',
          review
        });

      case 'edit-content':
        const { newComment, editReason } = actionData;
        
        if (!newComment || !editReason) {
          return NextResponse.json(
            { success: false, message: 'New comment and edit reason are required' },
            { status: 400 }
          );
        }

        // Store original comment
        if (!review.editHistory) {
          review.editHistory = [];
        }
        
        review.editHistory.push({
          originalComment: review.comment,
          editedAt: new Date(),
          editedBy: 'admin',
          reason: editReason
        });
        
        review.comment = newComment;
        review.isEdited = true;
        
        await review.save();

        // Notify user
        await Notification.create({
          user: review.user._id,
          type: 'review_edited',
          title: 'Review Edited',
          message: `Your review for ${review.restaurant.name} has been edited by admin. Reason: ${editReason}`,
          data: { reviewId: review._id, restaurantName: review.restaurant.name }
        });

        return NextResponse.json({
          success: true,
          message: 'Review content edited successfully',
          review
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin reviews PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews - Delete review
export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const reason = searchParams.get('reason');

    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: 'Review ID is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, message: 'Deletion reason is required' },
        { status: 400 }
      );
    }

    const review = await Review.findById(reviewId)
      .populate('user', 'firstName lastName email')
      .populate('restaurant', 'name');

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    // Store deletion info before deleting
    const deletionInfo = {
      reviewId: review._id,
      userId: review.user._id,
      restaurantName: review.restaurant.name,
      rating: review.rating,
      comment: review.comment,
      deletedBy: 'admin',
      deletedAt: new Date(),
      reason
    };

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Update restaurant rating
    const restaurant = await Restaurant.findById(review.restaurant._id);
    if (restaurant) {
      const reviews = await Review.find({ restaurant: restaurant._id, isVisible: true });
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        restaurant.rating = Math.round(avgRating * 10) / 10;
        restaurant.reviewCount = reviews.length;
      } else {
        restaurant.rating = 0;
        restaurant.reviewCount = 0;
      }
      await restaurant.save();
    }

    // Notify user
    await Notification.create({
      user: review.user._id,
      type: 'review_deleted',
      title: 'Review Deleted',
      message: `Your review for ${review.restaurant.name} has been deleted by admin. Reason: ${reason}`,
      data: { restaurantName: review.restaurant.name, reason }
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
      deletionInfo
    });
  } catch (error) {
    console.error('Admin reviews DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/reviews - Bulk operations
export async function POST(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { action, reviewIds, ...actionData } = await request.json();

    switch (action) {
      case 'bulk-moderate':
        const { moderationAction, reason } = actionData;
        
        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Review IDs are required' },
            { status: 400 }
          );
        }

        if (!['approve', 'reject', 'hide'].includes(moderationAction)) {
          return NextResponse.json(
            { success: false, message: 'Invalid moderation action' },
            { status: 400 }
          );
        }

        const reviews = await Review.find({ _id: { $in: reviewIds } })
          .populate('user', 'firstName lastName')
          .populate('restaurant', 'name');

        const results = [];
        for (const review of reviews) {
          try {
            review.moderation = {
              status: moderationAction === 'hide' ? 'hidden' : moderationAction,
              moderatedBy: 'admin',
              moderatedAt: new Date(),
              note: reason || `Bulk ${moderationAction} by admin`
            };
            
            review.isVisible = moderationAction !== 'reject' && moderationAction !== 'hide';
            
            await review.save();
            
            // Notify user for rejections
            if (moderationAction === 'reject') {
              await Notification.create({
                user: review.user._id,
                type: 'review_rejected',
                title: 'Review Rejected',
                message: `Your review for ${review.restaurant.name} has been rejected.`,
                data: { reviewId: review._id }
              });
            }
            
            results.push({ reviewId: review._id, success: true });
          } catch (error) {
            results.push({ reviewId: review._id, success: false, error: error.message });
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Bulk moderation completed',
          results
        });

      case 'export-reviews':
        const { startDate, endDate, rating, status, format = 'json' } = actionData;
        
        const exportFilter = {};
        if (startDate && endDate) {
          exportFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        if (rating) {
          exportFilter.rating = parseInt(rating);
        }
        if (status) {
          exportFilter['moderation.status'] = status;
        }

        const exportReviews = await Review.find(exportFilter)
          .populate('user', 'firstName lastName')
          .populate('restaurant', 'name')
          .select('rating comment createdAt moderation isVisible')
          .sort({ createdAt: -1 })
          .limit(1000);

        if (format === 'csv') {
          const csvHeaders = 'Rating,Comment,Customer,Restaurant,Created At,Status,Visible\n';
          const csvData = exportReviews.map(review => 
            `${review.rating},"${review.comment.replace(/"/g, '""')}","${review.user.firstName} ${review.user.lastName}","${review.restaurant.name}",${review.createdAt.toISOString()},${review.moderation?.status || 'pending'},${review.isVisible}`
          ).join('\n');
          
          return new NextResponse(csvHeaders + csvData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="reviews-export.csv"'
            }
          });
        }

        return NextResponse.json({
          success: true,
          reviews: exportReviews,
          count: exportReviews.length
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin reviews POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
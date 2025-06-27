import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import { getUserProfile, updateUserProfile } from '@/controllers/authController';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import Review from '@/models/Review';
import Notification from '@/models/Notification';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const role = searchParams.get('role');

    await connectDB();

    switch (action) {
      case 'users':
        const skip = (page - 1) * limit;
        const filter = role ? { role } : {};
        
        const users = await User.find(filter)
          .select('-password')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 });
        
        const totalUsers = await User.countDocuments(filter);
        
        return NextResponse.json({
          success: true,
          users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
            hasNext: page < Math.ceil(totalUsers / limit),
            hasPrev: page > 1
          }
        });

      case 'user-details':
        if (!userId) {
          return NextResponse.json(
            { success: false, message: 'User ID is required' },
            { status: 400 }
          );
        }
        
        const userDetails = await getUserProfile(userId);
        return NextResponse.json(userDetails);

      case 'stats':
        const [userStats, restaurantStats, orderStats, reviewStats] = await Promise.all([
          User.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: ['$isActive', 1, 0] } },
                verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
                admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
                restaurants: { $sum: { $cond: [{ $eq: ['$role', 'restaurant'] }, 1, 0] } },
                users: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } }
              }
            }
          ]),
          Restaurant.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: ['$isActive', 1, 0] } },
                verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
                avgRating: { $avg: '$rating' }
              }
            }
          ]),
          Order.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
              }
            }
          ]),
          Review.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgRating: { $avg: '$rating' },
                withResponse: { $sum: { $cond: [{ $ne: ['$restaurantResponse', null] }, 1, 0] } }
              }
            }
          ])
        ]);
        
        return NextResponse.json({
          success: true,
          stats: {
            users: userStats[0] || { total: 0, active: 0, verified: 0, admins: 0, restaurants: 0, users: 0 },
            restaurants: restaurantStats[0] || { total: 0, active: 0, verified: 0, avgRating: 0 },
            orders: orderStats[0] || { total: 0, totalRevenue: 0, delivered: 0, cancelled: 0, pending: 0 },
            reviews: reviewStats[0] || { total: 0, avgRating: 0, withResponse: 0 }
          }
        });

      case 'restaurants':
        const restaurantFilter = {};
        const isActive = searchParams.get('isActive');
        const isVerified = searchParams.get('isVerified');
        const cuisine = searchParams.get('cuisine');
        
        if (isActive !== null && isActive !== undefined) {
          restaurantFilter.isActive = isActive === 'true';
        }
        if (isVerified !== null && isVerified !== undefined) {
          restaurantFilter.isVerified = isVerified === 'true';
        }
        if (cuisine) {
          restaurantFilter.cuisine = { $in: [cuisine] };
        }

        const restaurantSkip = (page - 1) * limit;
        const [restaurants, totalRestaurants] = await Promise.all([
          Restaurant.find(restaurantFilter)
            .populate('owner', 'firstName lastName email')
            .skip(restaurantSkip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Restaurant.countDocuments(restaurantFilter)
        ]);
        
        return NextResponse.json({
          success: true,
          restaurants,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalRestaurants / limit),
            totalRestaurants,
            hasNext: page < Math.ceil(totalRestaurants / limit),
            hasPrev: page > 1
          }
        });

      case 'orders':
        const orderFilter = {};
        const orderStatus = searchParams.get('status');
        const restaurantId = searchParams.get('restaurantId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        if (orderStatus) {
          orderFilter.status = orderStatus;
        }
        if (restaurantId) {
          orderFilter.restaurant = restaurantId;
        }
        if (startDate && endDate) {
          orderFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }

        const orderSkip = (page - 1) * limit;
        const [orders, totalOrders] = await Promise.all([
          Order.find(orderFilter)
            .populate('user', 'firstName lastName email')
            .populate('restaurant', 'name')
            .skip(orderSkip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Order.countDocuments(orderFilter)
        ]);
        
        return NextResponse.json({
          success: true,
          orders,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalOrders,
            hasNext: page < Math.ceil(totalOrders / limit),
            hasPrev: page > 1
          }
        });

      case 'reviews':
        const reviewFilter = {};
        const reviewRating = searchParams.get('rating');
        const reviewRestaurantId = searchParams.get('restaurantId');
        const flagged = searchParams.get('flagged');
        
        if (reviewRating) {
          reviewFilter.rating = parseInt(reviewRating);
        }
        if (reviewRestaurantId) {
          reviewFilter.restaurant = reviewRestaurantId;
        }
        if (flagged === 'true') {
          reviewFilter.flags = { $exists: true, $ne: [] };
        }

        const reviewSkip = (page - 1) * limit;
        const [reviews, totalReviews] = await Promise.all([
          Review.find(reviewFilter)
            .populate('user', 'firstName lastName')
            .populate('restaurant', 'name')
            .skip(reviewSkip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Review.countDocuments(reviewFilter)
        ]);
        
        return NextResponse.json({
          success: true,
          reviews,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalReviews / limit),
            totalReviews,
            hasNext: page < Math.ceil(totalReviews / limit),
            hasPrev: page > 1
          }
        });

      case 'analytics':
        const analyticsStartDate = searchParams.get('startDate');
        const analyticsEndDate = searchParams.get('endDate');
        const dateFilter = {};
        
        if (analyticsStartDate && analyticsEndDate) {
          dateFilter.createdAt = {
            $gte: new Date(analyticsStartDate),
            $lte: new Date(analyticsEndDate)
          };
        }

        const [userGrowth, orderTrends, revenueTrends, topRestaurants] = await Promise.all([
          User.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ]),
          Order.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                orders: { $sum: 1 },
                revenue: { $sum: '$totalAmount' }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]),
          Order.aggregate([
            { $match: { ...dateFilter, status: 'delivered' } },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ]),
          Restaurant.aggregate([
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'restaurant',
                as: 'orders'
              }
            },
            {
              $project: {
                name: 1,
                totalOrders: { $size: '$orders' },
                totalRevenue: {
                  $sum: {
                    $map: {
                      input: { $filter: { input: '$orders', cond: { $eq: ['$$this.status', 'delivered'] } } },
                      as: 'order',
                      in: '$$order.totalAmount'
                    }
                  }
                },
                rating: 1
              }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 }
          ])
        ]);
        
        return NextResponse.json({
          success: true,
          analytics: {
            userGrowth,
            orderTrends,
            revenueTrends,
            topRestaurants
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message.includes('Access denied') ? 403 : 401 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const { action, userId, ...updateData } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    switch (action) {
      case 'update-user':
        const updatedUser = await updateUserProfile(userId, updateData);
        return NextResponse.json(updatedUser);

      case 'toggle-status':
        const targetUser = await User.findById(userId);
        if (!targetUser) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }

        targetUser.isActive = !targetUser.isActive;
        await targetUser.save();

        return NextResponse.json({
          success: true,
          message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully`,
          user: {
            id: targetUser._id,
            isActive: targetUser.isActive
          }
        });

      case 'change-role':
        const { newRole } = updateData;
        if (!['user', 'admin', 'restaurant'].includes(newRole)) {
          return NextResponse.json(
            { success: false, message: 'Invalid role' },
            { status: 400 }
          );
        }

        const roleUser = await User.findByIdAndUpdate(
          userId,
          { role: newRole },
          { new: true }
        ).select('-password');

        if (!roleUser) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'User role updated successfully',
          user: roleUser
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message.includes('Access denied') ? 403 : 401 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message.includes('Access denied') ? 403 : 401 }
    );
  }
}
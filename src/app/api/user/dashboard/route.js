import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import Review from '@/models/Review';
import Notification from '@/models/Notification';
import Cart from '@/models/Cart';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

// GET - Get user dashboard data
export async function GET(request) {

  try {

    const user = await authenticate(request);
    console.log("user", user)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(user.id);
    console.log("userId", userId)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get user profile with favorites count
    const userProfile = await User.findById(user.id)
      .select('firstName lastName email phone dateOfBirth address preferences favorites')
      .lean();

    // Get recent orders (last 5)
    const recentOrders = await Order.find({ customer: userId })
      .populate('restaurant', 'name logo cuisine')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get active order (if any)
    const activeOrder = await Order.findOne({
      customer: userId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'] }
    })
    .populate('restaurant', 'name logo phone')
    .lean();

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { customer: userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' },
          ordersThisMonth: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', thirtyDaysAgo] },
                1,
                0
              ]
            }
          },
          spentThisMonth: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', thirtyDaysAgo] },
                '$pricing.total',
                0
              ]
            }
          },
          ordersThisWeek: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', sevenDaysAgo] },
                1,
                0
              ]
            }
          },
          deliveredOrders: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                1,
                0
              ]
            }
          },
          cancelledOrders: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'cancelled'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get favorite restaurants with details
    const favoriteRestaurants = await Restaurant.find()
    .select('name logo cuisine rating priceRange deliveryTime deliveryFee')
    .limit(6)
    .lean();

    // Get recommended restaurants (based on user's order history and preferences)
    const userCuisinePreferences = await Order.aggregate([
      { $match: { customer: userId } },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurantData'
        }
      },
      { $unwind: '$restaurantData' },
      {
        $group: {
          _id: '$restaurantData.cuisine',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    const preferredCuisines = userCuisinePreferences.map(item => item._id);
    
    const recommendedRestaurants = await Restaurant.find()
    .select('name logo cuisine rating priceRange deliveryTime deliveryFee')
    .sort({ 'rating.average': -1 })
    .limit(6)
    .lean();

    // Get recent reviews
    const recentReviews = await Review.find({ user: userId })
      .populate('restaurant', 'name logo')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    // Get unread notifications count
    const unreadNotifications = await Notification.getUnreadCount(userId);

    // Get recent notifications
    const recentNotifications = await Notification.find({
      user: userId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    // Get current cart
    const currentCart = await Cart.findOne({
      user: userId,
      isActive: true
    })
    .populate('restaurant', 'name logo')
    .lean();

    // Get spending trends (last 6 months)
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const spendingTrends = await Order.aggregate([
      {
        $match: {
          customer: userId,
          createdAt: { $gte: sixMonthsAgo },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSpent: { $sum: '$pricing.total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          totalSpent: { $round: ['$totalSpent', 2] },
          orderCount: 1
        }
      }
    ]);

    // Get cuisine preferences distribution
    const cuisineStats = await Order.aggregate([
      { $match: { customer: userId } },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurantData'
        }
      },
      { $unwind: '$restaurantData' },
      {
        $group: {
          _id: '$restaurantData.cuisine',
          count: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          cuisine: '$_id',
          orderCount: '$count',
          totalSpent: { $round: ['$totalSpent', 2] }
        }
      }
    ]);

    // Get loyalty points (if implemented)
    const loyaltyPoints = {
      current: userProfile.loyaltyPoints || 0,
      earned: Math.floor((orderStats[0]?.totalSpent || 0) / 10), // 1 point per $10 spent
      redeemed: 0 // Placeholder
    };

    // Calculate user level based on orders
    const totalOrders = orderStats[0]?.totalOrders || 0;
    let userLevel = 'Bronze';
    if (totalOrders >= 50) userLevel = 'Platinum';
    else if (totalOrders >= 25) userLevel = 'Gold';
    else if (totalOrders >= 10) userLevel = 'Silver';

    // Get achievements
    const achievements = [];
    if (totalOrders >= 1) achievements.push({ name: 'First Order', icon: '🎉', description: 'Placed your first order' });
    if (totalOrders >= 10) achievements.push({ name: 'Regular Customer', icon: '⭐', description: 'Placed 10 orders' });
    if (totalOrders >= 25) achievements.push({ name: 'Food Explorer', icon: '🌟', description: 'Placed 25 orders' });
    if (totalOrders >= 50) achievements.push({ name: 'Foodie Legend', icon: '👑', description: 'Placed 50 orders' });
    if (recentReviews.length >= 5) achievements.push({ name: 'Reviewer', icon: '📝', description: 'Left 5 reviews' });
    if (favoriteRestaurants.length >= 5) achievements.push({ name: 'Taste Maker', icon: '❤️', description: 'Added 5 favorites' });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...userProfile,
          level: userLevel,
          loyaltyPoints
        },
        stats: {
          orders: orderStats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            avgOrderValue: 0,
            ordersThisMonth: 0,
            spentThisMonth: 0,
            ordersThisWeek: 0,
            deliveredOrders: 0,
            cancelledOrders: 0
          },
          favorites: favoriteRestaurants.length,
          reviews: recentReviews.length,
          unreadNotifications
        },
        recentOrders,
        activeOrder,
        favoriteRestaurants,
        recommendedRestaurants,
        recentReviews,
        recentNotifications,
        currentCart,
        spendingTrends,
        cuisineStats,
        achievements,
        quickActions: [
          {
            title: 'Reorder Favorite',
            description: 'Order from your favorite restaurant',
            icon: '🔄',
            action: 'reorder',
            enabled: favoriteRestaurants.length > 0
          },
          {
            title: 'Track Order',
            description: 'Track your active order',
            icon: '📍',
            action: 'track',
            enabled: !!activeOrder
          },
          {
            title: 'Browse Restaurants',
            description: 'Discover new restaurants',
            icon: '🍽️',
            action: 'browse',
            enabled: true
          },
          {
            title: 'View Cart',
            description: 'Complete your order',
            icon: '🛒',
            action: 'cart',
            enabled: !!currentCart && currentCart.items.length > 0
          }
        ]
      }
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

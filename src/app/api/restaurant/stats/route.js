import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import Review from '@/models/Review';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayOrders, weekOrders, monthOrders, totalOrders, pendingOrders, completedOrders, cancelledOrders, totalRevenue, avgRating, totalReviews] = await Promise.all([
      Order.countDocuments({ restaurant: restaurant._id, createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Order.countDocuments({ restaurant: restaurant._id, createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ restaurant: restaurant._id, createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ restaurant: restaurant._id }),
      Order.countDocuments({ restaurant: restaurant._id, status: 'pending' }),
      Order.countDocuments({ restaurant: restaurant._id, status: 'delivered' }),
      Order.countDocuments({ restaurant: restaurant._id, status: 'cancelled' }),
      Order.aggregate([
        { $match: { restaurant: restaurant._id, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Review.aggregate([
        { $match: { restaurant: restaurant._id } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Review.countDocuments({ restaurant: restaurant._id })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        orders: {
          today: todayOrders,
          week: weekOrders,
          month: monthOrders,
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          avgOrderValue: totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0
        },
        rating: {
          average: avgRating[0]?.avgRating || 0,
          totalReviews
        }
      }
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
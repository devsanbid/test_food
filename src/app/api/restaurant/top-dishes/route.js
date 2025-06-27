import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';

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

    const topDishes = await Order.aggregate([
      { $match: { restaurant: restaurant._id, status: 'delivered' } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.menuItem',
        name: { $first: '$items.name' },
        totalOrdered: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $sort: { totalOrdered: -1 } },
      { $limit: 5 }
    ]);

    return NextResponse.json({
      success: true,
      dishes: topDishes
    });
  } catch (error) {
    console.error('Top Dishes API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
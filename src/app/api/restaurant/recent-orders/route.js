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

    const recentOrders = await Order.find({ restaurant: restaurant._id })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber status totalAmount createdAt items');

    return NextResponse.json({
      success: true,
      orders: recentOrders
    });
  } catch (error) {
    console.error('Recent Orders API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
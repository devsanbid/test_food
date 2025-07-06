import { NextResponse } from 'next/server';
import Order from '@/models/Order';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import connectDB from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
  }

  try {
    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const orders = await Order.find({ user: id }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((acc, order) => acc + order.total, 0);

    const favoriteRestaurantsList = await Restaurant.find({ _id: { $in: user.favorites } });

    const stats = {
      totalOrders,
      favoriteRestaurants: favoriteRestaurantsList.length,
      totalSpent: totalSpent.toFixed(2),
      rewardPoints: user.rewardPoints || 0,
    };

    const recentOrders = orders.slice(0, 3).map(order => ({
      id: order._id,
      restaurant: order.restaurant.name,
      items: order.items.map(item => item.name).join(', '),
      total: order.total,
      status: order.status,
      date: order.createdAt.toISOString().split('T')[0],
      rating: order.rating,
    }));

    const favoriteRestaurants = favoriteRestaurantsList.slice(0, 3).map(restaurant => ({
      id: restaurant._id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating,
      deliveryTime: restaurant.deliveryTime,
      image: restaurant.image,
    }));

    return NextResponse.json({
      success: true,
      stats,
      recentOrders,
      favoriteRestaurants,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Errorsss' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import Review from '@/models/Review';
import User from '@/models/User';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'dashboard':
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

        const recentOrders = await Order.find({ restaurant: restaurant._id })
          .populate('user', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(5)
          .select('orderNumber status totalAmount createdAt items');

        const popularItems = await Order.aggregate([
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
          dashboard: {
            restaurant: {
              id: restaurant._id,
              name: restaurant.name,
              status: restaurant.isActive ? 'active' : 'inactive',
              rating: avgRating[0]?.avgRating || 0,
              totalReviews
            },
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
            },
            recentOrders,
            popularItems
          }
        });

      case 'analytics':
        const dateFilter = {};
        if (startDate && endDate) {
          dateFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }

        const orderTrends = await Order.aggregate([
          { $match: { restaurant: restaurant._id, ...dateFilter } },
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
        ]);

        const hourlyTrends = await Order.aggregate([
          { $match: { restaurant: restaurant._id, ...dateFilter } },
          {
            $group: {
              _id: { $hour: '$createdAt' },
              orders: { $sum: 1 },
              revenue: { $sum: '$totalAmount' }
            }
          },
          { $sort: { '_id': 1 } }
        ]);

        const customerAnalytics = await Order.aggregate([
          { $match: { restaurant: restaurant._id, ...dateFilter } },
          {
            $group: {
              _id: '$user',
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: '$totalAmount' },
              avgOrderValue: { $avg: '$totalAmount' }
            }
          },
          { $sort: { totalSpent: -1 } },
          { $limit: 10 }
        ]);

        return NextResponse.json({
          success: true,
          analytics: {
            orderTrends,
            hourlyTrends,
            topCustomers: customerAnalytics
          }
        });

      case 'profile':
        return NextResponse.json({
          success: true,
          restaurant
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message.includes('Access denied') ? 403 : 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const body = await request.json();
    const { action, ...updateData } = body;

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update-profile':
        const allowedFields = [
          'name', 'description', 'phone', 'email', 'address',
          'cuisine', 'priceRange', 'deliveryTime', 'minimumOrder',
          'deliveryFee', 'isDeliveryAvailable', 'isPickupAvailable',
          'openingHours', 'images', 'features', 'tags'
        ];

        const updateFields = {};
        allowedFields.forEach(field => {
          if (updateData[field] !== undefined) {
            updateFields[field] = updateData[field];
          }
        });

        if (Object.keys(updateFields).length === 0) {
          return NextResponse.json(
            { success: false, message: 'No valid fields to update' },
            { status: 400 }
          );
        }

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
          restaurant._id,
          updateFields,
          { new: true, runValidators: true }
        );

        return NextResponse.json({
          success: true,
          message: 'Restaurant profile updated successfully',
          restaurant: updatedRestaurant
        });

      case 'toggle-status':
        restaurant.isActive = !restaurant.isActive;
        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: `Restaurant ${restaurant.isActive ? 'activated' : 'deactivated'} successfully`,
          restaurant: {
            id: restaurant._id,
            isActive: restaurant.isActive
          }
        });

      case 'update-hours':
        const { openingHours } = updateData;
        if (!openingHours || typeof openingHours !== 'object') {
          return NextResponse.json(
            { success: false, message: 'Valid opening hours required' },
            { status: 400 }
          );
        }

        restaurant.openingHours = openingHours;
        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: 'Opening hours updated successfully',
          openingHours: restaurant.openingHours
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant PUT error:', error);
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

    switch (action) {
      case 'create-restaurant':
        const existingRestaurant = await Restaurant.findOne({ owner: user.id });
        if (existingRestaurant) {
          return NextResponse.json(
            { success: false, message: 'Restaurant already exists for this user' },
            { status: 400 }
          );
        }

        const requiredFields = ['name', 'description', 'phone', 'address', 'cuisine'];
        for (const field of requiredFields) {
          if (!data[field]) {
            return NextResponse.json(
              { success: false, message: `${field} is required` },
              { status: 400 }
            );
          }
        }

        const newRestaurant = new Restaurant({
          ...data,
          owner: user.id,
          isActive: false,
          isVerified: false
        });

        await newRestaurant.save();

        return NextResponse.json({
          success: true,
          message: 'Restaurant created successfully. Awaiting admin approval.',
          restaurant: newRestaurant
        }, { status: 201 });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
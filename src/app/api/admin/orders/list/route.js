import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const restaurantId = searchParams.get('restaurantId');

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (restaurantId) {
      query.restaurant = restaurantId;
    }

    const [orders, totalOrders, stats] = await Promise.all([
      Order.find(query)
        .populate('user', 'firstName lastName email phone')
        .populate('restaurant', 'name address phone email')
        .populate('deliveryPerson', 'firstName lastName phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      
      Order.countDocuments(query),
      
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
              }
            },
            cancelledOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
              }
            },
            averageOrderValue: { $avg: '$totalAmount' }
          }
        }
      ])
    ]);

    const restaurants = await Restaurant.find({}, 'name').lean();

    const totalPages = Math.ceil(totalOrders / limit);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        averageOrderValue: 0
      },
      restaurants
    });

  } catch (error) {
    console.error('Admin orders list error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { orderId, action, ...updateData } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email')
      .populate('restaurant', 'name');

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update-status':
        const { status, note } = updateData;
        
        if (!status) {
          return NextResponse.json(
            { success: false, message: 'Status is required' },
            { status: 400 }
          );
        }

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            { success: false, message: 'Invalid status' },
            { status: 400 }
          );
        }

        order.status = status;
        order.statusHistory.push({
          status,
          timestamp: new Date(),
          note: note || `Status updated by admin to ${status}`
        });

        if (status === 'delivered') {
          order.deliveredAt = new Date();
        }

        await order.save();

        return NextResponse.json({
          success: true,
          message: 'Order status updated successfully',
          order
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Admin orders update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
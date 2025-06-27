import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search');

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const filter = { restaurant: restaurant._id };

    if (status) {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'deliveryAddress.street': { $regex: search, $options: 'i' } },
        { 'deliveryAddress.city': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate('user', 'firstName lastName email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    const orderStats = await Order.aggregate([
      { $match: { restaurant: restaurant._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const stats = {
      total: totalOrders,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      outForDelivery: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    orderStats.forEach(stat => {
      stats[stat._id] = stat.count;
      if (stat._id === 'delivered') {
        stats.totalRevenue = stat.totalAmount;
      }
    });

    return NextResponse.json({
      success: true,
      orders,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page < Math.ceil(totalOrders / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Restaurant Orders GET error:', error);
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
    const { orderId, action, ...updateData } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
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

    const order = await Order.findOne({ _id: orderId, restaurant: restaurant._id })
      .populate('user', 'firstName lastName email phone');
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    let notificationMessage = '';
    let notificationType = 'order_update';

    switch (action) {
      case 'confirm':
        if (order.status !== 'pending') {
          return NextResponse.json(
            { success: false, message: 'Order cannot be confirmed' },
            { status: 400 }
          );
        }
        order.status = 'confirmed';
        order.confirmedAt = new Date();
        notificationMessage = `Your order #${order.orderNumber} has been confirmed by ${restaurant.name}`;
        break;

      case 'start-preparing':
        if (order.status !== 'confirmed') {
          return NextResponse.json(
            { success: false, message: 'Order must be confirmed first' },
            { status: 400 }
          );
        }
        order.status = 'preparing';
        order.preparingAt = new Date();
        notificationMessage = `Your order #${order.orderNumber} is now being prepared`;
        break;

      case 'ready':
        if (order.status !== 'preparing') {
          return NextResponse.json(
            { success: false, message: 'Order must be preparing first' },
            { status: 400 }
          );
        }
        order.status = 'ready';
        order.readyAt = new Date();
        notificationMessage = `Your order #${order.orderNumber} is ready for ${order.orderType}`;
        break;

      case 'out-for-delivery':
        if (order.status !== 'ready' || order.orderType !== 'delivery') {
          return NextResponse.json(
            { success: false, message: 'Order must be ready and delivery type' },
            { status: 400 }
          );
        }
        order.status = 'outForDelivery';
        order.outForDeliveryAt = new Date();
        if (updateData.deliveryPersonName) {
          order.deliveryPersonName = updateData.deliveryPersonName;
        }
        if (updateData.deliveryPersonPhone) {
          order.deliveryPersonPhone = updateData.deliveryPersonPhone;
        }
        notificationMessage = `Your order #${order.orderNumber} is out for delivery`;
        break;

      case 'deliver':
        if (!['ready', 'outForDelivery'].includes(order.status)) {
          return NextResponse.json(
            { success: false, message: 'Order must be ready or out for delivery' },
            { status: 400 }
          );
        }
        order.status = 'delivered';
        order.deliveredAt = new Date();
        notificationMessage = `Your order #${order.orderNumber} has been delivered. Enjoy your meal!`;
        break;

      case 'cancel':
        if (['delivered', 'cancelled'].includes(order.status)) {
          return NextResponse.json(
            { success: false, message: 'Order cannot be cancelled' },
            { status: 400 }
          );
        }
        const { reason } = updateData;
        if (!reason) {
          return NextResponse.json(
            { success: false, message: 'Cancellation reason is required' },
            { status: 400 }
          );
        }
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason;
        order.cancelledBy = 'restaurant';
        notificationMessage = `Your order #${order.orderNumber} has been cancelled. Reason: ${reason}`;
        notificationType = 'order_cancelled';
        break;

      case 'update-preparation-time':
        const { estimatedTime } = updateData;
        if (!estimatedTime || estimatedTime <= 0) {
          return NextResponse.json(
            { success: false, message: 'Valid estimated time is required' },
            { status: 400 }
          );
        }
        order.estimatedDeliveryTime = new Date(Date.now() + estimatedTime * 60000);
        notificationMessage = `Updated preparation time for order #${order.orderNumber}: ${estimatedTime} minutes`;
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    order.updatedAt = new Date();
    await order.save();

    if (notificationMessage) {
      const notification = new Notification({
        user: order.user._id,
        title: 'Order Update',
        message: notificationMessage,
        type: notificationType,
        relatedOrder: order._id,
        relatedRestaurant: restaurant._id
      });
      await notification.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('Restaurant Orders PUT error:', error);
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
    const { action, orderIds, ...data } = body;

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'bulk-update-status':
        const { status: newStatus } = data;
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Order IDs array is required' },
            { status: 400 }
          );
        }

        if (!['confirmed', 'preparing', 'ready', 'cancelled'].includes(newStatus)) {
          return NextResponse.json(
            { success: false, message: 'Invalid status' },
            { status: 400 }
          );
        }

        const updateResult = await Order.updateMany(
          { 
            _id: { $in: orderIds },
            restaurant: restaurant._id,
            status: { $nin: ['delivered', 'cancelled'] }
          },
          { 
            status: newStatus,
            updatedAt: new Date()
          }
        );

        return NextResponse.json({
          success: true,
          message: `${updateResult.modifiedCount} orders updated successfully`,
          modifiedCount: updateResult.modifiedCount
        });

      case 'export-orders':
        const { startDate, endDate, format = 'json' } = data;
        const exportFilter = { restaurant: restaurant._id };
        
        if (startDate && endDate) {
          exportFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }

        const exportOrders = await Order.find(exportFilter)
          .populate('user', 'firstName lastName email phone')
          .sort({ createdAt: -1 })
          .lean();

        return NextResponse.json({
          success: true,
          orders: exportOrders,
          count: exportOrders.length,
          format
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant Orders POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
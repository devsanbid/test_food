import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authenticate, adminOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';
import Notification from '@/models/Notification';

// GET /api/admin/orders - Get order details
export async function GET(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const action = searchParams.get('action') || 'details';

    switch (action) {
      case 'details':
        if (!orderId) {
          return NextResponse.json(
            { success: false, message: 'Order ID is required' },
            { status: 400 }
          );
        }

        const order = await Order.findById(orderId)
          .populate('user', 'firstName lastName email phone')
          .populate('restaurant', 'name address phone email')
          .populate('deliveryPerson', 'firstName lastName phone');

        if (!order) {
          return NextResponse.json(
            { success: false, message: 'Order not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          order
        });

      case 'timeline':
        if (!orderId) {
          return NextResponse.json(
            { success: false, message: 'Order ID is required' },
            { status: 400 }
          );
        }

        const orderWithTimeline = await Order.findById(orderId)
          .select('statusHistory orderNumber status createdAt')
          .populate('user', 'firstName lastName')
          .populate('restaurant', 'name');

        if (!orderWithTimeline) {
          return NextResponse.json(
            { success: false, message: 'Order not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          timeline: orderWithTimeline.statusHistory,
          order: {
            _id: orderWithTimeline._id,
            orderNumber: orderWithTimeline.orderNumber,
            status: orderWithTimeline.status,
            createdAt: orderWithTimeline.createdAt,
            user: orderWithTimeline.user,
            restaurant: orderWithTimeline.restaurant
          }
        });

      case 'disputes':
        const disputedOrders = await Order.find({
          'dispute.isDisputed': true,
          'dispute.status': { $in: ['open', 'investigating'] }
        })
          .populate('user', 'firstName lastName email')
          .populate('restaurant', 'name')
          .sort({ 'dispute.createdAt': -1 })
          .limit(50);

        return NextResponse.json({
          success: true,
          disputes: disputedOrders
        });

      case 'stats':
        const restaurantId = searchParams.get('restaurantId');
        if (!restaurantId) {
          return NextResponse.json(
            { success: false, message: 'Restaurant ID is required for stats' },
            { status: 400 }
          );
        }

        // Get order statistics for the restaurant
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const orderStats = await Order.aggregate([
          {
            $match: {
              restaurant: new mongoose.Types.ObjectId(restaurantId),
              createdAt: { $gte: thirtyDaysAgo },
              status: { $in: ['delivered', 'completed'] }
            }
          },
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
          {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
          },
          {
            $project: {
              _id: 0,
              period: {
                $concat: [
                  { $toString: '$_id.month' },
                  '/',
                  { $toString: '$_id.day' }
                ]
              },
              orders: 1,
              revenue: { $round: ['$revenue', 2] }
            }
          }
        ]);

        return NextResponse.json({
          success: true,
          stats: orderStats
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders - Update order
export async function PUT(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
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
      case 'force-cancel':
        const { reason, refundAmount } = updateData;
        
        if (!reason) {
          return NextResponse.json(
            { success: false, message: 'Cancellation reason is required' },
            { status: 400 }
          );
        }

        // Update order status
        order.status = 'cancelled';
        order.cancellation = {
          reason,
          cancelledBy: 'admin',
          cancelledAt: new Date(),
          refundAmount: refundAmount || order.totalAmount
        };

        // Add to status history
        order.statusHistory.push({
          status: 'cancelled',
          timestamp: new Date(),
          note: `Force cancelled by admin: ${reason}`
        });

        await order.save();

        // Notify user and restaurant
        await Promise.all([
          Notification.create({
            user: order.user._id,
            type: 'order_cancelled',
            title: 'Order Cancelled',
            message: `Your order #${order.orderNumber} has been cancelled by admin. Reason: ${reason}`,
            data: { orderId: order._id, orderNumber: order.orderNumber }
          }),
          Notification.create({
            user: order.restaurant.owner,
            type: 'order_cancelled',
            title: 'Order Cancelled',
            message: `Order #${order.orderNumber} has been cancelled by admin.`,
            data: { orderId: order._id, orderNumber: order.orderNumber }
          })
        ]);

        return NextResponse.json({
          success: true,
          message: 'Order cancelled successfully',
          order
        });

      case 'resolve-dispute':
        const { resolution, resolutionNote, refundToUser } = updateData;
        
        if (!order.dispute || !order.dispute.isDisputed) {
          return NextResponse.json(
            { success: false, message: 'No active dispute found for this order' },
            { status: 400 }
          );
        }

        if (!resolution || !['user_favor', 'restaurant_favor', 'partial_refund'].includes(resolution)) {
          return NextResponse.json(
            { success: false, message: 'Invalid resolution type' },
            { status: 400 }
          );
        }

        // Update dispute
        order.dispute.status = 'resolved';
        order.dispute.resolution = resolution;
        order.dispute.resolutionNote = resolutionNote;
        order.dispute.resolvedAt = new Date();
        order.dispute.resolvedBy = 'admin';
        
        if (refundToUser) {
          order.dispute.refundAmount = refundToUser;
        }

        await order.save();

        // Notify both parties
        await Promise.all([
          Notification.create({
            user: order.user._id,
            type: 'dispute_resolved',
            title: 'Dispute Resolved',
            message: `Your dispute for order #${order.orderNumber} has been resolved.`,
            data: { orderId: order._id, resolution }
          }),
          Notification.create({
            user: order.restaurant.owner,
            type: 'dispute_resolved',
            title: 'Dispute Resolved',
            message: `Dispute for order #${order.orderNumber} has been resolved.`,
            data: { orderId: order._id, resolution }
          })
        ]);

        return NextResponse.json({
          success: true,
          message: 'Dispute resolved successfully',
          order
        });

      case 'assign-delivery':
        const { deliveryPersonId } = updateData;
        
        if (!deliveryPersonId) {
          return NextResponse.json(
            { success: false, message: 'Delivery person ID is required' },
            { status: 400 }
          );
        }

        // Verify delivery person exists
        const deliveryPerson = await User.findById(deliveryPersonId);
        if (!deliveryPerson || deliveryPerson.role !== 'delivery') {
          return NextResponse.json(
            { success: false, message: 'Invalid delivery person' },
            { status: 400 }
          );
        }

        order.deliveryPerson = deliveryPersonId;
        order.statusHistory.push({
          status: order.status,
          timestamp: new Date(),
          note: `Delivery person assigned by admin: ${deliveryPerson.firstName} ${deliveryPerson.lastName}`
        });

        await order.save();

        return NextResponse.json({
          success: true,
          message: 'Delivery person assigned successfully',
          order
        });

      case 'update-status':
        const { newStatus, note } = updateData;
        
        const validStatuses = [
          'pending', 'confirmed', 'preparing', 'ready',
          'out_for_delivery', 'delivered', 'cancelled'
        ];
        
        if (!validStatuses.includes(newStatus)) {
          return NextResponse.json(
            { success: false, message: 'Invalid status' },
            { status: 400 }
          );
        }

        order.status = newStatus;
        order.statusHistory.push({
          status: newStatus,
          timestamp: new Date(),
          note: note || `Status updated by admin to ${newStatus}`
        });

        if (newStatus === 'delivered') {
          order.deliveredAt = new Date();
        }

        await order.save();

        // Notify user
        await Notification.create({
          user: order.user._id,
          type: 'order_status_updated',
          title: 'Order Status Updated',
          message: `Your order #${order.orderNumber} status has been updated to ${newStatus}.`,
          data: { orderId: order._id, status: newStatus }
        });

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
    console.error('Admin orders PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/orders - Bulk operations
export async function POST(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { action, orderIds, ...actionData } = await request.json();

    switch (action) {
      case 'bulk-cancel':
        const { reason } = actionData;
        
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Order IDs are required' },
            { status: 400 }
          );
        }

        if (!reason) {
          return NextResponse.json(
            { success: false, message: 'Cancellation reason is required' },
            { status: 400 }
          );
        }

        const orders = await Order.find({
          _id: { $in: orderIds },
          status: { $nin: ['delivered', 'cancelled'] }
        }).populate('user', 'firstName lastName');

        const results = [];
        for (const order of orders) {
          try {
            order.status = 'cancelled';
            order.cancellation = {
              reason,
              cancelledBy: 'admin',
              cancelledAt: new Date(),
              refundAmount: order.totalAmount
            };
            order.statusHistory.push({
              status: 'cancelled',
              timestamp: new Date(),
              note: `Bulk cancelled by admin: ${reason}`
            });
            
            await order.save();
            
            // Notify user
            await Notification.create({
              user: order.user._id,
              type: 'order_cancelled',
              title: 'Order Cancelled',
              message: `Your order #${order.orderNumber} has been cancelled. Reason: ${reason}`,
              data: { orderId: order._id }
            });
            
            results.push({ orderId: order._id, success: true });
          } catch (error) {
            results.push({ orderId: order._id, success: false, error: error.message });
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Bulk cancellation completed',
          results
        });

      case 'export-orders':
        const { startDate, endDate, status, format = 'json' } = actionData;
        
        const exportFilter = {};
        if (startDate && endDate) {
          exportFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        if (status) {
          exportFilter.status = status;
        }

        const exportOrders = await Order.find(exportFilter)
          .populate('user', 'firstName lastName email')
          .populate('restaurant', 'name')
          .select('orderNumber status totalAmount createdAt deliveredAt')
          .sort({ createdAt: -1 })
          .limit(1000);

        if (format === 'csv') {
          // Convert to CSV format
          const csvHeaders = 'Order Number,Status,Total Amount,Customer,Restaurant,Created At,Delivered At\n';
          const csvData = exportOrders.map(order => 
            `${order.orderNumber},${order.status},${order.totalAmount},"${order.user.firstName} ${order.user.lastName}","${order.restaurant.name}",${order.createdAt.toISOString()},${order.deliveredAt ? order.deliveredAt.toISOString() : ''}`
          ).join('\n');
          
          return new NextResponse(csvHeaders + csvData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="orders-export.csv"'
            }
          });
        }

        return NextResponse.json({
          success: true,
          orders: exportOrders,
          count: exportOrders.length
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin orders POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
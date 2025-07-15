import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import Order from '@/models/Order';
import Review from '@/models/Review';
import Notification from '@/models/Notification';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Get specific order details
export async function GET(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Find order and populate related data
    let order = await Order.findOne({
      _id: id,
      customer: user.id
    })
    .populate('restaurant', 'name logo cuisine address phone email website operatingHours menu');

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Initialize tracking for legacy orders if missing
    if (!order.tracking) {
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            tracking: {
              history: [{
                status: order.status,
                timestamp: order.createdAt || new Date(),
                description: `Order ${order.status}`,
                location: 'System'
              }],
              currentLocation: {}
            }
          }
        }
      );
      
      // Refetch the order to get updated tracking data with methods intact
      const updatedOrder = await Order.findById(order._id)
        .populate('restaurant', 'name logo cuisine address phone email website operatingHours menu');
      
      if (updatedOrder) {
        order = updatedOrder;
      }
    }

    // Manually populate menu item details from restaurant's menu
    let populatedItems = order.items;
    if (order.restaurant && order.restaurant.menu) {
      populatedItems = order.items.map(item => {
        const menuItem = order.restaurant.menu.find(menuItem => 
          menuItem._id.toString() === item.menuItem.toString()
        );
        return {
          ...item.toObject(),
          menuItem: menuItem || null
        };
      });
    }

    // Get order tracking history
    const trackingHistory = order.tracking?.history || [];

    // Check if order can be cancelled
    const canCancel = order.canCancel();

    // Check if order can be rated
    const canRate = order.canRate();

    // Get existing review if any
    let existingReview = null;
    if (order.status === 'delivered') {
      existingReview = await Review.findOne({
        user: user.id,
        order: order._id
      });
    }

    // Calculate estimated times
    const estimatedDeliveryTime = order.getEstimatedDeliveryTime();

    return NextResponse.json({
      success: true,
      data: {
        order: {
          ...order.toObject(),
          items: populatedItems
        },
        trackingHistory,
        canCancel,
        canRate,
        existingReview,
        estimatedDeliveryTime,
        orderAge: order.orderAge
      }
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update order (cancel, rate, etc.)
export async function PUT(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findOne({
      _id: id,
      customer: user.id
    }).populate('restaurant', 'name');

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'cancel':
        const { reason } = body;

        // Check if order can be cancelled
        if (!order.canCancel()) {
          return NextResponse.json(
            { success: false, message: 'Order cannot be cancelled at this stage' },
            { status: 400 }
          );
        }

        // Update order status
        order.status = 'cancelled';
        order.cancellation = {
          reason: reason || 'Customer request',
          cancelledBy: 'customer',
          cancelledAt: new Date(),
          refundStatus: 'pending',
          refundAmount: order.pricing.total
        };

        // Add tracking entry (initialize if missing)
        if (!order.tracking) {
          order.tracking = {
            history: [],
            currentLocation: {}
          };
        }
        order.tracking.history.push({
          status: 'cancelled',
          timestamp: new Date(),
          description: `Order cancelled by customer. Reason: ${reason || 'Customer request'}`,
          location: 'Customer App'
        });

        await order.save();

        // Create cancellation notification
        await Notification.createOrderNotification(
          user.id,
          'order-cancelled',
          {
            orderId: order._id,
            orderNumber: order.orderNumber,
            restaurantName: order.restaurant.name,
            cancellationReason: reason
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Order cancelled successfully',
          data: { order }
        });

      case 'rate':
        const { rating, comment, images } = body;

        // Check if order can be rated
        if (!order.canRate()) {
          return NextResponse.json(
            { success: false, message: 'Order cannot be rated at this time' },
            { status: 400 }
          );
        }

        // Validate rating
        if (!rating || !rating.overall || rating.overall < 1 || rating.overall > 5) {
          return NextResponse.json(
            { success: false, message: 'Valid overall rating (1-5) is required' },
            { status: 400 }
          );
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
          user: user.id,
          order: order._id
        });

        if (existingReview) {
          return NextResponse.json(
            { success: false, message: 'Order has already been rated' },
            { status: 400 }
          );
        }

        // Create review
        const review = await Review.create({
          user: user.id,
          restaurant: order.restaurant._id,
          order: order._id,
          rating: {
            food: rating.food || rating.overall,
            service: rating.service || rating.overall,
            delivery: rating.delivery || rating.overall,
            overall: rating.overall
          },
          comment: comment || '',
          images: images || [],
          isVerified: true, // Since it's from a delivered order
          orderType: order.orderType
        });

        // Update order with rating
        order.rating = {
          rating: rating.overall,
          review: review._id,
          ratedAt: new Date()
        };

        await order.save();

        return NextResponse.json({
          success: true,
          message: 'Rating submitted successfully',
          data: { review, order }
        });

      case 'reorder':
        // This would typically redirect to cart with the same items
        // For now, we'll just return the order items
        return NextResponse.json({
          success: true,
          message: 'Reorder data retrieved',
          data: {
            items: order.items,
            restaurant: order.restaurant,
            redirectUrl: `/user/restaurants/${order.restaurant._id}`
          }
        });

      case 'track':
        // Return current tracking information
        return NextResponse.json({
          success: true,
          data: {
            currentStatus: order.status,
            trackingHistory: order.tracking.history,
            estimatedDeliveryTime: order.getEstimatedDeliveryTime(),
            currentLocation: order.tracking.currentLocation
          }
        });

      case 'contact-restaurant':
        // Return restaurant contact information
        const restaurant = await order.populate('restaurant', 'name phone email');
        return NextResponse.json({
          success: true,
          data: {
            restaurant: {
              name: restaurant.restaurant.name,
              phone: restaurant.restaurant.phone,
              email: restaurant.restaurant.email
            },
            orderNumber: order.orderNumber
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Order update error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, message: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete order (only for cancelled orders)
export async function DELETE(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findOne({
      _id: id,
      customer: user.id
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of cancelled orders that are older than 30 days
    if (order.status !== 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'Only cancelled orders can be deleted' },
        { status: 400 }
      );
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (order.createdAt > thirtyDaysAgo) {
      return NextResponse.json(
        { success: false, message: 'Order can only be deleted after 30 days of cancellation' },
        { status: 400 }
      );
    }

    // Delete the order
    await Order.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Order deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
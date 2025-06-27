import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Restaurant from '@/models/Restaurant';
import Notification from '@/models/Notification';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Get user's orders with filtering and pagination
export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Build query
    let query = { customer: user.id };

    // Status filter
    if (status) {
      query.status = { $in: status.split(',') };
    }

    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    // Search filter (restaurant name or order number)
    if (search) {
      const restaurants = await Restaurant.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      const restaurantIds = restaurants.map(r => r._id);
      
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { restaurant: { $in: restaurantIds } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    let sort = {};
    if (sortBy === 'total') {
      sort['pricing.total'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const orders = await Order.find(query)
      .populate('restaurant', 'name logo cuisine priceRange')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Get order statistics
    const stats = await Order.aggregate([
      { $match: { customer: mongoose.Types.ObjectId(user.id) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' },
          statusCounts: {
            $push: '$status'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalSpent: 1,
          avgOrderValue: 1,
          statusCounts: {
            pending: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  cond: { $eq: ['$$this', 'pending'] }
                }
              }
            },
            confirmed: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  cond: { $eq: ['$$this', 'confirmed'] }
                }
              }
            },
            preparing: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  cond: { $eq: ['$$this', 'preparing'] }
                }
              }
            },
            ready: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  cond: { $eq: ['$$this', 'ready'] }
                }
              }
            },
            'out-for-delivery': {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  cond: { $eq: ['$$this', 'out-for-delivery'] }
                }
              }
            },
            delivered: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  cond: { $eq: ['$$this', 'delivered'] }
                }
              }
            },
            cancelled: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  cond: { $eq: ['$$this', 'cancelled'] }
                }
              }
            },
            refunded: {
              $size: {
                $filter: {
                  input: '$statusCounts',
                  cond: { $eq: ['$$this', 'refunded'] }
                }
              }
            }
          }
        }
      }
    ]);

    // Get favorite restaurants
    const favoriteRestaurants = await Order.aggregate([
      { $match: { customer: mongoose.Types.ObjectId(user.id) } },
      { $group: { _id: '$restaurant', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' },
      {
        $project: {
          _id: '$restaurant._id',
          name: '$restaurant.name',
          logo: '$restaurant.logo',
          cuisine: '$restaurant.cuisine',
          priceRange: '$restaurant.priceRange',
          orderCount: '$count'
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
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
          totalSpent: 0,
          avgOrderValue: 0,
          statusCounts: {
            pending: 0,
            confirmed: 0,
            preparing: 0,
            ready: 0,
            'out-for-delivery': 0,
            delivered: 0,
            cancelled: 0,
            refunded: 0
          }
        },
        favoriteRestaurants
      }
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new order
export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { 
      orderType, 
      deliveryAddress, 
      paymentMethod, 
      specialInstructions,
      tip = 0
    } = body;

    // Validate required fields
    if (!orderType || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Order type and payment method are required' },
        { status: 400 }
      );
    }

    // Validate order type
    if (!['delivery', 'pickup'].includes(orderType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order type' },
        { status: 400 }
      );
    }

    // Validate delivery address for delivery orders
    if (orderType === 'delivery' && (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode)) {
      return NextResponse.json(
        { success: false, message: 'Complete delivery address is required for delivery orders' },
        { status: 400 }
      );
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: user.id, isActive: true });
    if (!cart || !cart.items.length) {
      return NextResponse.json(
        { success: false, message: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Validate cart items availability
    const validation = await cart.validateAvailability();
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Some items in your cart are no longer available',
        data: { unavailableItems: validation.unavailableItems }
      }, { status: 400 });
    }

    // Check if cart meets minimum order requirement
    if (!cart.meetsMinimumOrder()) {
      return NextResponse.json({
        success: false,
        message: `Order does not meet the minimum order amount of $${cart.minimumOrderAmount.toFixed(2)}`
      }, { status: 400 });
    }

    // Get restaurant details
    const restaurant = await Restaurant.findById(cart.restaurant);
    if (!restaurant || !restaurant.isActive || !restaurant.isVerified) {
      return NextResponse.json({
        success: false,
        message: 'Restaurant is not available'
      }, { status: 400 });
    }

    // Calculate tax (assuming 8% tax rate)
    const taxRate = 0.08;
    const tax = cart.subtotal * taxRate;

    // Calculate service fee (assuming 5% service fee)
    const serviceFeeRate = 0.05;
    const serviceFee = cart.subtotal * serviceFeeRate;

    // Calculate total
    const total = cart.subtotal + tax + cart.deliveryFee + serviceFee + tip - cart.discount;

    // Prepare order items
    const orderItems = cart.items.map(item => ({
      menuItem: item.menuItem,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions,
      customizations: item.customizations
    }));

    // Calculate estimated delivery/pickup time
    const now = new Date();
    const prepTime = Math.max(...cart.items.map(item => item.preparationTime || 15));
    
    let estimatedDeliveryTime = null;
    let estimatedPickupTime = null;
    
    if (orderType === 'delivery') {
      // Delivery time = preparation time + delivery time
      const deliveryTimeMinutes = restaurant.deliveryTime.min;
      estimatedDeliveryTime = new Date(now.getTime() + (prepTime + deliveryTimeMinutes) * 60000);
    } else {
      // Pickup time = preparation time + buffer
      estimatedPickupTime = new Date(now.getTime() + (prepTime + 5) * 60000);
    }

    // Create order
    const order = await Order.create({
      customer: user.id,
      restaurant: cart.restaurant,
      items: orderItems,
      status: 'pending',
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      pricing: {
        subtotal: cart.subtotal,
        tax,
        deliveryFee: orderType === 'delivery' ? cart.deliveryFee : 0,
        serviceFee,
        discount: cart.discount,
        tip,
        total
      },
      payment: {
        method: paymentMethod,
        status: 'pending',
        amount: total,
        currency: 'USD'
      },
      estimatedDeliveryTime,
      estimatedPickupTime,
      preparationTime: {
        estimated: prepTime
      },
      specialInstructions: specialInstructions || '',
      couponCode: cart.couponCode
    });

    // Clear the cart after successful order creation
    await cart.clearCart();

    // Create order notification
    await Notification.createOrderNotification(
      user.id,
      order._id,
      'order-confirmed',
      {
        title: 'Order Placed Successfully!',
        message: `Your order #${order.orderNumber} has been placed and is awaiting confirmation.`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          restaurantName: restaurant.name
        },
        actionButton: {
          text: 'View Order',
          url: `/user/orders/${order._id}`,
          action: 'navigate'
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order,
        redirectUrl: `/user/orderconfirmation/${order._id}`
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    
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
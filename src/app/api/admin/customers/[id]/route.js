import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import Review from '@/models/Review';

export async function GET(request, { params }) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const customer = await User.findById(id).select('-password -resetPasswordToken -verificationToken');

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    const [orderStats, recentOrders, reviewStats] = await Promise.all([
      Order.aggregate([
        { $match: { userId: customer._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]),
      Order.find({ userId: customer._id })
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Review.aggregate([
        { $match: { userId: customer._id } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        }
      ])
    ]);

    const customerData = {
      ...customer.toObject(),
      stats: {
        orders: orderStats[0] || {
          totalOrders: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          completedOrders: 0,
          cancelledOrders: 0
        },
        reviews: reviewStats[0] || {
          totalReviews: 0,
          avgRating: 0
        }
      },
      recentOrders
    };

    return NextResponse.json({
      success: true,
      customer: customerData
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const customer = await User.findById(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      role,
      address,
      isActive,
      isVerified,
      password
    } = body;

    if (username && username !== customer.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: id } });
      if (existingUsername) {
        return NextResponse.json(
          { success: false, message: 'Username already exists' },
          { status: 400 }
        );
      }
    }

    if (email && email !== customer.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(username && { username }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(role && { role }),
      ...(address && { address }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(typeof isVerified === 'boolean' && { isVerified })
    };

    if (password) {
      updateData.password = password;
    }

    const updatedCustomer = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const customer = await User.findById(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    if (customer.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
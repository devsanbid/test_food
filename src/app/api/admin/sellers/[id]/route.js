import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import Review from '@/models/Review';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    const seller = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpire');
    
    if (!seller) {
      return NextResponse.json(
        { success: false, message: 'Seller not found' },
        { status: 404 }
      );
    }
    
    const orderStats = await Order.aggregate([
      { $match: { sellerId: seller._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    const reviewStats = await Review.aggregate([
      { $match: { sellerId: seller._id } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    
    const recentOrders = await Order.find({ sellerId: seller._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'firstName lastName email');
    
    const stats = {
      orders: orderStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
      reviews: reviewStats[0] || { totalReviews: 0, avgRating: 0 }
    };
    
    return NextResponse.json({
      success: true,
      seller,
      stats,
      recentOrders
    });
    
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch seller' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      address,
      role,
      isActive,
      isVerified
    } = body;
    
    const seller = await User.findById(id);
    
    if (!seller) {
      return NextResponse.json(
        { success: false, message: 'Seller not found' },
        { status: 404 }
      );
    }
    
    if (username && username !== seller.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: id } });
      if (existingUsername) {
        return NextResponse.json(
          { success: false, message: 'Username already exists' },
          { status: 400 }
        );
      }
    }
    
    if (email && email !== seller.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 400 }
        );
      }
    }
    
    const updateData = {
      firstName,
      lastName,
      username,
      email,
      phone,
      role,
      isActive,
      isVerified
    };
    
    if (address) {
      updateData.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || ''
      };
    }
    
    const updatedSeller = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');
    
    return NextResponse.json({
      success: true,
      message: 'Seller updated successfully',
      seller: updatedSeller
    });
    
  } catch (error) {
    console.error('Error updating seller:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update seller' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    const seller = await User.findById(id);
    
    if (!seller) {
      return NextResponse.json(
        { success: false, message: 'Seller not found' },
        { status: 404 }
      );
    }
    
    if (seller.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete admin user' },
        { status: 400 }
      );
    }
    
    await User.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Seller deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting seller:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete seller' },
      { status: 500 }
    );
  }
}
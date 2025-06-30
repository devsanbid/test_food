import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    await connectDB();

    const skip = (page - 1) * limit;
    let filter = {};

    if (role && role !== '') {
      filter.role = role;
    }

    if (status) {
      if (status === 'active') {
        filter.isActive = true;
        filter.isVerified = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      } else if (status === 'unverified') {
        filter.isVerified = false;
      }
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await User.find(filter)
      .select('-password -resetPasswordToken -verificationToken')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCustomers = await User.countDocuments(filter);

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCustomers / limit),
        totalCustomers,
        hasNext: page < Math.ceil(totalCustomers / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const body = await request.json();
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      phone,
      role = 'user',
      address,
      isActive = true,
      isVerified = false
    } = body;

    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: existingUser.email === email ? 'Email already exists' : 'Username already exists'
        },
        { status: 400 }
      );
    }

    const newCustomer = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      phone,
      role,
      address,
      isActive,
      isVerified
    });

    await newCustomer.save();

    const customerResponse = await User.findById(newCustomer._id).select('-password');

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      customer: customerResponse
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const body = await request.json();
    const { customerIds } = body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer IDs are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await User.deleteMany({
      _id: { $in: customerIds },
      role: { $ne: 'admin' }
    });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} customers deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting customers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete customers' },
      { status: 500 }
    );
  }
}
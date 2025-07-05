import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

const validRoles = ['user', 'restaurant', 'admin', 'super_admin'];

// GET /api/admin/users - Get all users with filtering and pagination
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    let query = {};
    
    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    
    // Get paginated users
    const users = await User.find(query)
      .select('-password -resetPasswordToken -verificationToken')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // Get stats
    const [totalCount, activeCount, verifiedCount, roleStats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isVerified: true }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);
    
    const roleDistribution = roleStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, { user: 0, restaurant: 0, admin: 0, super_admin: 0 });
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPrevPage: page > 1
      },
      stats: {
        totalUsers: totalCount,
        activeUsers: activeCount,
        verifiedUsers: verifiedCount,
        roleDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request) {
  try {
    await connectDB();
    
    const userData = await request.json();
    
    // Validate required fields
    const { firstName, lastName, username, email, password, role, phone } = userData;
    
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: firstName, lastName, username, email, password' 
        },
        { status: 400 }
      );
    }
    
    // Validate role
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid role. Valid roles are: ' + validRoles.join(', ') 
        },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User with this email or username already exists' 
        },
        { status: 409 }
      );
    }
    
    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      phone,
      role: role || 'user',
      isActive: true,
      isVerified: false
    });
    
    await newUser.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.resetPasswordToken;
    delete userResponse.verificationToken;
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'User with this email or username already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
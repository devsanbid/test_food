import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'restaurant';
    
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Seller query:', query);
    
    // Fix any misspelled 'resturant' roles to 'restaurant'
    await User.updateMany(
      { role: 'resturant' },
      { $set: { role: 'restaurant' } }
    );
    
    // Debug: Check all users and their roles
    const allUsers = await User.find({}).select('role firstName lastName');
    console.log('All users in database:', allUsers.map(u => ({ role: u.role, name: `${u.firstName} ${u.lastName}` })));
    
    const sellers = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalSellers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalSellers / limit);
    
    console.log('Found sellers:', sellers.length);
    console.log('Total sellers:', totalSellers);
    
    return NextResponse.json({
      success: true,
      sellers,
      pagination: {
        currentPage: page,
        totalPages,
        totalSellers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sellers' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      address,
      role = 'restaurant',
      isActive = true,
      isVerified = false
    } = body;
    
    if (!firstName || !lastName || !username || !email) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email or username already exists' },
        { status: 400 }
      );
    }
    
    const defaultPassword = 'seller123';
    
    const newSeller = new User({
      firstName,
      lastName,
      username,
      email,
      password: defaultPassword,
      phone,
      address: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || '',
        country: address?.country || ''
      },
      role,
      isActive,
      isVerified
    });
    
    await newSeller.save();
    
    const sellerResponse = newSeller.toObject();
    delete sellerResponse.password;
    delete sellerResponse.resetPasswordToken;
    delete sellerResponse.resetPasswordExpire;
    
    return NextResponse.json({
      success: true,
      message: 'Seller created successfully',
      seller: sellerResponse
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating seller:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create seller' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { sellerIds } = body;
    
    if (!sellerIds || !Array.isArray(sellerIds) || sellerIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Seller IDs are required' },
        { status: 400 }
      );
    }
    
    const adminUsers = await User.find({
      _id: { $in: sellerIds },
      role: 'admin'
    });
    
    if (adminUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete admin users' },
        { status: 400 }
      );
    }
    
    const result = await User.deleteMany({
      _id: { $in: sellerIds }
    });
    
    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} sellers deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting sellers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete sellers' },
      { status: 500 }
    );
  }
}
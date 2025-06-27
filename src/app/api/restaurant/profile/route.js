import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import { verifyToken } from '@/middleware/auth';

export async function GET(request) {
  try {
    await connectDB();
    
    const user = await verifyToken(request);
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restaurant = await Restaurant.findOne({ userId: user.id });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        description: restaurant.description,
        cuisine: restaurant.cuisine,
        openingHours: restaurant.openingHours,
        rating: restaurant.rating || 0,
        totalReviews: restaurant.totalReviews || 0,
        isActive: restaurant.isActive,
        createdAt: restaurant.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const user = await verifyToken(request);
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address, description, cuisine, openingHours } = body;

    const restaurant = await Restaurant.findOneAndUpdate(
      { userId: user.id },
      {
        name,
        phone,
        address,
        description,
        cuisine,
        openingHours
      },
      { new: true }
    );

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      restaurant
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
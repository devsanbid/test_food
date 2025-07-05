import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import { authenticate, adminOnly } from '@/middleware/auth';

export async function GET(request, { params }) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { id } = params;
    
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurant
    });

  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { id } = params;
    const updateData = await request.json();
    
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Restaurant updated successfully',
      restaurant: updatedRestaurant
    });

  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { id } = params;
    
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    await Restaurant.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getCurrentUser } from '@/actions/authActions';
import Restaurant from '@/models/Restaurant';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    const restaurants = await Restaurant.find({});
    let foundDish = null;
    let foundRestaurant = null;

    for (const restaurant of restaurants) {
      if (restaurant.menu && restaurant.menu.length > 0) {
        const dish = restaurant.menu.find(d => d._id.toString() === id);
        if (dish) {
          foundDish = dish;
          foundRestaurant = restaurant;
          break;
        }
      }
    }

    if (!foundDish) {
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dish: {
        ...foundDish.toObject(),
        restaurantId: foundRestaurant._id,
        restaurantName: foundRestaurant.name
      }
    });
  } catch (error) {
    console.error('Error fetching dish:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const updateData = await request.json();
    
    const restaurants = await Restaurant.find({});
    let foundRestaurant = null;
    let dishIndex = -1;

    for (const restaurant of restaurants) {
      if (restaurant.menu && restaurant.menu.length > 0) {
        dishIndex = restaurant.menu.findIndex(d => d._id.toString() === id);
        if (dishIndex !== -1) {
          foundRestaurant = restaurant;
          break;
        }
      }
    }

    if (!foundRestaurant || dishIndex === -1) {
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    const updatedDish = {
      ...foundRestaurant.menu[dishIndex].toObject(),
      ...updateData
    };

    foundRestaurant.menu[dishIndex] = updatedDish;
    await foundRestaurant.save();

    return NextResponse.json({
      success: true,
      dish: updatedDish,
      message: 'Dish updated successfully'
    });
  } catch (error) {
    console.error('Error updating dish:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    const restaurants = await Restaurant.find({});
    let foundRestaurant = null;
    let dishIndex = -1;

    for (const restaurant of restaurants) {
      if (restaurant.menu && restaurant.menu.length > 0) {
        dishIndex = restaurant.menu.findIndex(d => d._id.toString() === id);
        if (dishIndex !== -1) {
          foundRestaurant = restaurant;
          break;
        }
      }
    }

    if (!foundRestaurant || dishIndex === -1) {
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    foundRestaurant.menu.splice(dishIndex, 1);
    await foundRestaurant.save();

    return NextResponse.json({
      success: true,
      message: 'Dish deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dish:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
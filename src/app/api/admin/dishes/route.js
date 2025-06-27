import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getCurrentUser } from '@/actions/authActions';
import Restaurant from '@/models/Restaurant';

export async function GET(request) {
  try {
    await connectDB();
    
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const restaurants = await Restaurant.find({});
    
    const allDishes = [];
    restaurants.forEach(restaurant => {
      if (restaurant.menu && restaurant.menu.length > 0) {
        restaurant.menu.forEach(dish => {
          allDishes.push({
            ...dish.toObject(),
            restaurantId: restaurant._id,
            restaurantName: restaurant.name
          });
        });
      }
    });

    return NextResponse.json({
      success: true,
      dishes: allDishes
    });
  } catch (error) {
    console.error('Error fetching dishes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dishData = await request.json();
    const { restaurantId, ...dishInfo } = dishData;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (!restaurant.menu) {
      restaurant.menu = [];
    }

    const newDish = {
      ...dishInfo
    };

    restaurant.menu.push(newDish);
    await restaurant.save();

    return NextResponse.json({
      success: true,
      dish: newDish,
      message: 'Dish created successfully'
    });
  } catch (error) {
    console.error('Error creating dish:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
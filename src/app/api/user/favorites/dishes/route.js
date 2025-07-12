import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

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
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'addedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const userDoc = await User.findById(user.id).select('favoriteDishes');
    
    if (!userDoc || !userDoc.favoriteDishes || !userDoc.favoriteDishes.length) {
      return NextResponse.json({
        success: true,
        data: {
          dishes: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalDishes: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          stats: {
            totalFavorites: 0,
            categoryDistribution: [],
            restaurantDistribution: []
          }
        }
      });
    }

    let favoriteDishes = [...userDoc.favoriteDishes];

    if (search) {
      favoriteDishes = favoriteDishes.filter(dish => 
        dish.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category && category !== 'all') {
      const restaurantIds = favoriteDishes.map(dish => dish.restaurantId);
      const restaurants = await Restaurant.find({
        _id: { $in: restaurantIds },
        'menu.category': category
      }).select('menu');
      
      const validMenuItemIds = new Set();
      restaurants.forEach(restaurant => {
        restaurant.menu.forEach(item => {
          if (item.category === category) {
            validMenuItemIds.add(item._id.toString());
          }
        });
      });
      
      favoriteDishes = favoriteDishes.filter(dish => 
        validMenuItemIds.has(dish.menuItemId.toString())
      );
    }

    const totalDishes = favoriteDishes.length;
    const totalPages = Math.ceil(totalDishes / limit);
    const skip = (page - 1) * limit;

    if (sortBy === 'addedAt') {
      favoriteDishes.sort((a, b) => {
        const dateA = new Date(a.addedAt);
        const dateB = new Date(b.addedAt);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (sortBy === 'name') {
      favoriteDishes.sort((a, b) => {
        return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      });
    } else if (sortBy === 'price') {
      favoriteDishes.sort((a, b) => {
        return sortOrder === 'desc' ? b.price - a.price : a.price - b.price;
      });
    }

    const paginatedDishes = favoriteDishes.slice(skip, skip + limit);

    const restaurantIds = [...new Set(paginatedDishes.map(dish => dish.restaurantId.toString()))];
    const restaurants = await Restaurant.find({
      _id: { $in: restaurantIds }
    }).select('name logo cuisine rating deliveryTime isActive');

    const restaurantMap = {};
    restaurants.forEach(restaurant => {
      restaurantMap[restaurant._id.toString()] = restaurant;
    });

    const enrichedDishes = paginatedDishes.map(dish => {
      const restaurant = restaurantMap[dish.restaurantId.toString()];
      return {
        ...dish.toObject(),
        restaurant: restaurant ? {
          _id: restaurant._id,
          name: restaurant.name,
          logo: restaurant.logo,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating,
          deliveryTime: restaurant.deliveryTime,
          isActive: restaurant.isActive
        } : null
      };
    });

    const categoryDistribution = {};
    const restaurantDistribution = {};
    
    for (const dish of favoriteDishes) {
      const restaurant = restaurantMap[dish.restaurantId.toString()];
      if (restaurant) {
        const restaurantName = restaurant.name;
        restaurantDistribution[restaurantName] = (restaurantDistribution[restaurantName] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        dishes: enrichedDishes,
        pagination: {
          currentPage: page,
          totalPages,
          totalDishes,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats: {
          totalFavorites: totalDishes,
          categoryDistribution: Object.entries(categoryDistribution).map(([category, count]) => ({ category, count })),
          restaurantDistribution: Object.entries(restaurantDistribution).map(([restaurant, count]) => ({ restaurant, count }))
        }
      }
    });
  } catch (error) {
    console.error('Get favorite dishes error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { restaurantId, menuItemId, name, price, image } = body;

    if (!restaurantId || !menuItemId || !name || !price) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID, menu item ID, name, and price are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return NextResponse.json(
        { success: false, message: 'Valid restaurant ID and menu item ID are required' },
        { status: 400 }
      );
    }

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      isActive: true,
      'menu._id': menuItemId
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant or menu item not found' },
        { status: 404 }
      );
    }

    const userDoc = await User.findById(user.id);
    
    if (!userDoc.favoriteDishes) {
      userDoc.favoriteDishes = [];
    }

    const existingDish = userDoc.favoriteDishes.find(
      dish => dish.restaurantId.toString() === restaurantId && dish.menuItemId.toString() === menuItemId
    );

    if (existingDish) {
      return NextResponse.json(
        { success: false, message: 'Dish is already in favorites' },
        { status: 400 }
      );
    }

    userDoc.favoriteDishes.push({
      restaurantId,
      menuItemId,
      name,
      price,
      image: image || '',
      addedAt: new Date()
    });

    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Dish added to favorites',
      data: {
        dish: {
          restaurantId,
          menuItemId,
          name,
          price,
          image: image || ''
        },
        totalFavorites: userDoc.favoriteDishes.length
      }
    });
  } catch (error) {
    console.error('Add dish to favorites error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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
    const restaurantId = searchParams.get('restaurantId');
    const menuItemId = searchParams.get('menuItemId');
    const removeAll = searchParams.get('removeAll') === 'true';

    const userDoc = await User.findById(user.id);
    
    if (!userDoc.favoriteDishes) {
      return NextResponse.json(
        { success: false, message: 'No favorite dishes found' },
        { status: 400 }
      );
    }

    if (removeAll) {
      const removedCount = userDoc.favoriteDishes.length;
      userDoc.favoriteDishes = [];
      await userDoc.save();

      return NextResponse.json({
        success: true,
        message: `${removedCount} dishes removed from favorites`,
        data: { removedCount, totalFavorites: 0 }
      });
    }

    if (!restaurantId || !menuItemId) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID and menu item ID are required' },
        { status: 400 }
      );
    }

    const dishIndex = userDoc.favoriteDishes.findIndex(
      dish => dish.restaurantId.toString() === restaurantId && dish.menuItemId.toString() === menuItemId
    );

    if (dishIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Dish is not in favorites' },
        { status: 400 }
      );
    }

    userDoc.favoriteDishes.splice(dishIndex, 1);
    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Dish removed from favorites',
      data: {
        restaurantId,
        menuItemId,
        totalFavorites: userDoc.favoriteDishes.length
      }
    });
  } catch (error) {
    console.error('Remove dish from favorites error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import mongoose from 'mongoose';

// GET /api/admin/menu - Get menu items from all restaurants or specific restaurant
export async function GET(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const category = searchParams.get('category');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    await connectDB();

    let query = {};
    if (restaurantId) {
      query._id = restaurantId;
    }

    const restaurants = await Restaurant.find(query)
      .select('name menu owner')
      .populate('owner', 'firstName lastName email');

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({
        success: true,
        menuItems: [],
        restaurants: [],
        stats: {
          totalItems: 0,
          availableItems: 0,
          categories: 0,
          totalRestaurants: 0
        },
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    // Flatten all menu items with restaurant info
    let allMenuItems = [];
    const allCategories = new Set();

    restaurants.forEach(restaurant => {
      if (restaurant.menu && restaurant.menu.length > 0) {
        restaurant.menu.forEach(item => {
          allCategories.add(item.category);
          allMenuItems.push({
            ...item.toObject(),
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            restaurantOwner: restaurant.owner
          });
        });
      }
    });

    // Apply filters
    if (category) {
      allMenuItems = allMenuItems.filter(item => item.category === category);
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      const availableFilter = isAvailable === 'true';
      allMenuItems = allMenuItems.filter(item => item.isAvailable === availableFilter);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      allMenuItems = allMenuItems.filter(item => 
        searchRegex.test(item.name) || 
        searchRegex.test(item.description) ||
        searchRegex.test(item.restaurantName) ||
        (item.ingredients && item.ingredients.some(ing => searchRegex.test(ing)))
      );
    }

    // Pagination
    const totalItems = allMenuItems.length;
    const skip = (page - 1) * limit;
    const paginatedItems = allMenuItems.slice(skip, skip + limit);

    // Statistics
    const stats = {
      totalItems: allMenuItems.length,
      availableItems: allMenuItems.filter(item => item.isAvailable).length,
      categories: allCategories.size,
      totalRestaurants: restaurants.length
    };

    return NextResponse.json({
      success: true,
      menuItems: paginatedItems,
      restaurants: restaurants.map(r => ({
        _id: r._id,
        name: r.name,
        owner: r.owner
      })),
      categories: Array.from(allCategories),
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        hasNext: page < Math.ceil(totalItems / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin menu GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/menu - Add menu item to specific restaurant
export async function POST(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const body = await request.json();
    const { 
      restaurantId, 
      name, 
      description, 
      price, 
      category, 
      image,
      ingredients, 
      allergens, 
      nutritionalInfo, 
      preparationTime, 
      isVegetarian, 
      isVegan, 
      spiceLevel
    } = body;

    if (!restaurantId || !name || !description || !price || !category) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID, name, description, price, and category are required' },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { success: false, message: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const newMenuItem = {
      name,
      description,
      price: parseFloat(price),
      category,
      image: image || '/images/default-food.jpg',
      ingredients: ingredients || [],
      allergens: allergens || [],
      nutritionalInfo: nutritionalInfo || {},
      preparationTime: preparationTime || 15,
      isVegetarian: isVegetarian || false,
      isVegan: isVegan || false,
      spiceLevel: spiceLevel || 'mild',
      isAvailable: true
    };

    if (!restaurant.menu) {
      restaurant.menu = [];
    }

    restaurant.menu.push(newMenuItem);
    await restaurant.save();

    // Get the newly added item with its generated ID
    const addedItem = restaurant.menu[restaurant.menu.length - 1];

    return NextResponse.json({
      success: true,
      message: 'Menu item added successfully',
      menuItem: {
        ...addedItem.toObject(),
        restaurantId: restaurant._id,
        restaurantName: restaurant.name
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Admin menu POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/menu - Update menu item
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const body = await request.json();
    const { restaurantId, itemId, action, ...updateData } = body;

    if (!restaurantId || !itemId) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID and Item ID are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const menuItemIndex = restaurant.menu?.findIndex(item => item._id.toString() === itemId);
    if (menuItemIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update':
        const allowedFields = [
          'name', 'description', 'price', 'category', 'image',
          'ingredients', 'allergens', 'nutritionalInfo', 'preparationTime',
          'isVegetarian', 'isVegan', 'spiceLevel'
        ];

        const updateFields = {};
        allowedFields.forEach(field => {
          if (updateData[field] !== undefined) {
            updateFields[field] = updateData[field];
          }
        });

        if (updateFields.price && updateFields.price <= 0) {
          return NextResponse.json(
            { success: false, message: 'Price must be greater than 0' },
            { status: 400 }
          );
        }

        Object.assign(restaurant.menu[menuItemIndex], updateFields);
        break;

      case 'toggle-availability':
        restaurant.menu[menuItemIndex].isAvailable = !restaurant.menu[menuItemIndex].isAvailable;
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    await restaurant.save();

    return NextResponse.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem: {
        ...restaurant.menu[menuItemIndex].toObject(),
        restaurantId: restaurant._id,
        restaurantName: restaurant.name
      }
    });
  } catch (error) {
    console.error('Admin menu PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/menu - Delete menu item
export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const itemId = searchParams.get('itemId');

    if (!restaurantId || !itemId) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID and Item ID are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const menuItemIndex = restaurant.menu?.findIndex(item => item._id.toString() === itemId);
    if (menuItemIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found' },
        { status: 404 }
      );
    }

    restaurant.menu.splice(menuItemIndex, 1);
    await restaurant.save();

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Admin menu DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
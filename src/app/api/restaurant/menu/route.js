import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    let menuItems = restaurant.menu || [];

    if (category) {
      menuItems = menuItems.filter(item => item.category === category);
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      const availableFilter = isAvailable === 'true';
      menuItems = menuItems.filter(item => item.isAvailable === availableFilter);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      menuItems = menuItems.filter(item => 
        searchRegex.test(item.name) || 
        searchRegex.test(item.description) ||
        (item.tags && item.tags.some(tag => searchRegex.test(tag)))
      );
    }

    const totalItems = menuItems.length;
    const skip = (page - 1) * limit;
    const paginatedItems = menuItems.slice(skip, skip + limit);

    const categories = [...new Set(restaurant.menu?.map(item => item.category) || [])];

    const stats = {
      totalItems: restaurant.menu?.length || 0,
      availableItems: restaurant.menu?.filter(item => item.isAvailable).length || 0,
      categories: categories.length,
      outOfStock: restaurant.menu?.filter(item => !item.isAvailable).length || 0
    };

    return NextResponse.json({
      success: true,
      menuItems: paginatedItems,
      categories,
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
    console.error('Menu GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const body = await request.json();
    const { name, description, price, category, images, ingredients, allergens, nutritionInfo, preparationTime, isVegetarian, isVegan, isGlutenFree, tags, customizations } = body;

    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { success: false, message: 'Name, description, price, and category are required' },
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

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const newMenuItem = {
      id: new Date().getTime().toString(),
      name,
      description,
      price: parseFloat(price),
      category,
      images: images || [],
      ingredients: ingredients || [],
      allergens: allergens || [],
      nutritionInfo: nutritionInfo || {},
      preparationTime: preparationTime || 15,
      isVegetarian: isVegetarian || false,
      isVegan: isVegan || false,
      isGlutenFree: isGlutenFree || false,
      isAvailable: true,
      tags: tags || [],
      customizations: customizations || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!restaurant.menu) {
      restaurant.menu = [];
    }

    restaurant.menu.push(newMenuItem);
    await restaurant.save();

    return NextResponse.json({
      success: true,
      message: 'Menu item added successfully',
      menuItem: newMenuItem
    }, { status: 201 });
  } catch (error) {
    console.error('Menu POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const body = await request.json();
    const { itemId, action, ...updateData } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'Item ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const menuItemIndex = restaurant.menu?.findIndex(item => item.id === itemId);
    if (menuItemIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update':
        const allowedFields = [
          'name', 'description', 'price', 'category', 'images',
          'ingredients', 'allergens', 'nutritionInfo', 'preparationTime',
          'isVegetarian', 'isVegan', 'isGlutenFree', 'tags', 'customizations'
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

        Object.assign(restaurant.menu[menuItemIndex], updateFields, {
          updatedAt: new Date()
        });
        break;

      case 'toggle-availability':
        restaurant.menu[menuItemIndex].isAvailable = !restaurant.menu[menuItemIndex].isAvailable;
        restaurant.menu[menuItemIndex].updatedAt = new Date();
        break;

      case 'update-category':
        const { newCategory } = updateData;
        if (!newCategory) {
          return NextResponse.json(
            { success: false, message: 'New category is required' },
            { status: 400 }
          );
        }
        restaurant.menu[menuItemIndex].category = newCategory;
        restaurant.menu[menuItemIndex].updatedAt = new Date();
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
      menuItem: restaurant.menu[menuItemIndex]
    });
  } catch (error) {
    console.error('Menu PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'Item ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const menuItemIndex = restaurant.menu?.findIndex(item => item.id === itemId);
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
    console.error('Menu DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
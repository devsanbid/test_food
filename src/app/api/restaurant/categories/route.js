import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const categories = restaurant.categories || [];
    const menuItems = restaurant.menu || [];
    
    const categoriesWithCount = categories.map(category => {
      const count = menuItems.filter(item => item.category === category.id).length;
      return {
        ...category,
        count
      };
    });

    return NextResponse.json({
      success: true,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error('Categories GET error:', error);
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
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
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

    if (!restaurant.categories) {
      restaurant.categories = [];
    }

    const existingCategory = restaurant.categories.find(cat => 
      cat.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category already exists' },
        { status: 400 }
      );
    }

    const newCategory = {
      id: new Date().getTime().toString(),
      name,
      description: description || '',
      color: color || '#f97316',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    restaurant.categories.push(newCategory);
    await restaurant.save();

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: newCategory
    }, { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
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
    const { categoryId, name, description, color } = body;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
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

    const categoryIndex = restaurant.categories?.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    const existingCategory = restaurant.categories.find(cat => 
      cat.name.toLowerCase() === name.toLowerCase() && cat.id !== categoryId
    );
    
    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category name already exists' },
        { status: 400 }
      );
    }

    restaurant.categories[categoryIndex] = {
      ...restaurant.categories[categoryIndex],
      name,
      description: description || restaurant.categories[categoryIndex].description,
      color: color || restaurant.categories[categoryIndex].color,
      updatedAt: new Date()
    };

    await restaurant.save();

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category: restaurant.categories[categoryIndex]
    });
  } catch (error) {
    console.error('Categories PUT error:', error);
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
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
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

    const categoryIndex = restaurant.categories?.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    const menuItemsInCategory = restaurant.menu?.filter(item => item.category === categoryId) || [];
    if (menuItemsInCategory.length > 0) {
      return NextResponse.json(
        { success: false, message: `Cannot delete category. ${menuItemsInCategory.length} menu items are using this category.` },
        { status: 400 }
      );
    }

    restaurant.categories.splice(categoryIndex, 1);
    await restaurant.save();

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import Favorite from '@/models/Favorite';
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
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'addedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let query = { userId: user.id, isActive: true };
    
    if (type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { 'dishDetails.name': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const totalFavorites = await Favorite.countDocuments(query);
    const totalPages = Math.ceil(totalFavorites / limit);
    const skip = (page - 1) * limit;

    const favorites = await Favorite.find(query)
      .populate('restaurantId', 'name logo cuisine rating deliveryTime isActive address')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const enrichedFavorites = favorites.map(favorite => ({
      _id: favorite._id,
      type: favorite.type,
      addedAt: favorite.addedAt,
      restaurant: favorite.restaurantId,
      dish: favorite.type === 'dish' ? {
        _id: favorite.menuItemId,
        name: favorite.dishDetails.name,
        price: favorite.dishDetails.price,
        image: favorite.dishDetails.image,
        category: favorite.dishDetails.category
      } : null
    }));

    const stats = {
      totalFavorites,
      restaurantCount: await Favorite.countDocuments({ userId: user.id, type: 'restaurant', isActive: true }),
      dishCount: await Favorite.countDocuments({ userId: user.id, type: 'dish', isActive: true })
    };

    return NextResponse.json({
      success: true,
      data: {
        favorites: enrichedFavorites,
        pagination: {
          currentPage: page,
          totalPages,
          totalFavorites,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
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
    const { restaurantId, menuItemId, type, dishDetails } = body;

    if (!restaurantId || !type) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID and type are required' },
        { status: 400 }
      );
    }

    if (type === 'dish' && (!menuItemId || !dishDetails)) {
      return NextResponse.json(
        { success: false, message: 'Menu item ID and dish details are required for dish favorites' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, message: 'Valid restaurant ID is required' },
        { status: 400 }
      );
    }

    if (type === 'dish' && !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return NextResponse.json(
        { success: false, message: 'Valid menu item ID is required' },
        { status: 400 }
      );
    }

    const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (type === 'dish') {
      const menuItem = restaurant.menu.find(item => item._id.toString() === menuItemId);
      if (!menuItem) {
        return NextResponse.json(
          { success: false, message: 'Menu item not found' },
          { status: 404 }
        );
      }
    }

    const existingActiveFavorite = await Favorite.findOne({
      userId: user.id,
      restaurantId,
      menuItemId: type === 'dish' ? menuItemId : null,
      type,
      isActive: true
    });

    if (existingActiveFavorite) {
      return NextResponse.json(
        { success: false, message: `${type === 'dish' ? 'Dish' : 'Restaurant'} is already in favorites` },
        { status: 400 }
      );
    }

    const existingInactiveFavorite = await Favorite.findOne({
      userId: user.id,
      restaurantId,
      menuItemId: type === 'dish' ? menuItemId : null,
      type,
      isActive: false
    });

    let newFavorite;
    if (existingInactiveFavorite) {
      existingInactiveFavorite.isActive = true;
      existingInactiveFavorite.addedAt = new Date();
      if (type === 'dish' && dishDetails) {
        existingInactiveFavorite.dishDetails = dishDetails;
      }
      await existingInactiveFavorite.save();
      newFavorite = existingInactiveFavorite;
    } else {
      const favoriteData = {
        userId: user.id,
        restaurantId,
        type,
        menuItemId: type === 'dish' ? menuItemId : null,
        dishDetails: type === 'dish' ? dishDetails : null
      };
      newFavorite = new Favorite(favoriteData);
      await newFavorite.save();
    }

    return NextResponse.json({
      success: true,
      message: `${type === 'dish' ? 'Dish' : 'Restaurant'} added to favorites`,
      data: {
        favorite: newFavorite,
        totalFavorites: await Favorite.countDocuments({ userId: user.id, isActive: true })
      }
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Item is already in favorites' },
        { status: 400 }
      );
    }
    
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
    const type = searchParams.get('type');
    const removeAll = searchParams.get('removeAll') === 'true';

    if (removeAll) {
      const result = await Favorite.updateMany(
        { userId: user.id, isActive: true },
        { isActive: false }
      );

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} favorites removed`,
        data: { removedCount: result.modifiedCount, totalFavorites: 0 }
      });
    }

    if (!restaurantId || !type) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID and type are required' },
        { status: 400 }
      );
    }

    const query = {
      userId: user.id,
      restaurantId,
      type,
      isActive: true
    };

    if (type === 'dish') {
      if (!menuItemId || menuItemId === 'undefined' || menuItemId === 'null') {
        return NextResponse.json(
          { success: false, message: 'Menu item ID is required for dish favorites' },
          { status: 400 }
        );
      }
      query.menuItemId = menuItemId;
    }

    const favorite = await Favorite.findOne(query);
    if (!favorite) {
      return NextResponse.json(
        { success: false, message: `${type === 'dish' ? 'Dish' : 'Restaurant'} is not in favorites` },
        { status: 400 }
      );
    }

    favorite.isActive = false;
    await favorite.save();

    const totalFavorites = await Favorite.countDocuments({ userId: user.id, isActive: true });

    return NextResponse.json({
      success: true,
      message: `${type === 'dish' ? 'Dish' : 'Restaurant'} removed from favorites`,
      data: {
        restaurantId,
        menuItemId,
        totalFavorites
      }
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
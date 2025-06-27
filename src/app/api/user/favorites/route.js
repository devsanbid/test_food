import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Get user's favorite restaurants
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
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const cuisine = searchParams.get('cuisine') || '';
    const priceRange = searchParams.get('priceRange') || '';
    const rating = parseFloat(searchParams.get('rating')) || 0;
    const search = searchParams.get('search') || '';
    const latitude = parseFloat(searchParams.get('latitude'));
    const longitude = parseFloat(searchParams.get('longitude'));
    const maxDistance = parseFloat(searchParams.get('maxDistance')) || 10; // km

    // Get user with favorites
    const userWithFavorites = await User.findById(user.id).select('favorites');
    
    if (!userWithFavorites || !userWithFavorites.favorites.length) {
      return NextResponse.json({
        success: true,
        data: {
          restaurants: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalRestaurants: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          stats: {
            totalFavorites: 0,
            cuisineDistribution: [],
            priceRangeDistribution: []
          }
        }
      });
    }

    // Build query for favorite restaurants
    let query = {
      _id: { $in: userWithFavorites.favorites },
      isActive: true,
      isVerified: true
    };

    // Cuisine filter
    if (cuisine) {
      query.cuisine = { $in: cuisine.split(',') };
    }

    // Price range filter
    if (priceRange) {
      query.priceRange = { $in: priceRange.split(',') };
    }

    // Rating filter
    if (rating > 0) {
      query['rating.average'] = { $gte: rating };
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } },
        { 'address.area': { $regex: search, $options: 'i' } }
      ];
    }

    // Location-based filtering
    if (latitude && longitude) {
      query['address.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    let sort = {};
    if (sortBy === 'distance' && latitude && longitude) {
      // Distance sorting is handled by $near in the query
      sort = {};
    } else if (sortBy === 'rating') {
      sort['rating.average'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'deliveryTime') {
      sort['deliveryTime.min'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'deliveryFee') {
      sort.deliveryFee = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const restaurants = await Restaurant.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-menu'); // Exclude menu for performance

    // Calculate distance if user location is provided
    if (latitude && longitude) {
      restaurants.forEach(restaurant => {
        if (restaurant.address.coordinates) {
          const distance = restaurant.calculateDistance(latitude, longitude);
          restaurant._doc.distance = distance;
        }
      });
    }

    // Check operating status
    restaurants.forEach(restaurant => {
      restaurant._doc.isOpen = restaurant.isOpen();
    });

    // Get total count for pagination
    const totalRestaurants = await Restaurant.countDocuments(query);
    const totalPages = Math.ceil(totalRestaurants / limit);

    // Get statistics
    const stats = await Restaurant.aggregate([
      { $match: { _id: { $in: userWithFavorites.favorites }, isActive: true, isVerified: true } },
      {
        $group: {
          _id: null,
          totalFavorites: { $sum: 1 },
          cuisines: { $push: '$cuisine' },
          priceRanges: { $push: '$priceRange' },
          avgRating: { $avg: '$rating.average' },
          avgDeliveryTime: { $avg: '$deliveryTime.min' },
          avgDeliveryFee: { $avg: '$deliveryFee' }
        }
      },
      {
        $project: {
          _id: 0,
          totalFavorites: 1,
          avgRating: { $round: ['$avgRating', 1] },
          avgDeliveryTime: { $round: ['$avgDeliveryTime', 0] },
          avgDeliveryFee: { $round: ['$avgDeliveryFee', 2] },
          cuisineDistribution: {
            $map: {
              input: { $setUnion: ['$cuisines', []] },
              as: 'cuisine',
              in: {
                cuisine: '$$cuisine',
                count: {
                  $size: {
                    $filter: {
                      input: '$cuisines',
                      cond: { $eq: ['$$this', '$$cuisine'] }
                    }
                  }
                }
              }
            }
          },
          priceRangeDistribution: {
            $map: {
              input: { $setUnion: ['$priceRanges', []] },
              as: 'priceRange',
              in: {
                priceRange: '$$priceRange',
                count: {
                  $size: {
                    $filter: {
                      input: '$priceRanges',
                      cond: { $eq: ['$$this', '$$priceRange'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        restaurants,
        pagination: {
          currentPage: page,
          totalPages,
          totalRestaurants,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats: stats[0] || {
          totalFavorites: 0,
          avgRating: 0,
          avgDeliveryTime: 0,
          avgDeliveryFee: 0,
          cuisineDistribution: [],
          priceRangeDistribution: []
        }
      }
    });
  } catch (error) {
    console.error('Favorites fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add restaurant to favorites
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
    const { restaurantId } = body;

    // Validate restaurant ID
    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, message: 'Valid restaurant ID is required' },
        { status: 400 }
      );
    }

    // Check if restaurant exists and is active
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      isActive: true,
      isVerified: true
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found or not available' },
        { status: 404 }
      );
    }

    // Get user and check if restaurant is already in favorites
    const userDoc = await User.findById(user.id);
    const isAlreadyFavorite = userDoc.favorites.includes(restaurantId);

    if (isAlreadyFavorite) {
      return NextResponse.json(
        { success: false, message: 'Restaurant is already in favorites' },
        { status: 400 }
      );
    }

    // Add to favorites
    userDoc.favorites.push(restaurantId);
    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Restaurant added to favorites',
      data: {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          logo: restaurant.logo,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating
        },
        totalFavorites: userDoc.favorites.length
      }
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove restaurant from favorites
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
    const removeAll = searchParams.get('removeAll') === 'true';

    if (removeAll) {
      // Remove all favorites
      const userDoc = await User.findById(user.id);
      const removedCount = userDoc.favorites.length;
      userDoc.favorites = [];
      await userDoc.save();

      return NextResponse.json({
        success: true,
        message: `${removedCount} restaurants removed from favorites`,
        data: { removedCount, totalFavorites: 0 }
      });
    }

    // Validate restaurant ID
    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, message: 'Valid restaurant ID is required' },
        { status: 400 }
      );
    }

    // Get user and check if restaurant is in favorites
    const userDoc = await User.findById(user.id);
    const favoriteIndex = userDoc.favorites.indexOf(restaurantId);

    if (favoriteIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Restaurant is not in favorites' },
        { status: 400 }
      );
    }

    // Remove from favorites
    userDoc.favorites.splice(favoriteIndex, 1);
    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Restaurant removed from favorites',
      data: {
        restaurantId,
        totalFavorites: userDoc.favorites.length
      }
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
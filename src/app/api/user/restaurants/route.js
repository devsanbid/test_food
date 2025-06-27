import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import Restaurant from '@/models/Restaurant';
import { connectDB } from '@/lib/mongodb';

// GET - Get restaurants with filtering, sorting, and search
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
    const search = searchParams.get('search') || '';
    const cuisine = searchParams.get('cuisine') || '';
    const priceRange = searchParams.get('priceRange') || '';
    const rating = searchParams.get('rating') || '';
    const sortBy = searchParams.get('sortBy') || 'rating';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const latitude = parseFloat(searchParams.get('latitude'));
    const longitude = parseFloat(searchParams.get('longitude'));
    const maxDistance = parseFloat(searchParams.get('maxDistance')) || 10; // km
    const isOpen = searchParams.get('isOpen') === 'true';
    const features = searchParams.get('features') ? searchParams.get('features').split(',') : [];

    // Build query
    let query = { isActive: true, isVerified: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Cuisine filter
    if (cuisine) {
      query.cuisine = { $in: cuisine.split(',') };
    }

    // Price range filter
    if (priceRange) {
      query.priceRange = { $in: priceRange.split(',') };
    }

    // Rating filter
    if (rating) {
      const minRating = parseFloat(rating);
      query['rating.average'] = { $gte: minRating };
    }

    // Features filter
    if (features.length > 0) {
      query.features = { $in: features };
    }

    // Location-based query
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

    // Build aggregation pipeline
    let pipeline = [
      { $match: query }
    ];

    // Add distance calculation if location provided
    if (latitude && longitude) {
      pipeline.push({
        $addFields: {
          distance: {
            $divide: [
              {
                $sqrt: {
                  $add: [
                    {
                      $pow: [
                        {
                          $multiply: [
                            { $subtract: ['$address.coordinates.latitude', latitude] },
                            111.32 // km per degree latitude
                          ]
                        },
                        2
                      ]
                    },
                    {
                      $pow: [
                        {
                          $multiply: [
                            {
                              $multiply: [
                                { $subtract: ['$address.coordinates.longitude', longitude] },
                                { $cos: { $multiply: [latitude, Math.PI / 180] } }
                              ]
                            },
                            111.32
                          ]
                        },
                        2
                      ]
                    }
                  ]
                }
              },
              1
            ]
          }
        }
      });
    }

    // Filter by operating hours if isOpen is requested
    if (isOpen) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().substring(0, 5);
      
      pipeline.push({
        $addFields: {
          isCurrentlyOpen: {
            $and: [
              { $ne: [`$operatingHours.${currentDay}.isClosed`, true] },
              { $lte: [`$operatingHours.${currentDay}.open`, currentTime] },
              { $gte: [`$operatingHours.${currentDay}.close`, currentTime] }
            ]
          }
        }
      });
      
      pipeline.push({
        $match: { isCurrentlyOpen: true }
      });
    }

    // Sorting
    let sortStage = {};
    switch (sortBy) {
      case 'rating':
        sortStage['rating.average'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'distance':
        if (latitude && longitude) {
          sortStage.distance = 1; // Always ascending for distance
        } else {
          sortStage['rating.average'] = -1; // Fallback to rating
        }
        break;
      case 'deliveryTime':
        sortStage['deliveryTime.min'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'deliveryFee':
        sortStage.deliveryFee = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'name':
        sortStage.name = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'newest':
        sortStage.createdAt = -1;
        break;
      default:
        sortStage['rating.average'] = -1;
    }

    pipeline.push({ $sort: sortStage });

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Project only necessary fields
    pipeline.push({
      $project: {
        name: 1,
        description: 1,
        cuisine: 1,
        'address.street': 1,
        'address.city': 1,
        'address.state': 1,
        'address.coordinates': 1,
        logo: 1,
        images: { $slice: ['$images', 3] }, // Only first 3 images
        'rating.average': 1,
        'rating.count': 1,
        priceRange: 1,
        deliveryFee: 1,
        minimumOrder: 1,
        'deliveryTime.min': 1,
        'deliveryTime.max': 1,
        features: 1,
        tags: 1,
        distance: 1,
        isCurrentlyOpen: 1,
        operatingHours: 1
      }
    });

    // Execute aggregation
    const restaurants = await Restaurant.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [
      { $match: query }
    ];
    
    if (isOpen) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().substring(0, 5);
      
      countPipeline.push({
        $addFields: {
          isCurrentlyOpen: {
            $and: [
              { $ne: [`$operatingHours.${currentDay}.isClosed`, true] },
              { $lte: [`$operatingHours.${currentDay}.open`, currentTime] },
              { $gte: [`$operatingHours.${currentDay}.close`, currentTime] }
            ]
          }
        }
      });
      
      countPipeline.push({
        $match: { isCurrentlyOpen: true }
      });
    }
    
    countPipeline.push({ $count: 'total' });
    
    const countResult = await Restaurant.aggregate(countPipeline);
    const totalRestaurants = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalRestaurants / limit);

    // Get popular cuisines for filters
    const cuisineStats = await Restaurant.aggregate([
      { $match: { isActive: true, isVerified: true } },
      { $unwind: '$cuisine' },
      { $group: { _id: '$cuisine', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
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
        filters: {
          cuisines: cuisineStats.map(c => ({ name: c._id, count: c.count })),
          priceRanges: ['$', '$$', '$$$', '$$$$'],
          features: ['delivery', 'pickup', 'dine-in', 'outdoor-seating', 'wifi', 'parking']
        },
        searchParams: {
          search,
          cuisine,
          priceRange,
          rating,
          sortBy,
          sortOrder,
          isOpen,
          features
        }
      }
    });
  } catch (error) {
    console.error('Restaurants fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add restaurant to favorites (if needed)
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
    const { action, restaurantId } = body;

    if (action === 'toggle-favorite') {
      const User = (await import('@/models/User')).default;
      
      const userDoc = await User.findById(user.id);
      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const favorites = userDoc.favorites || [];
      const isFavorite = favorites.includes(restaurantId);

      let updatedFavorites;
      if (isFavorite) {
        updatedFavorites = favorites.filter(id => id.toString() !== restaurantId);
      } else {
        updatedFavorites = [...favorites, restaurantId];
      }

      await User.findByIdAndUpdate(user.id, {
        favorites: updatedFavorites
      });

      return NextResponse.json({
        success: true,
        message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
        isFavorite: !isFavorite
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Restaurant action error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
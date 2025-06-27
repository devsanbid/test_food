import { authenticate } from '@/middleware/auth';
import Restaurant from '@/models/Restaurant';
import connectDB from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Get menu items from all restaurants
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
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const cuisine = searchParams.get('cuisine') || '';
    const priceRange = searchParams.get('priceRange') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const userLatitude = parseFloat(searchParams.get('latitude'));
    const userLongitude = parseFloat(searchParams.get('longitude'));
    const maxDistance = parseFloat(searchParams.get('maxDistance')) || 50;

    // Build aggregation pipeline
    const pipeline = [
      // Match active and verified restaurants
      {
        $match: {
          isActive: true,
          isVerified: true,
          menu: { $exists: true, $ne: [] }
        }
      },
      // Add distance calculation if coordinates provided
      ...(userLatitude && userLongitude ? [{
        $addFields: {
          distance: {
            $multiply: [
              6371, // Earth's radius in km
              {
                $acos: {
                  $add: [
                    {
                      $multiply: [
                        { $sin: { $multiply: [{ $divide: [userLatitude, 180] }, Math.PI] } },
                        { $sin: { $multiply: [{ $divide: ['$address.coordinates.lat', 180] }, Math.PI] } }
                      ]
                    },
                    {
                      $multiply: [
                        { $cos: { $multiply: [{ $divide: [userLatitude, 180] }, Math.PI] } },
                        { $cos: { $multiply: [{ $divide: ['$address.coordinates.lat', 180] }, Math.PI] } },
                        { $cos: { $multiply: [{ $divide: [{ $subtract: [userLongitude, '$address.coordinates.lng'] }, 180] }, Math.PI] } }
                      ]
                    }
                  ]
                }
              }
            ]
          }
        }
      }] : []),
      // Filter by distance if coordinates provided
      ...(userLatitude && userLongitude ? [{
        $match: {
          distance: { $lte: maxDistance }
        }
      }] : []),
      // Filter by cuisine if specified
      ...(cuisine ? [{
        $match: {
          cuisine: { $regex: cuisine, $options: 'i' }
        }
      }] : []),
      // Unwind menu items
      { $unwind: '$menu' },
      // Match available menu items
      {
        $match: {
          'menu.isAvailable': true
        }
      },
      // Filter by category if specified
      ...(category ? [{
        $match: {
          'menu.category': { $regex: category, $options: 'i' }
        }
      }] : []),
      // Filter by search term if specified
      ...(search ? [{
        $match: {
          $or: [
            { 'menu.name': { $regex: search, $options: 'i' } },
            { 'menu.description': { $regex: search, $options: 'i' } },
            { 'menu.tags': { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),
      // Filter by price range if specified
      ...(priceRange ? [{
        $match: {
          'menu.price': {
            $gte: parseFloat(priceRange.split('-')[0]) || 0,
            $lte: parseFloat(priceRange.split('-')[1]) || 999999
          }
        }
      }] : []),
      // Project required fields
      {
        $project: {
          _id: '$menu._id',
          name: '$menu.name',
          description: '$menu.description',
          price: '$menu.price',
          image: '$menu.image',
          category: '$menu.category',
          tags: '$menu.tags',
          preparationTime: '$menu.preparationTime',
          isVegetarian: '$menu.isVegetarian',
          isVegan: '$menu.isVegan',
          spiceLevel: '$menu.spiceLevel',
          allergens: '$menu.allergens',
          nutritionalInfo: '$menu.nutritionalInfo',
          restaurant: {
            _id: '$_id',
            name: '$name',
            logo: '$logo',
            cuisine: '$cuisine',
            rating: '$rating',
            deliveryTime: '$deliveryTime',
            deliveryFee: '$deliveryFee',
            minimumOrder: '$minimumOrder',
            distance: '$distance'
          }
        }
      },
      // Sort
      {
        $sort: {
          [sortBy === 'price' ? 'price' : 
           sortBy === 'rating' ? 'restaurant.rating.average' :
           sortBy === 'distance' ? 'restaurant.distance' :
           sortBy === 'preparationTime' ? 'preparationTime' : 'name']: 
          sortOrder === 'desc' ? -1 : 1
        }
      }
    ];

    // Get total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Restaurant.aggregate(totalPipeline);
    const totalItems = totalResult[0]?.total || 0;

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute query
    const menuItems = await Restaurant.aggregate(pipeline);

    // Get available filters
    const filtersPromise = Restaurant.aggregate([
      {
        $match: {
          isActive: true,
          isVerified: true,
          menu: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$menu' },
      {
        $match: {
          'menu.isAvailable': true
        }
      },
      {
        $group: {
          _id: null,
          categories: { $addToSet: '$menu.category' },
          cuisines: { $addToSet: '$cuisine' },
          minPrice: { $min: '$menu.price' },
          maxPrice: { $max: '$menu.price' }
        }
      }
    ]);

    const filters = await filtersPromise;
    const availableFilters = filters[0] || {
      categories: [],
      cuisines: [],
      minPrice: 0,
      maxPrice: 100
    };

    return NextResponse.json({
      success: true,
      menuItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        hasNext: page < Math.ceil(totalItems / limit),
        hasPrev: page > 1
      },
      filters: {
        categories: availableFilters.categories.sort(),
        cuisines: availableFilters.cuisines.sort(),
        priceRange: {
          min: availableFilters.minPrice,
          max: availableFilters.maxPrice
        }
      },
      searchParams: {
        search,
        category,
        cuisine,
        priceRange,
        sortBy,
        sortOrder
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
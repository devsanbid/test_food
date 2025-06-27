import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Search restaurants, menu items, and cuisines
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
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, restaurants, menu, cuisines
    const cuisine = searchParams.get('cuisine') || '';
    const priceRange = searchParams.get('priceRange') || '';
    const rating = parseFloat(searchParams.get('rating')) || 0;
    const latitude = parseFloat(searchParams.get('latitude'));
    const longitude = parseFloat(searchParams.get('longitude'));
    const maxDistance = parseFloat(searchParams.get('maxDistance')) || 10; // km
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const features = searchParams.get('features') || ''; // delivery, pickup, vegan, etc.

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = {
      restaurants: [],
      menuItems: [],
      cuisines: [],
      suggestions: [],
      totalResults: 0
    };

    // Build base restaurant query
    let restaurantQuery = {
      isActive: true,
      isVerified: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { cuisine: { $regex: query, $options: 'i' } },
        { 'address.area': { $regex: query, $options: 'i' } },
        { 'address.city': { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    };

    // Add filters
    if (cuisine) {
      restaurantQuery.cuisine = { $in: cuisine.split(',') };
    }

    if (priceRange) {
      restaurantQuery.priceRange = { $in: priceRange.split(',') };
    }

    if (rating > 0) {
      restaurantQuery['rating.average'] = { $gte: rating };
    }

    if (features) {
      const featureList = features.split(',');
      const featureConditions = [];
      
      featureList.forEach(feature => {
        switch (feature) {
          case 'delivery':
            featureConditions.push({ 'deliveryOptions.delivery': true });
            break;
          case 'pickup':
            featureConditions.push({ 'deliveryOptions.pickup': true });
            break;
          case 'vegan':
            featureConditions.push({ 'dietaryOptions.vegan': true });
            break;
          case 'vegetarian':
            featureConditions.push({ 'dietaryOptions.vegetarian': true });
            break;
          case 'glutenFree':
            featureConditions.push({ 'dietaryOptions.glutenFree': true });
            break;
          case 'halal':
            featureConditions.push({ 'dietaryOptions.halal': true });
            break;
        }
      });
      
      if (featureConditions.length > 0) {
        restaurantQuery.$and = featureConditions;
      }
    }

    // Location-based filtering
    if (latitude && longitude) {
      restaurantQuery['address.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      };
    }

    // Search restaurants
    if (type === 'all' || type === 'restaurants') {
      const skip = (page - 1) * limit;
      
      let sort = {};
      if (sortBy === 'distance' && latitude && longitude) {
        // Distance sorting is handled by $near
        sort = {};
      } else if (sortBy === 'rating') {
        sort['rating.average'] = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'deliveryTime') {
        sort['deliveryTime.min'] = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'deliveryFee') {
        sort.deliveryFee = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'name') {
        sort.name = sortOrder === 'desc' ? -1 : 1;
      } else {
        // Relevance sorting (text score)
        restaurantQuery.$text = { $search: query };
        sort = { score: { $meta: 'textScore' } };
      }

      const restaurants = await Restaurant.find(restaurantQuery)
        .sort(sort)
        .skip(type === 'restaurants' ? skip : 0)
        .limit(type === 'restaurants' ? limit : 10)
        .select('-menu'); // Exclude menu for performance

      // Calculate distance and operating status
      restaurants.forEach(restaurant => {
        if (latitude && longitude && restaurant.address.coordinates) {
          restaurant._doc.distance = restaurant.calculateDistance(latitude, longitude);
        }
        restaurant._doc.isOpen = restaurant.isOpen();
      });

      results.restaurants = restaurants;
    }

    // Search menu items
    if (type === 'all' || type === 'menu') {
      const menuResults = await Restaurant.aggregate([
        {
          $match: {
            isActive: true,
            isVerified: true,
            'menu.isAvailable': true
          }
        },
        { $unwind: '$menu' },
        {
          $match: {
            'menu.isAvailable': true,
            $or: [
              { 'menu.name': { $regex: query, $options: 'i' } },
              { 'menu.description': { $regex: query, $options: 'i' } },
              { 'menu.category': { $regex: query, $options: 'i' } },
              { 'menu.tags': { $regex: query, $options: 'i' } }
            ]
          }
        },
        {
          $project: {
            _id: 0,
            restaurantId: '$_id',
            restaurantName: '$name',
            restaurantLogo: '$logo',
            restaurantCuisine: '$cuisine',
            restaurantRating: '$rating',
            menuItem: '$menu',
            isOpen: 1
          }
        },
        { $limit: type === 'menu' ? limit : 10 }
      ]);

      results.menuItems = menuResults;
    }

    // Search cuisines
    if (type === 'all' || type === 'cuisines') {
      const cuisineResults = await Restaurant.aggregate([
        {
          $match: {
            isActive: true,
            isVerified: true,
            cuisine: { $regex: query, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$cuisine',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating.average' },
            avgDeliveryTime: { $avg: '$deliveryTime.min' },
            sampleRestaurants: {
              $push: {
                _id: '$_id',
                name: '$name',
                logo: '$logo',
                rating: '$rating'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            cuisine: '$_id',
            restaurantCount: '$count',
            avgRating: { $round: ['$avgRating', 1] },
            avgDeliveryTime: { $round: ['$avgDeliveryTime', 0] },
            sampleRestaurants: { $slice: ['$sampleRestaurants', 3] }
          }
        },
        { $sort: { restaurantCount: -1 } },
        { $limit: type === 'cuisines' ? limit : 5 }
      ]);

      results.cuisines = cuisineResults;
    }

    // Generate search suggestions
    if (type === 'all') {
      const suggestions = await Restaurant.aggregate([
        {
          $match: {
            isActive: true,
            isVerified: true
          }
        },
        {
          $project: {
            suggestions: {
              $concatArrays: [
                [{ type: 'restaurant', value: '$name' }],
                [{ type: 'cuisine', value: '$cuisine' }],
                {
                  $map: {
                    input: '$tags',
                    as: 'tag',
                    in: { type: 'tag', value: '$$tag' }
                  }
                }
              ]
            }
          }
        },
        { $unwind: '$suggestions' },
        {
          $match: {
            'suggestions.value': { $regex: query, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$suggestions.value',
            type: { $first: '$suggestions.type' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            suggestion: '$_id',
            type: 1,
            count: 1
          }
        }
      ]);

      results.suggestions = suggestions;
    }

    // Calculate total results
    results.totalResults = results.restaurants.length + results.menuItems.length + results.cuisines.length;

    // Save search query for analytics (optional)
    try {
      await User.findByIdAndUpdate(
        user.id,
        {
          $push: {
            searchHistory: {
              $each: [{
                query,
                timestamp: new Date(),
                resultsCount: results.totalResults
              }],
              $slice: -50 // Keep only last 50 searches
            }
          }
        }
      );
    } catch (error) {
      // Don't fail the search if saving history fails
      console.warn('Failed to save search history:', error);
    }

    // Get popular searches
    const popularSearches = await User.aggregate([
      { $unwind: '$searchHistory' },
      {
        $group: {
          _id: '$searchHistory.query',
          count: { $sum: 1 },
          lastSearched: { $max: '$searchHistory.timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          query: '$_id',
          count: 1,
          lastSearched: 1
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        query,
        filters: {
          cuisine,
          priceRange,
          rating,
          features,
          location: latitude && longitude ? { latitude, longitude, maxDistance } : null
        },
        pagination: {
          currentPage: page,
          limit,
          hasMore: results.totalResults >= limit
        },
        popularSearches
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save search preferences or filters
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
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'save-search':
        const { query, filters } = data;
        
        if (!query) {
          return NextResponse.json(
            { success: false, message: 'Search query is required' },
            { status: 400 }
          );
        }

        // Initialize savedSearches if not exists
        if (!userDoc.savedSearches) {
          userDoc.savedSearches = [];
        }

        // Check if search already saved
        const existingSearch = userDoc.savedSearches.find(s => s.query === query);
        if (existingSearch) {
          return NextResponse.json(
            { success: false, message: 'Search already saved' },
            { status: 400 }
          );
        }

        // Add new saved search
        userDoc.savedSearches.push({
          query,
          filters: filters || {},
          savedAt: new Date()
        });

        // Keep only last 20 saved searches
        if (userDoc.savedSearches.length > 20) {
          userDoc.savedSearches = userDoc.savedSearches.slice(-20);
        }

        await userDoc.save();

        return NextResponse.json({
          success: true,
          message: 'Search saved successfully'
        });

      case 'remove-saved-search':
        const { searchId } = data;
        
        if (!searchId) {
          return NextResponse.json(
            { success: false, message: 'Search ID is required' },
            { status: 400 }
          );
        }

        if (!userDoc.savedSearches) {
          return NextResponse.json(
            { success: false, message: 'No saved searches found' },
            { status: 404 }
          );
        }

        // Remove saved search
        userDoc.savedSearches = userDoc.savedSearches.filter(
          search => search._id.toString() !== searchId
        );

        await userDoc.save();

        return NextResponse.json({
          success: true,
          message: 'Saved search removed successfully'
        });

      case 'clear-search-history':
        userDoc.searchHistory = [];
        await userDoc.save();

        return NextResponse.json({
          success: true,
          message: 'Search history cleared successfully'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Search action error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';
import Order from '@/models/Order';
import Notification from '@/models/Notification';

// GET /api/admin/restaurants - Get restaurant details
export async function GET(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list':
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const skip = (page - 1) * limit;

        let query = {};
        
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { 'address.city': { $regex: search, $options: 'i' } }
          ];
        }
        
        if (status) {
          if (status === 'active') {
            query.isActive = true;
          } else if (status === 'inactive') {
            query.isActive = false;
          } else if (status === 'verified') {
            query.isVerified = true;
          } else if (status === 'pending') {
            query.isVerified = false;
          }
        }

        const restaurants = await Restaurant.find(query)
          .populate('owner', 'firstName lastName email phone username')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

        const total = await Restaurant.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
          success: true,
          restaurants,
          pagination: {
            currentPage: page,
            totalPages,
            totalRestaurants: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        });
        
      case 'details':
        if (!restaurantId) {
          return NextResponse.json(
            { success: false, message: 'Restaurant ID is required' },
            { status: 400 }
          );
        }

        const restaurant = await Restaurant.findById(restaurantId)
          .populate('owner', 'firstName lastName email phone username')
          .lean();

        if (!restaurant) {
          return NextResponse.json(
            { success: false, message: 'Restaurant not found' },
            { status: 404 }
          );
        }

        // Get reviews for this restaurant
      const Review = require('@/models/Review');
      const reviews = await Review.find({ 
        restaurant: restaurantId,
        moderationStatus: 'approved',
        isHidden: false
      })
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Transform reviews to match expected format
      const transformedReviews = reviews.map(review => ({
        ...review,
        rating: review.rating.overall // Use overall rating for display
      }));

      restaurant.reviews = transformedReviews;

        return NextResponse.json({
          success: true,
          restaurant
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin restaurants GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/restaurants - Create new restaurant
export async function POST(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const restaurantData = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'ownerName', 'ownerEmail', 'ownerPhone'];
    const missingFields = requiredFields.filter(field => !restaurantData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if restaurant with same email already exists
    const existingRestaurant = await Restaurant.findOne({ email: restaurantData.email });
    if (existingRestaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant with this email already exists' },
        { status: 400 }
      );
    }

    // Check if owner user exists, if not create one
    let ownerUser = await User.findOne({ email: restaurantData.ownerEmail });
    if (!ownerUser) {
      ownerUser = new User({
        firstName: restaurantData.ownerName.split(' ')[0] || restaurantData.ownerName,
        lastName: restaurantData.ownerName.split(' ').slice(1).join(' ') || '',
        email: restaurantData.ownerEmail,
        phone: restaurantData.ownerPhone,
        role: 'restaurant',
        password: 'temp123',
        isVerified: true
      });
      await ownerUser.save();
    }

    // Create restaurant
    const restaurant = new Restaurant({
      name: restaurantData.name,
      description: restaurantData.description || '',
      email: restaurantData.email,
      phone: restaurantData.phone,
      website: restaurantData.website || '',
      address: {
        street: restaurantData.address,
        city: restaurantData.city,
        state: restaurantData.state || 'CA',
        zipCode: restaurantData.zipCode || '00000',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      },
      owner: ownerUser._id,
      cuisine: restaurantData.cuisineTypes || ['American'],
      priceRange: '$$',
      operatingHours: {
        monday: { 
          open: restaurantData.operatingHours?.monday?.open || '09:00', 
          close: restaurantData.operatingHours?.monday?.close || '22:00', 
          isClosed: restaurantData.operatingHours?.monday?.closed || false 
        },
        tuesday: { 
          open: restaurantData.operatingHours?.tuesday?.open || '09:00', 
          close: restaurantData.operatingHours?.tuesday?.close || '22:00', 
          isClosed: restaurantData.operatingHours?.tuesday?.closed || false 
        },
        wednesday: { 
          open: restaurantData.operatingHours?.wednesday?.open || '09:00', 
          close: restaurantData.operatingHours?.wednesday?.close || '22:00', 
          isClosed: restaurantData.operatingHours?.wednesday?.closed || false 
        },
        thursday: { 
          open: restaurantData.operatingHours?.thursday?.open || '09:00', 
          close: restaurantData.operatingHours?.thursday?.close || '22:00', 
          isClosed: restaurantData.operatingHours?.thursday?.closed || false 
        },
        friday: { 
          open: restaurantData.operatingHours?.friday?.open || '09:00', 
          close: restaurantData.operatingHours?.friday?.close || '22:00', 
          isClosed: restaurantData.operatingHours?.friday?.closed || false 
        },
        saturday: { 
          open: restaurantData.operatingHours?.saturday?.open || '09:00', 
          close: restaurantData.operatingHours?.saturday?.close || '22:00', 
          isClosed: restaurantData.operatingHours?.saturday?.closed || false 
        },
        sunday: { 
          open: restaurantData.operatingHours?.sunday?.open || '09:00', 
          close: restaurantData.operatingHours?.sunday?.close || '22:00', 
          isClosed: restaurantData.operatingHours?.sunday?.closed || false 
        }
      },
      deliveryTime: {
        min: 20,
        max: 45
      },
      minimumOrder: restaurantData.minimumOrder || 10,
      deliveryFee: restaurantData.deliveryFee || 2.99,
      features: ['delivery', 'pickup'],
      paymentMethods: ['cash', 'card', 'digital-wallet'],
      isActive: true,
      isVerified: false
    });

    await restaurant.save();

    // Notify owner about restaurant creation
    await Notification.create({
      user: ownerUser._id,
      type: 'restaurant_created',
      title: 'Restaurant Created',
      message: `Your restaurant "${restaurant.name}" has been created and is pending verification.`,
      data: { restaurantId: restaurant._id }
    });

    return NextResponse.json({
      success: true,
      message: 'Restaurant created successfully',
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        email: restaurant.email,
        status: restaurant.status
      }
    });
  } catch (error) {
    console.error('Admin restaurants POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/restaurants - Update restaurant
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { restaurantId, action, ...updateData } = await request.json();

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'verify':
        restaurant.isVerified = true;
        restaurant.verifiedAt = new Date();
        await restaurant.save();

        // Notify restaurant owner
        await Notification.create({
          user: restaurant.owner,
          type: 'restaurant_verified',
          title: 'Restaurant Verified',
          message: `Your restaurant "${restaurant.name}" has been verified by admin.`,
          data: { restaurantId: restaurant._id }
        });

        return NextResponse.json({
          success: true,
          message: 'Restaurant verified successfully',
          restaurant
        });

      case 'unverify':
        restaurant.isVerified = false;
        restaurant.verifiedAt = null;
        await restaurant.save();

        // Notify restaurant owner
        await Notification.create({
          user: restaurant.owner,
          type: 'restaurant_unverified',
          title: 'Restaurant Verification Removed',
          message: `Your restaurant "${restaurant.name}" verification has been removed.`,
          data: { restaurantId: restaurant._id }
        });

        return NextResponse.json({
          success: true,
          message: 'Restaurant verification removed',
          restaurant
        });

      case 'activate':
        restaurant.isActive = true;
        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: 'Restaurant activated successfully',
          restaurant
        });

      case 'deactivate':
        restaurant.isActive = false;
        await restaurant.save();

        // Notify restaurant owner
        await Notification.create({
          user: restaurant.owner,
          type: 'restaurant_deactivated',
          title: 'Restaurant Deactivated',
          message: `Your restaurant "${restaurant.name}" has been deactivated by admin.`,
          data: { restaurantId: restaurant._id }
        });

        return NextResponse.json({
          success: true,
          message: 'Restaurant deactivated successfully',
          restaurant
        });

      case 'update':
        const allowedFields = [
          'name', 'description', 'cuisine', 'address', 'phone',
          'email', 'openingHours', 'deliveryFee', 'minimumOrder',
          'estimatedDeliveryTime', 'tags'
        ];
        
        const updates = {};
        allowedFields.forEach(field => {
          if (updateData[field] !== undefined) {
            updates[field] = updateData[field];
          }
        });

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
          restaurantId,
          updates,
          { new: true, runValidators: true }
        );

        return NextResponse.json({
          success: true,
          message: 'Restaurant updated successfully',
          restaurant: updatedRestaurant
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin restaurants PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/restaurants - Delete restaurant
export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Check for active orders
    const activeOrders = await Order.countDocuments({
      restaurant: restaurantId,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] }
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete restaurant with active orders' },
        { status: 400 }
      );
    }

    // Delete restaurant
    await Restaurant.findByIdAndDelete(restaurantId);

    // Notify restaurant owner
    await Notification.create({
      user: restaurant.owner,
      type: 'restaurant_deleted',
      title: 'Restaurant Deleted',
      message: `Your restaurant "${restaurant.name}" has been deleted by admin.`,
      data: { restaurantName: restaurant.name }
    });

    return NextResponse.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error('Admin restaurants DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
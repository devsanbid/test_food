import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    // Find restaurant by owner
    let restaurant = await Restaurant.findOne({ owner: request.user.id }).populate('owner', 'firstName lastName email');
    
    if (!restaurant) {
      // Create a default restaurant profile for the user
      restaurant = new Restaurant({
        name: `${request.user.firstName || 'New'} Restaurant`,
        description: 'Welcome to our restaurant! Please update your profile.',
        cuisine: ['General'],
        address: {
          street: 'Please update your address',
          city: 'City',
          state: 'State',
          zipCode: '00000',
          coordinates: {
            latitude: 0,
            longitude: 0
          }
        },
        phone: '+1234567890',
        email: request.user.email,
        priceRange: '$',
        deliveryTime: {
          min: 30,
          max: 60
        },
        operatingHours: {
          monday: { open: '09:00', close: '21:00', isClosed: false },
          tuesday: { open: '09:00', close: '21:00', isClosed: false },
          wednesday: { open: '09:00', close: '21:00', isClosed: false },
          thursday: { open: '09:00', close: '21:00', isClosed: false },
          friday: { open: '09:00', close: '21:00', isClosed: false },
          saturday: { open: '09:00', close: '21:00', isClosed: false },
          sunday: { open: '09:00', close: '21:00', isClosed: false }
        },
        owner: request.user.id,
        isActive: true,
        isVerified: false
      });
      
      await restaurant.save();
      restaurant = await Restaurant.findById(restaurant._id).populate('owner', 'firstName lastName email');
    }

    return NextResponse.json({
      success: true,
      restaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;
    const body = await request.json();
    
    // Find restaurant by owner
    const restaurant = await Restaurant.findOne({ owner: request.user.id });
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Update restaurant fields
    const updateFields = {
      name: body.name,
      description: body.description,
      cuisine: body.cuisine,
      address: body.address,
      country: body.country,
      phone: body.phone,
      email: body.email,
      website: body.website,
      priceRange: body.priceRange,
      deliveryFee: body.deliveryFee,
      minimumOrderAmount: body.minimumOrderAmount,
      deliveryRadius: body.deliveryRadius,
      isActive: body.isActive,
      acceptsOnlineOrders: body.acceptsOnlineOrders,
      hasDelivery: body.hasDelivery,
      hasPickup: body.hasPickup,
      operatingHours: body.operatingHours,
      bankDetails: body.bankDetails,
      profileImage: body.profileImage,
      bannerImage: body.bannerImage
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');

    return NextResponse.json({
      success: true,
      message: 'Restaurant profile updated successfully',
      restaurant: updatedRestaurant
    });
  } catch (error) {
    console.error('Error updating restaurant profile:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, message: 'Validation error', errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
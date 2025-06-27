import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Retrieve user addresses
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
    const type = searchParams.get('type'); // home, work, other
    const isDefault = searchParams.get('isDefault') === 'true';

    const userDoc = await User.findById(user.id).select('addresses');
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    let addresses = userDoc.addresses || [];

    // Apply filters
    if (type) {
      addresses = addresses.filter(addr => addr.type === type);
    }

    if (isDefault) {
      addresses = addresses.filter(addr => addr.isDefault === true);
    }

    // Sort addresses (default first, then by creation date)
    addresses.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return NextResponse.json({
      success: true,
      data: {
        addresses,
        total: addresses.length,
        defaultAddress: addresses.find(addr => addr.isDefault) || null
      }
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add new address
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
    const {
      type,
      label,
      street,
      area,
      city,
      state,
      postalCode,
      country,
      coordinates,
      landmark,
      instructions,
      isDefault
    } = body;

    // Validation
    if (!type || !street || !area || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { success: false, message: 'Required address fields are missing' },
        { status: 400 }
      );
    }

    if (!['home', 'work', 'other'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid address type' },
        { status: 400 }
      );
    }

    // Validate coordinates if provided
    if (coordinates) {
      const { latitude, longitude } = coordinates;
      if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
          latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { success: false, message: 'Invalid coordinates' },
          { status: 400 }
        );
      }
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Initialize addresses array if not exists
    if (!userDoc.addresses) {
      userDoc.addresses = [];
    }

    // Check address limit (max 10 addresses)
    if (userDoc.addresses.length >= 10) {
      return NextResponse.json(
        { success: false, message: 'Maximum 10 addresses allowed' },
        { status: 400 }
      );
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      userDoc.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // If this is the first address, make it default
    const shouldBeDefault = isDefault || userDoc.addresses.length === 0;

    // Create new address
    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      type,
      label: label || type.charAt(0).toUpperCase() + type.slice(1),
      street,
      area,
      city,
      state,
      postalCode,
      country,
      coordinates: coordinates ? {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude]
      } : null,
      landmark: landmark || '',
      instructions: instructions || '',
      isDefault: shouldBeDefault,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    userDoc.addresses.push(newAddress);
    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
      data: {
        address: newAddress
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update address or set default
export async function PUT(request) {
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
    const { addressId, action, ...updateData } = body;

    if (!addressId) {
      return NextResponse.json(
        { success: false, message: 'Address ID is required' },
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

    if (!userDoc.addresses || userDoc.addresses.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No addresses found' },
        { status: 404 }
      );
    }

    const addressIndex = userDoc.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Address not found' },
        { status: 404 }
      );
    }

    if (action === 'set-default') {
      // Remove default from all addresses
      userDoc.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      
      // Set this address as default
      userDoc.addresses[addressIndex].isDefault = true;
      userDoc.addresses[addressIndex].updatedAt = new Date();
      
      await userDoc.save();
      
      return NextResponse.json({
        success: true,
        message: 'Default address updated successfully',
        data: {
          address: userDoc.addresses[addressIndex]
        }
      });
    }

    // Update address fields
    const allowedFields = [
      'type', 'label', 'street', 'area', 'city', 'state', 
      'postalCode', 'country', 'coordinates', 'landmark', 
      'instructions', 'isDefault'
    ];

    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    // Validate type if being updated
    if (updates.type && !['home', 'work', 'other'].includes(updates.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid address type' },
        { status: 400 }
      );
    }

    // Validate coordinates if being updated
    if (updates.coordinates) {
      const { latitude, longitude } = updates.coordinates;
      if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
          latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { success: false, message: 'Invalid coordinates' },
          { status: 400 }
        );
      }
      
      updates.coordinates = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }

    // If setting as default, remove default from other addresses
    if (updates.isDefault) {
      userDoc.addresses.forEach((addr, index) => {
        if (index !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      userDoc.addresses[addressIndex][key] = updates[key];
    });
    
    userDoc.addresses[addressIndex].updatedAt = new Date();
    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address: userDoc.addresses[addressIndex]
      }
    });
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove address
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
    const addressId = searchParams.get('addressId');

    if (!addressId) {
      return NextResponse.json(
        { success: false, message: 'Address ID is required' },
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

    if (!userDoc.addresses || userDoc.addresses.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No addresses found' },
        { status: 404 }
      );
    }

    const addressIndex = userDoc.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Address not found' },
        { status: 404 }
      );
    }

    const addressToDelete = userDoc.addresses[addressIndex];
    const wasDefault = addressToDelete.isDefault;

    // Remove the address
    userDoc.addresses.splice(addressIndex, 1);

    // If deleted address was default and there are other addresses, make the first one default
    if (wasDefault && userDoc.addresses.length > 0) {
      userDoc.addresses[0].isDefault = true;
      userDoc.addresses[0].updatedAt = new Date();
    }

    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
      data: {
        deletedAddressId: addressId,
        newDefaultAddress: wasDefault && userDoc.addresses.length > 0 ? userDoc.addresses[0] : null
      }
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
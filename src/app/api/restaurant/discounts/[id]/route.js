import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Discount from '@/models/Discount';
import { authenticate, restaurantOnly } from '@/middleware/auth';

// GET /api/restaurant/discounts/[id] - Get specific discount
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    const roleCheck = await restaurantOnly(authResult.user);
    if (!roleCheck.success) {
      return NextResponse.json({ success: false, message: roleCheck.message }, { status: 403 });
    }

    const { id } = await params;
    const discount = await Discount.findOne({ 
      _id: id, 
      restaurant: authResult.user.restaurantId 
    });

    if (!discount) {
      return NextResponse.json({ 
        success: false, 
        message: 'Discount not found' 
      }, { status: 404 });
    }

    const discountWithStatus = discount.toObject();

    return NextResponse.json({ 
      success: true, 
      discount: discountWithStatus 
    });

  } catch (error) {
    console.error('Error fetching discount:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT /api/restaurant/discounts/[id] - Update discount
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    const roleCheck = await restaurantOnly(authResult.user);
    if (!roleCheck.success) {
      return NextResponse.json({ success: false, message: roleCheck.message }, { status: 403 });
    }

    const { id } = await params;
    const updateData = await request.json();

    // Find the existing discount
    const existingDiscount = await Discount.findOne({ 
      _id: id, 
      restaurant: authResult.user.restaurantId 
    });

    if (!existingDiscount) {
      return NextResponse.json({ 
        success: false, 
        message: 'Discount not found' 
      }, { status: 404 });
    }

    // If updating the code, check for uniqueness
    if (updateData.code && updateData.code !== existingDiscount.code) {
      const existingCode = await Discount.findOne({ 
        code: updateData.code, 
        restaurant: authResult.user.restaurantId,
        _id: { $ne: id }
      });
      
      if (existingCode) {
        return NextResponse.json({ 
          success: false, 
          message: 'Discount code already exists' 
        }, { status: 400 });
      }
    }

    // Validate dates if provided
    if (updateData.startDate && updateData.endDate) {
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);
      
      if (startDate >= endDate) {
        return NextResponse.json({ 
          success: false, 
          message: 'End date must be after start date' 
        }, { status: 400 });
      }
    }

    // Update the discount
    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    const discountWithStatus = updatedDiscount.toObject();

    return NextResponse.json({ 
      success: true, 
      message: 'Discount updated successfully',
      discount: discountWithStatus 
    });

  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/restaurant/discounts/[id] - Delete discount
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    const roleCheck = await restaurantOnly(authResult.user);
    if (!roleCheck.success) {
      return NextResponse.json({ success: false, message: roleCheck.message }, { status: 403 });
    }

    const { id } = await params;
    
    const deletedDiscount = await Discount.findOneAndDelete({ 
      _id: id, 
      restaurant: authResult.user.restaurantId 
    });

    if (!deletedDiscount) {
      return NextResponse.json({ 
        success: false, 
        message: 'Discount not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Discount deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
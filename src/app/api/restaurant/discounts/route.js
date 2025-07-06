import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import Discount from '@/models/Discount';
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search');

    let query = { restaurant: restaurant._id };

    if (status && status !== 'all') {
      const now = new Date();
      switch (status) {
        case 'active':
          query.isActive = true;
          query.startDate = { $lte: now };
          query.endDate = { $gte: now };
          break;
        case 'scheduled':
          query.startDate = { $gt: now };
          break;
        case 'expired':
          query.endDate = { $lt: now };
          break;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const discounts = await Discount.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const discountsWithStatus = discounts.map(discount => {
      const discountObj = discount.toObject();
      return discountObj;
    });

    const total = await Discount.countDocuments(query);

    const stats = await Discount.aggregate([
      { $match: { restaurant: restaurant._id } },
      {
        $group: {
          _id: null,
          totalDiscounts: { $sum: 1 },
          activeDiscounts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $lte: ['$startDate', new Date()] },
                    { $gte: ['$endDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalRedemptions: { $sum: '$redemptions' },
          totalRevenue: { $sum: '$revenue' }
        }
      }
    ]);

    const discountStats = stats[0] || {
      totalDiscounts: 0,
      activeDiscounts: 0,
      totalRedemptions: 0,
      totalRevenue: 0
    };

    return NextResponse.json({
      success: true,
      discounts: discountsWithStatus,
      stats: discountStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Discounts fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();
    const {
      name,
      description,
      type,
      value,
      code,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      userLimit,
      startDate,
      endDate,
      applicableItems,
      customerSegment,
      isActive
    } = body;

    if (!name || !description || !type || value === undefined || !code || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const existingDiscount = await Discount.findOne({ code: code.toUpperCase() });
    if (existingDiscount) {
      return NextResponse.json(
        { success: false, message: 'Discount code already exists' },
        { status: 400 }
      );
    }

    const newDiscount = new Discount({
      restaurant: restaurant._id,
      name,
      description,
      type,
      value: parseFloat(value),
      code: code.toUpperCase(),
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      maxDiscount: parseFloat(maxDiscount) || 0,
      usageLimit: parseInt(usageLimit) || 0,
      userLimit: parseInt(userLimit) || 1,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      applicableItems: applicableItems || ['all'],
      customerSegment: customerSegment || 'all',
      isActive: isActive !== undefined ? isActive : true
    });

    await newDiscount.save();

    return NextResponse.json({
      success: true,
      message: 'Discount created successfully',
      discount: newDiscount
    });
  } catch (error) {
    console.error('Discount creation error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Discount code already exists' },
        { status: 400 }
      );
    }
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

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const discountId = searchParams.get('id');

    if (!discountId) {
      return NextResponse.json(
        { success: false, message: 'Discount ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      value,
      code,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      userLimit,
      startDate,
      endDate,
      applicableItems,
      customerSegment,
      isActive
    } = body;

    const discount = await Discount.findOne({
      _id: discountId,
      restaurant: restaurant._id
    });

    if (!discount) {
      return NextResponse.json(
        { success: false, message: 'Discount not found' },
        { status: 404 }
      );
    }

    if (code && code.toUpperCase() !== discount.code) {
      const existingDiscount = await Discount.findOne({ code: code.toUpperCase() });
      if (existingDiscount) {
        return NextResponse.json(
          { success: false, message: 'Discount code already exists' },
          { status: 400 }
        );
      }
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = parseFloat(value);
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount);
    if (maxDiscount !== undefined) updateData.maxDiscount = parseFloat(maxDiscount);
    if (usageLimit !== undefined) updateData.usageLimit = parseInt(usageLimit);
    if (userLimit !== undefined) updateData.userLimit = parseInt(userLimit);
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (applicableItems !== undefined) updateData.applicableItems = applicableItems;
    if (customerSegment !== undefined) updateData.customerSegment = customerSegment;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDiscount = await Discount.findByIdAndUpdate(
      discountId,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Discount updated successfully',
      discount: updatedDiscount
    });
  } catch (error) {
    console.error('Discount update error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Discount code already exists' },
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
    restaurantOnly(user);
    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const discountId = searchParams.get('id');

    if (!discountId) {
      return NextResponse.json(
        { success: false, message: 'Discount ID is required' },
        { status: 400 }
      );
    }

    const discount = await Discount.findOne({
      _id: discountId,
      restaurant: restaurant._id
    });

    if (!discount) {
      return NextResponse.json(
        { success: false, message: 'Discount not found' },
        { status: 404 }
      );
    }

    await Discount.findByIdAndDelete(discountId);

    return NextResponse.json({
      success: true,
      message: 'Discount deleted successfully'
    });
  } catch (error) {
    console.error('Discount deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
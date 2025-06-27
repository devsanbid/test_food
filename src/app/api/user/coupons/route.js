import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import Order from '@/models/Order';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Retrieve available coupons for user
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
    const type = searchParams.get('type'); // available, used, expired, all
    const category = searchParams.get('category'); // discount, delivery, cashback, combo
    const restaurantId = searchParams.get('restaurantId');
    const minOrderValue = parseFloat(searchParams.get('minOrderValue')) || 0;
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    const userDoc = await User.findById(user.id).populate('usedCoupons.couponId');
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const currentDate = new Date();
    const skip = (page - 1) * limit;

    // Build coupon query
    let couponQuery = {
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    };

    // Add filters
    if (category) {
      couponQuery.type = category;
    }

    if (restaurantId) {
      couponQuery.$or = [
        { applicableRestaurants: { $in: [restaurantId] } },
        { applicableRestaurants: { $size: 0 } } // Global coupons
      ];
    }

    if (minOrderValue > 0) {
      couponQuery.minOrderValue = { $lte: minOrderValue };
    }

    // Get all active coupons
    const allCoupons = await Coupon.find(couponQuery)
      .populate('applicableRestaurants', 'name logo')
      .sort({ createdAt: -1 });

    // Get user's coupon usage history
    const usedCoupons = userDoc.usedCoupons || [];
    const usedCouponIds = usedCoupons.map(uc => uc.couponId.toString());

    let filteredCoupons = [];

    switch (type) {
      case 'available':
        filteredCoupons = allCoupons.filter(coupon => {
          // Check if user hasn't used this coupon or can use it again
          const userUsage = usedCoupons.filter(uc => uc.couponId.toString() === coupon._id.toString());
          const canUse = userUsage.length < coupon.usageLimit.perUser;
          
          // Check if coupon hasn't reached global usage limit
          const globalUsageOk = coupon.usageCount < coupon.usageLimit.total;
          
          // Check user eligibility
          const isEligible = coupon.userEligibility.newUsersOnly ? 
            userDoc.orderCount === 0 : true;
          
          return canUse && globalUsageOk && isEligible;
        });
        break;
        
      case 'used':
        const usedCouponDetails = await Coupon.find({
          _id: { $in: usedCouponIds }
        }).populate('applicableRestaurants', 'name logo');
        
        filteredCoupons = usedCouponDetails.map(coupon => {
          const usage = usedCoupons.filter(uc => uc.couponId.toString() === coupon._id.toString());
          return {
            ...coupon.toObject(),
            usageHistory: usage,
            timesUsed: usage.length
          };
        });
        break;
        
      case 'expired':
        const expiredQuery = {
          ...couponQuery,
          $or: [
            { endDate: { $lt: currentDate } },
            { isActive: false }
          ]
        };
        delete expiredQuery.endDate;
        delete expiredQuery.isActive;
        
        filteredCoupons = await Coupon.find(expiredQuery)
          .populate('applicableRestaurants', 'name logo')
          .sort({ endDate: -1 });
        break;
        
      default: // 'all'
        filteredCoupons = allCoupons.map(coupon => {
          const userUsage = usedCoupons.filter(uc => uc.couponId.toString() === coupon._id.toString());
          const canUse = userUsage.length < coupon.usageLimit.perUser;
          const globalUsageOk = coupon.usageCount < coupon.usageLimit.total;
          const isEligible = coupon.userEligibility.newUsersOnly ? 
            userDoc.orderCount === 0 : true;
          
          return {
            ...coupon.toObject(),
            canUse: canUse && globalUsageOk && isEligible,
            timesUsed: userUsage.length,
            usageHistory: userUsage
          };
        });
    }

    // Apply pagination
    const paginatedCoupons = filteredCoupons.slice(skip, skip + limit);

    // Calculate savings and statistics
    const totalSavings = usedCoupons.reduce((sum, uc) => sum + (uc.discountAmount || 0), 0);
    const totalCouponsUsed = usedCoupons.length;
    
    // Get coupon categories stats
    const categoryStats = await Coupon.aggregate([
      {
        $match: {
          isActive: true,
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgDiscount: { $avg: '$discountValue' },
          maxDiscount: { $max: '$discountValue' }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        coupons: paginatedCoupons,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filteredCoupons.length / limit),
          totalCoupons: filteredCoupons.length,
          hasMore: skip + limit < filteredCoupons.length
        },
        statistics: {
          totalSavings,
          totalCouponsUsed,
          availableCoupons: allCoupons.filter(coupon => {
            const userUsage = usedCoupons.filter(uc => uc.couponId.toString() === coupon._id.toString());
            const canUse = userUsage.length < coupon.usageLimit.perUser;
            const globalUsageOk = coupon.usageCount < coupon.usageLimit.total;
            const isEligible = coupon.userEligibility.newUsersOnly ? userDoc.orderCount === 0 : true;
            return canUse && globalUsageOk && isEligible;
          }).length,
          categoryStats
        }
      }
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Apply or validate coupon
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
    const { action, couponCode, orderId, orderValue, restaurantId, items } = body;

    if (!action || !couponCode) {
      return NextResponse.json(
        { success: false, message: 'Action and coupon code are required' },
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

    // Find the coupon
    const coupon = await Coupon.findOne({ 
      code: couponCode.toUpperCase(),
      isActive: true 
    }).populate('applicableRestaurants', 'name');

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Invalid or inactive coupon code' },
        { status: 404 }
      );
    }

    const currentDate = new Date();

    // Check if coupon is within valid date range
    if (currentDate < coupon.startDate || currentDate > coupon.endDate) {
      return NextResponse.json(
        { success: false, message: 'Coupon has expired or not yet active' },
        { status: 400 }
      );
    }

    // Check global usage limit
    if (coupon.usageCount >= coupon.usageLimit.total) {
      return NextResponse.json(
        { success: false, message: 'Coupon usage limit exceeded' },
        { status: 400 }
      );
    }

    // Check user-specific usage limit
    const userUsage = (userDoc.usedCoupons || []).filter(
      uc => uc.couponId.toString() === coupon._id.toString()
    );
    
    if (userUsage.length >= coupon.usageLimit.perUser) {
      return NextResponse.json(
        { success: false, message: 'You have already used this coupon maximum times' },
        { status: 400 }
      );
    }

    // Check user eligibility
    if (coupon.userEligibility.newUsersOnly && userDoc.orderCount > 0) {
      return NextResponse.json(
        { success: false, message: 'This coupon is only for new users' },
        { status: 400 }
      );
    }

    // Check minimum order value
    if (orderValue && orderValue < coupon.minOrderValue) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Minimum order value of ₹${coupon.minOrderValue} required` 
        },
        { status: 400 }
      );
    }

    // Check restaurant applicability
    if (restaurantId && coupon.applicableRestaurants.length > 0) {
      const isApplicable = coupon.applicableRestaurants.some(
        restaurant => restaurant._id.toString() === restaurantId
      );
      
      if (!isApplicable) {
        return NextResponse.json(
          { success: false, message: 'Coupon not applicable for this restaurant' },
          { status: 400 }
        );
      }
    }

    switch (action) {
      case 'validate':
        // Calculate discount
        let discountAmount = 0;
        
        if (coupon.discountType === 'percentage') {
          discountAmount = (orderValue * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        } else if (coupon.discountType === 'fixed') {
          discountAmount = coupon.discountValue;
        }

        return NextResponse.json({
          success: true,
          message: 'Coupon is valid',
          data: {
            coupon: {
              _id: coupon._id,
              code: coupon.code,
              title: coupon.title,
              description: coupon.description,
              type: coupon.type,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              maxDiscountAmount: coupon.maxDiscountAmount
            },
            discountAmount: Math.round(discountAmount * 100) / 100,
            finalAmount: Math.max(0, orderValue - discountAmount)
          }
        });

      case 'apply':
        if (!orderId) {
          return NextResponse.json(
            { success: false, message: 'Order ID is required for applying coupon' },
            { status: 400 }
          );
        }

        // Calculate discount
        let appliedDiscountAmount = 0;
        
        if (coupon.discountType === 'percentage') {
          appliedDiscountAmount = (orderValue * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount) {
            appliedDiscountAmount = Math.min(appliedDiscountAmount, coupon.maxDiscountAmount);
          }
        } else if (coupon.discountType === 'fixed') {
          appliedDiscountAmount = coupon.discountValue;
        }

        // Update user's used coupons
        if (!userDoc.usedCoupons) {
          userDoc.usedCoupons = [];
        }
        
        userDoc.usedCoupons.push({
          couponId: coupon._id,
          orderId: orderId,
          discountAmount: appliedDiscountAmount,
          usedAt: new Date()
        });

        // Update coupon usage count
        coupon.usageCount += 1;
        
        // Save both documents
        await Promise.all([
          userDoc.save(),
          coupon.save()
        ]);

        return NextResponse.json({
          success: true,
          message: 'Coupon applied successfully',
          data: {
            discountAmount: Math.round(appliedDiscountAmount * 100) / 100,
            finalAmount: Math.max(0, orderValue - appliedDiscountAmount),
            couponUsed: {
              code: coupon.code,
              title: coupon.title,
              discountAmount: appliedDiscountAmount
            }
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Coupon action error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Mark coupon as favorite or unfavorite
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
    const { couponId, action } = body;

    if (!couponId || !action) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID and action are required' },
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

    // Verify coupon exists
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Initialize favoriteCoupons if not exists
    if (!userDoc.favoriteCoupons) {
      userDoc.favoriteCoupons = [];
    }

    const isFavorite = userDoc.favoriteCoupons.includes(couponId);

    switch (action) {
      case 'add-favorite':
        if (isFavorite) {
          return NextResponse.json(
            { success: false, message: 'Coupon is already in favorites' },
            { status: 400 }
          );
        }
        
        userDoc.favoriteCoupons.push(couponId);
        await userDoc.save();
        
        return NextResponse.json({
          success: true,
          message: 'Coupon added to favorites'
        });

      case 'remove-favorite':
        if (!isFavorite) {
          return NextResponse.json(
            { success: false, message: 'Coupon is not in favorites' },
            { status: 400 }
          );
        }
        
        userDoc.favoriteCoupons = userDoc.favoriteCoupons.filter(
          id => id.toString() !== couponId
        );
        await userDoc.save();
        
        return NextResponse.json({
          success: true,
          message: 'Coupon removed from favorites'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Coupon favorite error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
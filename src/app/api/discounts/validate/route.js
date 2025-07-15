import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate } from '@/middleware/auth';
import Discount from '@/models/Discount';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';
import Order from '@/models/Order';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    await connectDB();

    const body = await request.json();
    const { code, restaurantId, orderAmount, items } = body;

    console.log('Discount validation request:', {
      code,
      codeUpperCase: code?.toUpperCase(),
      restaurantId,
      orderAmount,
      items: items?.length || 0
    });

    if (!code || !restaurantId || !orderAmount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const discount = await Discount.findOne({
      code: code.toUpperCase(),
      restaurant: restaurantId,
      isActive: true
    });

    console.log('Discount query result:', {
      found: !!discount,
      searchCode: code.toUpperCase(),
      searchRestaurantId: restaurantId,
      discountData: discount ? {
        id: discount._id,
        code: discount.code,
        restaurant: discount.restaurant,
        isActive: discount.isActive
      } : null
    });

    if (!discount) {
      return NextResponse.json(
        { success: false, message: 'Invalid discount code' },
        { status: 404 }
      );
    }

    const now = new Date();
    if (discount.startDate > now) {
      return NextResponse.json(
        { success: false, message: 'Discount is not yet active' },
        { status: 400 }
      );
    }

    if (discount.endDate < now) {
      return NextResponse.json(
        { success: false, message: 'Discount has expired' },
        { status: 400 }
      );
    }

    if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) {
      return NextResponse.json(
        { success: false, message: 'Discount usage limit reached' },
        { status: 400 }
      );
    }

    if (orderAmount < discount.minOrderAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order amount of $${discount.minOrderAmount} required`
        },
        { status: 400 }
      );
    }

    if (discount.customerSegment !== 'all') {
      const userOrderCount = await Order.countDocuments({
        user: user.id,
        status: 'delivered'
      });

      switch (discount.customerSegment) {
        case 'new':
          if (userOrderCount > 0) {
            return NextResponse.json(
              { success: false, message: 'This discount is only for new customers' },
              { status: 400 }
            );
          }
          break;
        case 'returning':
          if (userOrderCount === 0) {
            return NextResponse.json(
              { success: false, message: 'This discount is only for returning customers' },
              { status: 400 }
            );
          }
          break;
        case 'vip':
          if (userOrderCount < 10) {
            return NextResponse.json(
              { success: false, message: 'This discount is only for VIP customers' },
              { status: 400 }
            );
          }
          break;
      }
    }

    if (discount.userLimit > 0) {
      const userUsageCount = await Order.countDocuments({
        user: user.id,
        'discount.code': discount.code,
        status: { $in: ['confirmed', 'preparing', 'ready', 'delivered'] }
      });

      if (userUsageCount >= discount.userLimit) {
        return NextResponse.json(
          { success: false, message: 'You have reached the usage limit for this discount' },
          { status: 400 }
        );
      }
    }

    if (discount.applicableItems && discount.applicableItems.length > 0 && !discount.applicableItems.includes('all')) {
      const applicableItems = items?.filter(item => 
        discount.applicableItems.some(applicableItem => 
          item.name.toLowerCase().includes(applicableItem.toLowerCase())
        )
      );

      if (!applicableItems || applicableItems.length === 0) {
        return NextResponse.json(
          { success: false, message: 'This discount is not applicable to your selected items' },
          { status: 400 }
        );
      }
    }

    let discountAmount = 0;
    switch (discount.type) {
      case 'percentage':
        discountAmount = (orderAmount * discount.value) / 100;
        if (discount.maxDiscount > 0) {
          discountAmount = Math.min(discountAmount, discount.maxDiscount);
        }
        break;
      case 'fixed':
        discountAmount = discount.value;
        break;
      case 'free_delivery':
        discountAmount = 5;
        break;
      case 'bogo':
        if (items && items.length >= 2) {
          const sortedItems = items.sort((a, b) => a.price - b.price);
          discountAmount = (sortedItems[0].price * discount.value) / 100;
        }
        break;
      default:
        discountAmount = 0;
    }

    discountAmount = Math.min(discountAmount, orderAmount);

    return NextResponse.json({
      success: true,
      discount: {
        id: discount._id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        discountAmount: Math.round(discountAmount * 100) / 100
      },
      finalAmount: Math.round((orderAmount - discountAmount) * 100) / 100
    });
  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
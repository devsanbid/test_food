import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/middleware/auth';

export async function GET(request) {
  try {
    await connectDB();
    
    const user = await verifyToken(request);
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mockDiscounts = [
      {
        id: 'DISC001',
        code: 'WELCOME20',
        title: 'Welcome Discount',
        description: '20% off for new customers',
        type: 'percentage',
        value: 20,
        minOrderAmount: 25,
        maxDiscountAmount: 10,
        usageLimit: 100,
        usedCount: 45,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'DISC002',
        code: 'FLAT5OFF',
        title: 'Flat $5 Off',
        description: '$5 off on orders above $30',
        type: 'fixed',
        value: 5,
        minOrderAmount: 30,
        maxDiscountAmount: 5,
        usageLimit: 200,
        usedCount: 123,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        isActive: true,
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'DISC003',
        code: 'WEEKEND15',
        title: 'Weekend Special',
        description: '15% off on weekends',
        type: 'percentage',
        value: 15,
        minOrderAmount: 20,
        maxDiscountAmount: 15,
        usageLimit: 50,
        usedCount: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        isActive: false,
        createdAt: new Date('2024-01-01')
      }
    ];

    return NextResponse.json({
      success: true,
      discounts: mockDiscounts
    });
  } catch (error) {
    console.error('Discounts fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const user = await verifyToken(request);
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, title, description, type, value, minOrderAmount, maxDiscountAmount, usageLimit, startDate, endDate } = body;

    const newDiscount = {
      id: 'DISC' + Date.now(),
      code,
      title,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      usedCount: 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
      createdAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Discount created successfully',
      discount: newDiscount
    });
  } catch (error) {
    console.error('Discount creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
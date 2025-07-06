import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';

export async function GET(request) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token || token === 'null' || token === 'undefined') {
      return NextResponse.json({ error: 'No valid token provided' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // Get restaurant payment methods
    const restaurant = await Restaurant.findById(decoded.restaurantId)
      .select('paymentMethods bankDetails');

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Format payment methods data
    const paymentMethods = [
      {
        id: 'bank_transfer',
        type: 'Bank Transfer',
        details: restaurant.bankDetails || {
          accountNumber: '**** **** 1234',
          bankName: 'Not configured',
          accountHolder: 'Not configured'
        },
        isDefault: true,
        status: restaurant.bankDetails ? 'active' : 'pending_setup'
      },
      {
        id: 'digital_wallet',
        type: 'Digital Wallet',
        details: {
          provider: 'eSewa',
          accountId: '**** 5678'
        },
        isDefault: false,
        status: 'active'
      }
    ];

    return NextResponse.json({ paymentMethods });

  } catch (error) {
    console.error('Payment methods API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token || token === 'null' || token === 'undefined') {
      return NextResponse.json({ error: 'No valid token provided' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const { type, details, isDefault } = await request.json();

    // Update restaurant payment methods
    const updateData = {};
    if (type === 'bank_transfer') {
      updateData.bankDetails = details;
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      decoded.restaurantId,
      updateData,
      { new: true }
    );

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Payment method updated successfully',
      paymentMethod: {
        type,
        details,
        isDefault,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Payment methods update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
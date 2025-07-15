import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';

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
    const { type = 'order-confirmed' } = body;

    // Create a test notification
    const testNotification = await Notification.createOrderNotification(
      user.id,
      type,
      {
        orderId: '507f1f77bcf86cd799439011', // Mock order ID
        orderNumber: 'TEST-001',
        restaurantName: 'Test Restaurant',
        restaurantId: '507f1f77bcf86cd799439012', // Mock restaurant ID
        estimatedTime: 30,
        deliveryPersonName: 'John Doe',
        deliveryPersonPhone: '+1234567890',
        cancellationReason: 'Test cancellation reason'
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Test notification created successfully',
      notification: testNotification
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification test endpoint',
      availableTypes: [
        'order-confirmed',
        'order-preparing', 
        'order-ready',
        'order-out-for-delivery',
        'order-delivered',
        'order-cancelled',
        'order-time-updated'
      ],
      usage: {
        method: 'POST',
        body: {
          type: 'order-confirmed' // or any other type
        }
      }
    });
  } catch (error) {
    console.error('Test notification GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
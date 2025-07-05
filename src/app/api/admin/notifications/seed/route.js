import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authenticate, adminOnly } from '@/middleware/auth';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const sampleNotifications = [
      {
        user: user._id,
        title: 'New Order Received',
        message: 'Order #ORD-2024-001 has been placed by John Doe for $45.99',
        type: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        user: user._id,
        title: 'Restaurant Approved',
        message: 'Spice Garden Restaurant has been approved and is now live on the platform',
        type: 'success',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        user: user._id,
        title: 'Payment Received',
        message: 'Payment of $67.50 received for order #ORD-2024-002',
        type: 'success',
        isRead: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        user: user._id,
        title: 'System Maintenance',
        message: 'Scheduled maintenance will begin at 2:00 AM tonight. Expected downtime: 30 minutes',
        type: 'warning',
        isRead: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        user: user._id,
        title: 'New User Registration',
        message: 'Sarah Wilson has registered on the platform',
        type: 'info',
        isRead: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000)
      },
      {
        user: user._id,
        title: 'Order Cancelled',
        message: 'Order #ORD-2024-003 has been cancelled by the customer',
        type: 'warning',
        isRead: true,
        createdAt: new Date(Date.now() - 90 * 60 * 1000)
      },
      {
        user: user._id,
        title: 'New Review Submitted',
        message: 'Mike Johnson left a 5-star review for Italian Bistro',
        type: 'info',
        isRead: true,
        createdAt: new Date(Date.now() - 120 * 60 * 1000)
      },
      {
        user: user._id,
        title: 'Dish Added',
        message: 'Margherita Pizza has been added to Italian Bistro menu',
        type: 'info',
        isRead: true,
        createdAt: new Date(Date.now() - 180 * 60 * 1000)
      },
      {
        user: user._id,
        title: 'Low Stock Alert',
        message: 'Chicken Tikka Masala is running low in stock at Spice Garden',
        type: 'warning',
        isRead: false,
        createdAt: new Date(Date.now() - 240 * 60 * 1000)
      },
      {
        user: user._id,
        title: 'Monthly Report Ready',
        message: 'Your monthly analytics report for November 2024 is ready for download',
        type: 'info',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    await Notification.deleteMany({ user: user._id });
    
    const createdNotifications = await Notification.insertMany(sampleNotifications);

    return NextResponse.json({
      success: true,
      message: `${createdNotifications.length} sample notifications created successfully`,
      notifications: createdNotifications
    });

  } catch (error) {
    console.error('Error seeding notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const result = await Notification.deleteMany({ user: user._id });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} notifications deleted successfully`
    });

  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
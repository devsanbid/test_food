import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authenticate, adminOnly } from '@/middleware/auth';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const query = { user: user._id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('user', 'firstName lastName email');

    const totalNotifications = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      user: user._id, 
      isRead: false 
    });

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalNotifications / limit),
        totalNotifications,
        hasMore: page * limit < totalNotifications
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { title, message, type, targetUserId } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Title and message are required' },
        { status: 400 }
      );
    }

    const notification = new Notification({
      user: targetUserId || user._id,
      title,
      message,
      type: type || 'general',
      isRead: false
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { action, notificationIds } = await request.json();

    if (action === 'markAsRead') {
      if (notificationIds && notificationIds.length > 0) {
        await Notification.updateMany(
          { 
            _id: { $in: notificationIds },
            user: user._id 
          },
          { isRead: true, readAt: new Date() }
        );
      } else {
        await Notification.updateMany(
          { user: user._id },
          { isRead: true, readAt: new Date() }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notifications marked as read'
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
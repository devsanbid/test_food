import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authenticate, adminOnly } from '@/middleware/auth';

export async function GET(request, { params }) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { id } = params;
    
    const notification = await Notification.findOne({
      _id: id,
      user: user._id
    }).populate('user', 'firstName lastName email');
    
    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { id } = params;
    const { isRead } = await request.json();
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: user._id },
      { 
        isRead: isRead !== undefined ? isRead : true,
        readAt: isRead !== false ? new Date() : null
      },
      { new: true }
    );
    
    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully',
      notification
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { id } = params;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
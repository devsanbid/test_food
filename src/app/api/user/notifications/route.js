import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import Notification from '@/models/Notification';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Get user's notifications with filtering and pagination
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
    
    // Extract query parameters
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const isRead = searchParams.get('isRead');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = { user: user.id };

    // Type filter
    if (type) {
      query.type = { $in: type.split(',') };
    }

    // Status filter
    if (status) {
      query.status = { $in: status.split(',') };
    }

    // Priority filter
    if (priority) {
      query.priority = { $in: priority.split(',') };
    }

    // Read status filter
    if (isRead !== null && isRead !== '') {
      query.isRead = isRead === 'true';
    }

    // Exclude expired notifications
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    let sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const notifications = await Notification.find(query)
      .populate('relatedData.order', 'orderNumber status')
      .populate('relatedData.restaurant', 'name logo')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments(query);
    const totalPages = Math.ceil(totalNotifications / limit);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(user.id);

    // Get notification statistics
    const stats = await Notification.aggregate([
      { $match: { user: mongoose.Types.ObjectId(user.id) } },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          },
          typeCounts: {
            $push: '$type'
          },
          priorityCounts: {
            $push: '$priority'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalNotifications: 1,
          unreadCount: 1,
          typeCounts: {
            'order-update': {
              $size: {
                $filter: {
                  input: '$typeCounts',
                  cond: { $eq: ['$$this', 'order-update'] }
                }
              }
            },
            'order-confirmed': {
              $size: {
                $filter: {
                  input: '$typeCounts',
                  cond: { $eq: ['$$this', 'order-confirmed'] }
                }
              }
            },
            'order-cancelled': {
              $size: {
                $filter: {
                  input: '$typeCounts',
                  cond: { $eq: ['$$this', 'order-cancelled'] }
                }
              }
            },
            'order-delivered': {
              $size: {
                $filter: {
                  input: '$typeCounts',
                  cond: { $eq: ['$$this', 'order-delivered'] }
                }
              }
            },
            'promotion': {
              $size: {
                $filter: {
                  input: '$typeCounts',
                  cond: { $eq: ['$$this', 'promotion'] }
                }
              }
            },
            'security-alert': {
              $size: {
                $filter: {
                  input: '$typeCounts',
                  cond: { $eq: ['$$this', 'security-alert'] }
                }
              }
            },
            'system': {
              $size: {
                $filter: {
                  input: '$typeCounts',
                  cond: { $eq: ['$$this', 'system'] }
                }
              }
            }
          },
          priorityCounts: {
            low: {
              $size: {
                $filter: {
                  input: '$priorityCounts',
                  cond: { $eq: ['$$this', 'low'] }
                }
              }
            },
            medium: {
              $size: {
                $filter: {
                  input: '$priorityCounts',
                  cond: { $eq: ['$$this', 'medium'] }
                }
              }
            },
            high: {
              $size: {
                $filter: {
                  input: '$priorityCounts',
                  cond: { $eq: ['$$this', 'high'] }
                }
              }
            },
            urgent: {
              $size: {
                $filter: {
                  input: '$priorityCounts',
                  cond: { $eq: ['$$this', 'urgent'] }
                }
              }
            }
          }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotifications,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        unreadCount,
        stats: stats[0] || {
          totalNotifications: 0,
          unreadCount: 0,
          typeCounts: {
            'order-update': 0,
            'order-confirmed': 0,
            'order-cancelled': 0,
            'order-delivered': 0,
            'promotion': 0,
            'security-alert': 0,
            'system': 0
          },
          priorityCounts: {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Mark notifications as read/unread
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
    const { action, notificationIds } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'mark-read':
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { success: false, message: 'Notification IDs array is required' },
            { status: 400 }
          );
        }

        // Validate notification IDs
        const invalidIds = notificationIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
          return NextResponse.json(
            { success: false, message: 'Invalid notification IDs provided' },
            { status: 400 }
          );
        }

        // Mark notifications as read
        const readResult = await Notification.updateMany(
          {
            _id: { $in: notificationIds },
            user: user.id
          },
          {
            $set: {
              isRead: true,
              readAt: new Date()
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: `${readResult.modifiedCount} notifications marked as read`,
          data: { modifiedCount: readResult.modifiedCount }
        });

      case 'mark-unread':
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { success: false, message: 'Notification IDs array is required' },
            { status: 400 }
          );
        }

        // Validate notification IDs
        const invalidUnreadIds = notificationIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidUnreadIds.length > 0) {
          return NextResponse.json(
            { success: false, message: 'Invalid notification IDs provided' },
            { status: 400 }
          );
        }

        // Mark notifications as unread
        const unreadResult = await Notification.updateMany(
          {
            _id: { $in: notificationIds },
            user: user.id
          },
          {
            $set: {
              isRead: false
            },
            $unset: {
              readAt: 1
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: `${unreadResult.modifiedCount} notifications marked as unread`,
          data: { modifiedCount: unreadResult.modifiedCount }
        });

      case 'mark-all-read':
        // Mark all user's notifications as read
        const allReadResult = await Notification.markAllAsRead(user.id);

        return NextResponse.json({
          success: true,
          message: `${allReadResult.modifiedCount} notifications marked as read`,
          data: { modifiedCount: allReadResult.modifiedCount }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notifications
export async function DELETE(request) {
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
    const notificationIds = searchParams.get('ids');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll) {
      // Delete all user's notifications (except high priority ones)
      const deleteResult = await Notification.deleteMany({
        user: user.id,
        priority: { $ne: 'urgent' }
      });

      return NextResponse.json({
        success: true,
        message: `${deleteResult.deletedCount} notifications deleted`,
        data: { deletedCount: deleteResult.deletedCount }
      });
    }

    if (!notificationIds) {
      return NextResponse.json(
        { success: false, message: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    const idsArray = notificationIds.split(',');
    
    // Validate notification IDs
    const invalidIds = idsArray.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification IDs provided' },
        { status: 400 }
      );
    }

    // Delete notifications (except urgent ones)
    const deleteResult = await Notification.deleteMany({
      _id: { $in: idsArray },
      user: user.id,
      priority: { $ne: 'urgent' }
    });

    return NextResponse.json({
      success: true,
      message: `${deleteResult.deletedCount} notifications deleted`,
      data: { deletedCount: deleteResult.deletedCount }
    });
  } catch (error) {
    console.error('Notifications deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
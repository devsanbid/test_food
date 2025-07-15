import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';

// GET /api/restaurant/notifications - Get restaurant notifications
export async function GET(request) {
  try {
    const user = await authenticate(request);
    await connectDB();
    
    request.user = user;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    const userId = request.user.id;

    switch (action) {
      case 'list':
        const filter = { user: userId };
        
        if (type) {
          filter.type = type;
        }
        
        if (isRead !== null && isRead !== undefined) {
          filter.isRead = isRead === 'true';
        }

        const skip = (page - 1) * limit;
        const [notifications, totalNotifications, unreadCount] = await Promise.all([
          Notification.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Notification.countDocuments(filter),
          Notification.countDocuments({ user: userId, isRead: false })
        ]);

        return NextResponse.json({
          success: true,
          notifications,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalNotifications / limit),
            totalItems: totalNotifications,
            hasNext: page < Math.ceil(totalNotifications / limit),
            hasPrev: page > 1
          },
          unreadCount
        });

      case 'stats':
        const stats = await Notification.aggregate([
          { $match: { user: userId } },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              unreadCount: {
                $sum: { $cond: ['$isRead', 0, 1] }
              }
            }
          },
          { $sort: { count: -1 } }
        ]);

        const totalStats = await Notification.aggregate([
          { $match: { user: userId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              unread: {
                $sum: { $cond: ['$isRead', 0, 1] }
              },
              today: {
                $sum: {
                  $cond: [
                    {
                      $gte: [
                        '$createdAt',
                        new Date(new Date().setHours(0, 0, 0, 0))
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ]);

        return NextResponse.json({
          success: true,
          stats: {
            byType: stats,
            total: totalStats[0] || { total: 0, unread: 0, today: 0 }
          }
        });

      case 'recent':
        const recentNotifications = await Notification.find({ user: userId })
          .limit(5)
          .sort({ createdAt: -1 })
          .select('type title message createdAt isRead');

        return NextResponse.json({
          success: true,
          notifications: recentNotifications
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant notifications GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurant/notifications - Update notification status
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    await connectDB();
    
    request.user = user;

    const { notificationId, action, ...updateData } = await request.json();
    const userId = request.user.id;

    switch (action) {
      case 'mark-read':
        if (!notificationId) {
          return NextResponse.json(
            { success: false, message: 'Notification ID is required' },
            { status: 400 }
          );
        }

        const notification = await Notification.findOneAndUpdate(
          { _id: notificationId, user: userId },
          { isRead: true, readAt: new Date() },
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
          message: 'Notification marked as read',
          notification
        });

      case 'mark-unread':
        if (!notificationId) {
          return NextResponse.json(
            { success: false, message: 'Notification ID is required' },
            { status: 400 }
          );
        }

        const unreadNotification = await Notification.findOneAndUpdate(
          { _id: notificationId, user: userId },
          { isRead: false, $unset: { readAt: 1 } },
          { new: true }
        );

        if (!unreadNotification) {
          return NextResponse.json(
            { success: false, message: 'Notification not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Notification marked as unread',
          notification: unreadNotification
        });

      case 'mark-all-read':
        const { type } = updateData;
        const filter = { user: userId, isRead: false };
        
        if (type) {
          filter.type = type;
        }

        const result = await Notification.updateMany(
          filter,
          { isRead: true, readAt: new Date() }
        );

        return NextResponse.json({
          success: true,
          message: `${result.modifiedCount} notifications marked as read`
        });

      case 'archive':
        if (!notificationId) {
          return NextResponse.json(
            { success: false, message: 'Notification ID is required' },
            { status: 400 }
          );
        }

        const archivedNotification = await Notification.findOneAndUpdate(
          { _id: notificationId, user: userId },
          { isArchived: true, archivedAt: new Date() },
          { new: true }
        );

        if (!archivedNotification) {
          return NextResponse.json(
            { success: false, message: 'Notification not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Notification archived',
          notification: archivedNotification
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant notifications PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/restaurant/notifications - Create or manage notifications
export async function POST(request) {
  try {
    const user = await authenticate(request);
    await connectDB();
    
    request.user = user;

    const { action, ...actionData } = await request.json();
    const userId = request.user.id;
    const restaurantId = request.user.restaurantId;

    switch (action) {
      case 'create-announcement':
        const { title, message, targetRoles, priority } = actionData;
        
        if (!title || !message) {
          return NextResponse.json(
            { success: false, message: 'Title and message are required' },
            { status: 400 }
          );
        }

        // Get target users based on roles
        const User = require('@/models/User');
        const targetFilter = { restaurantId };
        
        if (targetRoles && targetRoles.length > 0) {
          targetFilter.role = { $in: targetRoles };
        }

        const targetUsers = await User.find(targetFilter).select('_id');
        
        // Create notifications for all target users
        const notifications = targetUsers.map(user => ({
          user: user._id,
          type: 'announcement',
          title,
          message,
          priority: priority || 'normal',
          data: {
            restaurantId,
            createdBy: userId,
            targetRoles: targetRoles || ['all']
          }
        }));

        const createdNotifications = await Notification.insertMany(notifications);

        return NextResponse.json({
          success: true,
          message: `Announcement sent to ${createdNotifications.length} users`,
          notificationCount: createdNotifications.length
        });

      case 'bulk-delete':
        const { notificationIds } = actionData;
        
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { success: false, message: 'Notification IDs array is required' },
            { status: 400 }
          );
        }

        const deleteResult = await Notification.deleteMany({
          _id: { $in: notificationIds },
          user: userId
        });

        return NextResponse.json({
          success: true,
          message: `${deleteResult.deletedCount} notifications deleted`
        });

      case 'export-notifications':
        const { startDate, endDate, format = 'json' } = actionData;
        
        const exportFilter = { user: userId };
        
        if (startDate && endDate) {
          exportFilter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }

        const exportNotifications = await Notification.find(exportFilter)
          .sort({ createdAt: -1 })
          .select('type title message isRead createdAt readAt data');

        if (format === 'csv') {
          // Convert to CSV format
          const csvHeaders = 'Type,Title,Message,Is Read,Created At,Read At\n';
          const csvData = exportNotifications.map(notif => 
            `"${notif.type}","${notif.title}","${notif.message.replace(/"/g, '""')}","${notif.isRead}","${notif.createdAt}","${notif.readAt || ''}"`
          ).join('\n');
          
          return NextResponse.json({
            success: true,
            data: csvHeaders + csvData,
            format: 'csv',
            count: exportNotifications.length
          });
        }

        return NextResponse.json({
          success: true,
          data: exportNotifications,
          format: 'json',
          count: exportNotifications.length
        });

      case 'set-preferences':
        const { preferences } = actionData;
        
        if (!preferences || typeof preferences !== 'object') {
          return NextResponse.json(
            { success: false, message: 'Valid preferences object is required' },
            { status: 400 }
          );
        }

        // Update user notification preferences
        const User = require('@/models/User');
        await User.findByIdAndUpdate(userId, {
          notificationPreferences: preferences
        });

        return NextResponse.json({
          success: true,
          message: 'Notification preferences updated',
          preferences
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant notifications POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurant/notifications - Delete notifications
export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');
    const deleteAll = searchParams.get('deleteAll');
    const olderThan = searchParams.get('olderThan'); // days
    
    const userId = request.user.id;

    if (notificationId) {
      // Delete specific notification
      const deletedNotification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId
      });

      if (!deletedNotification) {
        return NextResponse.json(
          { success: false, message: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    }

    if (deleteAll === 'true') {
      // Delete all notifications for user
      const deleteFilter = { user: userId };
      
      if (olderThan) {
        const cutoffDate = new Date(Date.now() - parseInt(olderThan) * 24 * 60 * 60 * 1000);
        deleteFilter.createdAt = { $lt: cutoffDate };
      }

      const result = await Notification.deleteMany(deleteFilter);

      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} notifications deleted`
      });
    }

    return NextResponse.json(
      { success: false, message: 'No valid delete operation specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Restaurant notifications DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
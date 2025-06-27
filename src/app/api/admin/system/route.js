import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import Review from '@/models/Review';
import Notification from '@/models/Notification';

// GET /api/admin/system - Get system information and health
export async function GET(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'health';

    switch (action) {
      case 'health':
        // System health check
        const healthData = {
          status: 'healthy',
          timestamp: new Date(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          environment: process.env.NODE_ENV || 'development'
        };

        // Database health
        try {
          const dbStats = await Promise.all([
            User.countDocuments(),
            Restaurant.countDocuments(),
            Order.countDocuments(),
            Review.countDocuments()
          ]);
          
          healthData.database = {
            status: 'connected',
            collections: {
              users: dbStats[0],
              restaurants: dbStats[1],
              orders: dbStats[2],
              reviews: dbStats[3]
            }
          };
        } catch (dbError) {
          healthData.database = {
            status: 'error',
            error: dbError.message
          };
          healthData.status = 'degraded';
        }

        return NextResponse.json({
          success: true,
          health: healthData
        });

      case 'stats':
        // System statistics
        const [userStats, restaurantStats, orderStats, reviewStats] = await Promise.all([
          User.aggregate([
            {
              $group: {
                _id: '$role',
                count: { $sum: 1 },
                active: { $sum: { $cond: ['$isActive', 1, 0] } }
              }
            }
          ]),
          Restaurant.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: ['$isActive', 1, 0] } },
                verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
              }
            }
          ]),
          Order.aggregate([
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$totalAmount' }
              }
            }
          ]),
          Review.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                flagged: { $sum: { $cond: ['$isFlagged', 1, 0] } }
              }
            }
          ])
        ]);

        return NextResponse.json({
          success: true,
          stats: {
            users: userStats,
            restaurants: restaurantStats[0] || { total: 0, active: 0, verified: 0 },
            orders: orderStats,
            reviews: reviewStats[0] || { total: 0, averageRating: 0, flagged: 0 }
          }
        });

      case 'logs':
        const logLevel = searchParams.get('level') || 'all';
        const limit = parseInt(searchParams.get('limit')) || 100;
        
        // Mock log data - in a real application, you'd fetch from your logging system
        const logs = [
          {
            timestamp: new Date(),
            level: 'info',
            message: 'System health check completed',
            source: 'health-monitor'
          },
          {
            timestamp: new Date(Date.now() - 60000),
            level: 'warn',
            message: 'High memory usage detected',
            source: 'memory-monitor'
          },
          {
            timestamp: new Date(Date.now() - 120000),
            level: 'error',
            message: 'Database connection timeout',
            source: 'database'
          }
        ];

        const filteredLogs = logLevel === 'all' 
          ? logs 
          : logs.filter(log => log.level === logLevel);

        return NextResponse.json({
          success: true,
          logs: filteredLogs.slice(0, limit)
        });

      case 'performance':
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        // Mock performance data
        const performanceData = {
          responseTime: {
            average: 250,
            p95: 500,
            p99: 1000
          },
          throughput: {
            requestsPerSecond: 45,
            ordersPerHour: 120
          },
          errorRate: 0.02,
          availability: 99.9,
          period: {
            start: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: endDate || new Date()
          }
        };

        return NextResponse.json({
          success: true,
          performance: performanceData
        });

      case 'config':
        // System configuration (sanitized)
        const config = {
          environment: process.env.NODE_ENV,
          features: {
            notifications: true,
            analytics: true,
            payments: true,
            delivery: true
          },
          limits: {
            maxOrdersPerUser: 10,
            maxRestaurantsPerOwner: 3,
            maxFileUploadSize: '10MB'
          },
          maintenance: {
            scheduled: false,
            nextWindow: null
          }
        };

        return NextResponse.json({
          success: true,
          config
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin system GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/system - Update system settings
export async function PUT(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { action, ...updateData } = await request.json();

    switch (action) {
      case 'maintenance-mode':
        const { enabled, message, scheduledStart, scheduledEnd } = updateData;
        
        // In a real application, you'd store this in a configuration collection
        const maintenanceConfig = {
          enabled: enabled || false,
          message: message || 'System is under maintenance. Please try again later.',
          scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
          updatedBy: request.user.id,
          updatedAt: new Date()
        };

        // Send notifications to all users about maintenance
        if (enabled) {
          const users = await User.find({ isActive: true }).select('_id');
          const notifications = users.map(user => ({
            user: user._id,
            type: 'system_maintenance',
            title: 'System Maintenance',
            message: maintenanceConfig.message,
            priority: 'high',
            data: {
              scheduledStart: maintenanceConfig.scheduledStart,
              scheduledEnd: maintenanceConfig.scheduledEnd
            }
          }));

          await Notification.insertMany(notifications);
        }

        return NextResponse.json({
          success: true,
          message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
          config: maintenanceConfig
        });

      case 'update-limits':
        const { limits } = updateData;
        
        if (!limits || typeof limits !== 'object') {
          return NextResponse.json(
            { success: false, message: 'Valid limits object is required' },
            { status: 400 }
          );
        }

        // In a real application, you'd store this in a configuration collection
        const updatedLimits = {
          maxOrdersPerUser: limits.maxOrdersPerUser || 10,
          maxRestaurantsPerOwner: limits.maxRestaurantsPerOwner || 3,
          maxFileUploadSize: limits.maxFileUploadSize || '10MB',
          updatedBy: request.user.id,
          updatedAt: new Date()
        };

        return NextResponse.json({
          success: true,
          message: 'System limits updated successfully',
          limits: updatedLimits
        });

      case 'toggle-feature':
        const { feature, enabled: featureEnabled } = updateData;
        
        if (!feature) {
          return NextResponse.json(
            { success: false, message: 'Feature name is required' },
            { status: 400 }
          );
        }

        const validFeatures = ['notifications', 'analytics', 'payments', 'delivery'];
        if (!validFeatures.includes(feature)) {
          return NextResponse.json(
            { success: false, message: 'Invalid feature name' },
            { status: 400 }
          );
        }

        // In a real application, you'd store this in a configuration collection
        const featureConfig = {
          [feature]: featureEnabled,
          updatedBy: request.user.id,
          updatedAt: new Date()
        };

        return NextResponse.json({
          success: true,
          message: `Feature '${feature}' ${featureEnabled ? 'enabled' : 'disabled'}`,
          config: featureConfig
        });

      case 'clear-cache':
        const { cacheType } = updateData;
        
        // Mock cache clearing - in a real application, you'd clear actual caches
        const clearedCaches = [];
        
        if (!cacheType || cacheType === 'all') {
          clearedCaches.push('user-sessions', 'restaurant-data', 'menu-items', 'order-cache');
        } else {
          clearedCaches.push(cacheType);
        }

        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
          clearedCaches,
          timestamp: new Date()
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin system PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/system - System operations
export async function POST(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { action, ...actionData } = await request.json();

    switch (action) {
      case 'backup-database':
        const { includeUserData, includeOrderHistory } = actionData;
        
        // Mock backup process - in a real application, you'd create actual backups
        const backupId = `backup_${Date.now()}`;
        const backupData = {
          id: backupId,
          timestamp: new Date(),
          size: '245MB',
          collections: [],
          status: 'completed'
        };

        if (includeUserData) {
          backupData.collections.push('users', 'restaurants');
        }
        
        if (includeOrderHistory) {
          backupData.collections.push('orders', 'reviews');
        }

        return NextResponse.json({
          success: true,
          message: 'Database backup completed',
          backup: backupData
        });

      case 'send-system-notification':
        const { title, message, targetUsers, priority } = actionData;
        
        if (!title || !message) {
          return NextResponse.json(
            { success: false, message: 'Title and message are required' },
            { status: 400 }
          );
        }

        let userFilter = { isActive: true };
        
        if (targetUsers === 'admins') {
          userFilter.role = 'admin';
        } else if (targetUsers === 'restaurants') {
          userFilter.role = 'restaurant';
        } else if (targetUsers === 'customers') {
          userFilter.role = 'user';
        }

        const users = await User.find(userFilter).select('_id');
        
        const notifications = users.map(user => ({
          user: user._id,
          type: 'system_announcement',
          title,
          message,
          priority: priority || 'normal',
          data: {
            sentBy: request.user.id,
            targetGroup: targetUsers || 'all'
          }
        }));

        await Notification.insertMany(notifications);

        return NextResponse.json({
          success: true,
          message: `System notification sent to ${notifications.length} users`
        });

      case 'cleanup-data':
        const { dataType, olderThan } = actionData;
        
        if (!dataType || !olderThan) {
          return NextResponse.json(
            { success: false, message: 'Data type and age threshold are required' },
            { status: 400 }
          );
        }

        const cutoffDate = new Date(Date.now() - parseInt(olderThan) * 24 * 60 * 60 * 1000);
        let deletedCount = 0;

        switch (dataType) {
          case 'notifications':
            const deleteResult = await Notification.deleteMany({
              createdAt: { $lt: cutoffDate },
              isRead: true
            });
            deletedCount = deleteResult.deletedCount;
            break;

          case 'logs':
            // Mock log cleanup
            deletedCount = Math.floor(Math.random() * 1000);
            break;

          case 'sessions':
            // Mock session cleanup
            deletedCount = Math.floor(Math.random() * 100);
            break;

          default:
            return NextResponse.json(
              { success: false, message: 'Invalid data type' },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: true,
          message: `Cleaned up ${deletedCount} ${dataType} records`,
          deletedCount,
          cutoffDate
        });

      case 'generate-report':
        const { reportType, period, format } = actionData;
        
        if (!reportType) {
          return NextResponse.json(
            { success: false, message: 'Report type is required' },
            { status: 400 }
          );
        }

        const reportData = {
          id: `report_${Date.now()}`,
          type: reportType,
          period: period || 'last-30-days',
          format: format || 'json',
          generatedAt: new Date(),
          generatedBy: request.user.id
        };

        switch (reportType) {
          case 'system-health':
            reportData.data = {
              uptime: process.uptime(),
              memoryUsage: process.memoryUsage(),
              activeConnections: Math.floor(Math.random() * 100),
              errorRate: Math.random() * 0.05
            };
            break;

          case 'user-activity':
            const userActivityStats = await User.aggregate([
              {
                $group: {
                  _id: '$role',
                  count: { $sum: 1 },
                  active: { $sum: { $cond: ['$isActive', 1, 0] } }
                }
              }
            ]);
            reportData.data = userActivityStats;
            break;

          case 'performance':
            reportData.data = {
              averageResponseTime: Math.floor(Math.random() * 500) + 100,
              requestsPerSecond: Math.floor(Math.random() * 100) + 20,
              errorRate: Math.random() * 0.02,
              availability: 99.5 + Math.random() * 0.5
            };
            break;

          default:
            return NextResponse.json(
              { success: false, message: 'Invalid report type' },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: true,
          message: 'Report generated successfully',
          report: reportData
        });

      case 'run-diagnostics':
        // Mock diagnostic tests
        const diagnostics = {
          timestamp: new Date(),
          tests: [
            {
              name: 'Database Connection',
              status: 'passed',
              duration: 45,
              details: 'Connection established successfully'
            },
            {
              name: 'Memory Usage',
              status: 'passed',
              duration: 12,
              details: 'Memory usage within normal limits'
            },
            {
              name: 'API Endpoints',
              status: 'passed',
              duration: 234,
              details: 'All endpoints responding correctly'
            },
            {
              name: 'External Services',
              status: 'warning',
              duration: 567,
              details: 'Payment gateway response time elevated'
            }
          ],
          summary: {
            total: 4,
            passed: 3,
            failed: 0,
            warnings: 1
          }
        };

        return NextResponse.json({
          success: true,
          message: 'System diagnostics completed',
          diagnostics
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin system POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
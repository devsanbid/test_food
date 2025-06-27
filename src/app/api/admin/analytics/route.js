import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import Review from '@/models/Review';
import Notification from '@/models/Notification';

// GET /api/admin/analytics - Get comprehensive analytics
export async function GET(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    // Calculate date range based on period
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const now = new Date();
      let daysBack;
      switch (period) {
        case '7d': daysBack = 7; break;
        case '30d': daysBack = 30; break;
        case '90d': daysBack = 90; break;
        case '1y': daysBack = 365; break;
        default: daysBack = 30;
      }
      dateFilter.createdAt = {
        $gte: new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000),
        $lte: now
      };
    }

    switch (action) {
      case 'dashboard':
        const [overviewStats, revenueData, userGrowth, orderTrends] = await Promise.all([
          // Overview statistics
          Promise.all([
            User.countDocuments(),
            Restaurant.countDocuments(),
            Order.countDocuments(),
            Review.countDocuments(),
            Order.aggregate([
              { $match: { status: 'delivered' } },
              { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.countDocuments({ status: 'delivered' }),
            Order.countDocuments({ status: 'cancelled' })
          ]),
          
          // Revenue data by day
          Order.aggregate([
            { $match: { ...dateFilter, status: 'delivered' } },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]),
          
          // User growth
          User.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                newUsers: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]),
          
          // Order trends by status
          Order.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  status: '$status',
                  date: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.date.year': 1, '_id.date.month': 1, '_id.date.day': 1 } }
          ])
        ]);

        const [totalUsers, totalRestaurants, totalOrders, totalReviews, totalRevenueResult, deliveredOrders, cancelledOrders] = overviewStats;
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        return NextResponse.json({
          success: true,
          dashboard: {
            overview: {
              totalUsers,
              totalRestaurants,
              totalOrders,
              totalReviews,
              totalRevenue,
              deliveredOrders,
              cancelledOrders,
              conversionRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : 0
            },
            revenueData,
            userGrowth,
            orderTrends
          }
        });

      case 'revenue':
        const [revenueByPeriod, revenueByRestaurant, revenueByHour, topEarningDays] = await Promise.all([
          // Revenue by time period
          Order.aggregate([
            { $match: { ...dateFilter, status: 'delivered' } },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  week: { $week: '$createdAt' }
                },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 },
                avgOrderValue: { $avg: '$totalAmount' }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
          ]),
          
          // Revenue by restaurant
          Order.aggregate([
            { $match: { ...dateFilter, status: 'delivered' } },
            {
              $group: {
                _id: '$restaurant',
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 },
                avgOrderValue: { $avg: '$totalAmount' }
              }
            },
            {
              $lookup: {
                from: 'restaurants',
                localField: '_id',
                foreignField: '_id',
                as: 'restaurant'
              }
            },
            { $unwind: '$restaurant' },
            {
              $project: {
                restaurantName: '$restaurant.name',
                revenue: 1,
                orders: 1,
                avgOrderValue: { $round: ['$avgOrderValue', 2] }
              }
            },
            { $sort: { revenue: -1 } },
            { $limit: 20 }
          ]),
          
          // Revenue by hour of day
          Order.aggregate([
            { $match: { ...dateFilter, status: 'delivered' } },
            {
              $group: {
                _id: { $hour: '$createdAt' },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ]),
          
          // Top earning days
          Order.aggregate([
            { $match: { ...dateFilter, status: 'delivered' } },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
              }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
          ])
        ]);

        return NextResponse.json({
          success: true,
          revenue: {
            byPeriod: revenueByPeriod,
            byRestaurant: revenueByRestaurant,
            byHour: revenueByHour,
            topEarningDays
          }
        });

      case 'users':
        const [userStats, userActivity, userRetention, topCustomers] = await Promise.all([
          // User statistics
          User.aggregate([
            {
              $group: {
                _id: '$role',
                count: { $sum: 1 },
                active: { $sum: { $cond: ['$isActive', 1, 0] } },
                verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
              }
            }
          ]),
          
          // User activity (orders per user)
          User.aggregate([
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'user',
                as: 'orders'
              }
            },
            {
              $project: {
                orderCount: { $size: '$orders' },
                totalSpent: {
                  $sum: {
                    $map: {
                      input: { $filter: { input: '$orders', cond: { $eq: ['$$this.status', 'delivered'] } } },
                      as: 'order',
                      in: '$$order.totalAmount'
                    }
                  }
                },
                lastOrderDate: { $max: '$orders.createdAt' }
              }
            },
            {
              $group: {
                _id: null,
                avgOrdersPerUser: { $avg: '$orderCount' },
                avgSpentPerUser: { $avg: '$totalSpent' },
                activeUsers: {
                  $sum: {
                    $cond: [
                      { $gte: ['$lastOrderDate', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]),
          
          // User retention (repeat customers)
          User.aggregate([
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'user',
                as: 'orders'
              }
            },
            {
              $project: {
                orderCount: { $size: '$orders' }
              }
            },
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$orderCount', 0] }, then: 'No orders' },
                      { case: { $eq: ['$orderCount', 1] }, then: 'One-time' },
                      { case: { $lte: ['$orderCount', 5] }, then: 'Regular' },
                      { case: { $gt: ['$orderCount', 5] }, then: 'Loyal' }
                    ],
                    default: 'Unknown'
                  }
                },
                count: { $sum: 1 }
              }
            }
          ]),
          
          // Top customers
          User.aggregate([
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'user',
                as: 'orders'
              }
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
                orderCount: { $size: '$orders' },
                totalSpent: {
                  $sum: {
                    $map: {
                      input: { $filter: { input: '$orders', cond: { $eq: ['$$this.status', 'delivered'] } } },
                      as: 'order',
                      in: '$$order.totalAmount'
                    }
                  }
                },
                lastOrderDate: { $max: '$orders.createdAt' }
              }
            },
            { $match: { orderCount: { $gt: 0 } } },
            { $sort: { totalSpent: -1 } },
            { $limit: 20 }
          ])
        ]);

        return NextResponse.json({
          success: true,
          users: {
            stats: userStats,
            activity: userActivity[0] || {},
            retention: userRetention,
            topCustomers
          }
        });

      case 'restaurants':
        const [restaurantPerformance, cuisinePopularity, restaurantGrowth, restaurantIssues] = await Promise.all([
          // Restaurant performance
          Restaurant.aggregate([
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'restaurant',
                as: 'orders'
              }
            },
            {
              $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'restaurant',
                as: 'reviews'
              }
            },
            {
              $project: {
                name: 1,
                isActive: 1,
                isVerified: 1,
                rating: 1,
                totalOrders: { $size: '$orders' },
                deliveredOrders: {
                  $size: {
                    $filter: {
                      input: '$orders',
                      cond: { $eq: ['$$this.status', 'delivered'] }
                    }
                  }
                },
                totalRevenue: {
                  $sum: {
                    $map: {
                      input: { $filter: { input: '$orders', cond: { $eq: ['$$this.status', 'delivered'] } } },
                      as: 'order',
                      in: '$$order.totalAmount'
                    }
                  }
                },
                avgRating: { $avg: '$reviews.rating' },
                reviewCount: { $size: '$reviews' }
              }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 50 }
          ]),
          
          // Cuisine popularity
          Restaurant.aggregate([
            { $unwind: '$cuisine' },
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'restaurant',
                as: 'orders'
              }
            },
            {
              $group: {
                _id: '$cuisine',
                restaurantCount: { $sum: 1 },
                totalOrders: { $sum: { $size: '$orders' } },
                avgRating: { $avg: '$rating' }
              }
            },
            { $sort: { totalOrders: -1 } }
          ]),
          
          // Restaurant growth
          Restaurant.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                newRestaurants: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ]),
          
          // Restaurant issues (low ratings, complaints)
          Restaurant.aggregate([
            {
              $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'restaurant',
                as: 'reviews'
              }
            },
            {
              $project: {
                name: 1,
                rating: 1,
                lowRatingReviews: {
                  $size: {
                    $filter: {
                      input: '$reviews',
                      cond: { $lte: ['$$this.rating', 2] }
                    }
                  }
                },
                flaggedReviews: {
                  $size: {
                    $filter: {
                      input: '$reviews',
                      cond: { $gt: [{ $size: { $ifNull: ['$$this.flags', []] } }, 0] }
                    }
                  }
                },
                totalReviews: { $size: '$reviews' }
              }
            },
            {
              $match: {
                $or: [
                  { rating: { $lt: 3 } },
                  { lowRatingReviews: { $gt: 5 } },
                  { flaggedReviews: { $gt: 0 } }
                ]
              }
            },
            { $sort: { rating: 1 } },
            { $limit: 20 }
          ])
        ]);

        return NextResponse.json({
          success: true,
          restaurants: {
            performance: restaurantPerformance,
            cuisinePopularity,
            growth: restaurantGrowth,
            issues: restaurantIssues
          }
        });

      case 'orders':
        const [orderMetrics, deliveryPerformance, orderPatterns, cancellationAnalysis] = await Promise.all([
          // Order metrics
          Order.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgAmount: { $avg: '$totalAmount' },
                totalAmount: { $sum: '$totalAmount' }
              }
            }
          ]),
          
          // Delivery performance
          Order.aggregate([
            {
              $match: {
                ...dateFilter,
                status: 'delivered',
                deliveredAt: { $exists: true }
              }
            },
            {
              $project: {
                deliveryTime: {
                  $divide: [
                    { $subtract: ['$deliveredAt', '$createdAt'] },
                    1000 * 60 // Convert to minutes
                  ]
                },
                estimatedTime: '$estimatedDeliveryTime'
              }
            },
            {
              $group: {
                _id: null,
                avgDeliveryTime: { $avg: '$deliveryTime' },
                onTimeDeliveries: {
                  $sum: {
                    $cond: [
                      { $lte: ['$deliveryTime', '$estimatedTime'] },
                      1,
                      0
                    ]
                  }
                },
                totalDeliveries: { $sum: 1 }
              }
            }
          ]),
          
          // Order patterns (by hour, day of week)
          Order.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  hour: { $hour: '$createdAt' },
                  dayOfWeek: { $dayOfWeek: '$createdAt' }
                },
                orderCount: { $sum: 1 },
                avgAmount: { $avg: '$totalAmount' }
              }
            },
            { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
          ]),
          
          // Cancellation analysis
          Order.aggregate([
            {
              $match: {
                ...dateFilter,
                status: 'cancelled',
                'cancellation.reason': { $exists: true }
              }
            },
            {
              $group: {
                _id: '$cancellation.reason',
                count: { $sum: 1 },
                avgRefund: { $avg: '$cancellation.refundAmount' }
              }
            },
            { $sort: { count: -1 } }
          ])
        ]);

        return NextResponse.json({
          success: true,
          orders: {
            metrics: orderMetrics,
            deliveryPerformance: deliveryPerformance[0] || {},
            patterns: orderPatterns,
            cancellationAnalysis
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin analytics GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/analytics - Generate custom reports
export async function POST(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { reportType, filters, format = 'json' } = await request.json();

    switch (reportType) {
      case 'financial':
        const { startDate, endDate, groupBy = 'day' } = filters;
        
        let groupStage;
        switch (groupBy) {
          case 'hour':
            groupStage = {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
              hour: { $hour: '$createdAt' }
            };
            break;
          case 'day':
            groupStage = {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            };
            break;
          case 'month':
            groupStage = {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            };
            break;
          default:
            groupStage = {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            };
        }

        const financialData = await Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              },
              status: 'delivered'
            }
          },
          {
            $group: {
              _id: groupStage,
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
              avgOrderValue: { $avg: '$totalAmount' },
              deliveryFees: { $sum: '$deliveryFee' },
              taxes: { $sum: '$tax' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
        ]);

        if (format === 'csv') {
          const csvHeaders = 'Date,Revenue,Orders,Avg Order Value,Delivery Fees,Taxes\n';
          const csvData = financialData.map(item => {
            const date = groupBy === 'hour' 
              ? `${item._id.year}-${item._id.month}-${item._id.day} ${item._id.hour}:00`
              : groupBy === 'month'
              ? `${item._id.year}-${item._id.month}`
              : `${item._id.year}-${item._id.month}-${item._id.day}`;
            return `${date},${item.revenue},${item.orders},${item.avgOrderValue.toFixed(2)},${item.deliveryFees},${item.taxes}`;
          }).join('\n');
          
          return new NextResponse(csvHeaders + csvData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="financial-report.csv"'
            }
          });
        }

        return NextResponse.json({
          success: true,
          report: {
            type: 'financial',
            data: financialData,
            summary: {
              totalRevenue: financialData.reduce((sum, item) => sum + item.revenue, 0),
              totalOrders: financialData.reduce((sum, item) => sum + item.orders, 0),
              avgOrderValue: financialData.reduce((sum, item) => sum + item.avgOrderValue, 0) / financialData.length
            }
          }
        });

      case 'performance':
        const performanceData = await Restaurant.aggregate([
          {
            $lookup: {
              from: 'orders',
              localField: '_id',
              foreignField: 'restaurant',
              as: 'orders'
            }
          },
          {
            $lookup: {
              from: 'reviews',
              localField: '_id',
              foreignField: 'restaurant',
              as: 'reviews'
            }
          },
          {
            $project: {
              name: 1,
              cuisine: 1,
              rating: 1,
              isActive: 1,
              isVerified: 1,
              totalOrders: { $size: '$orders' },
              deliveredOrders: {
                $size: {
                  $filter: {
                    input: '$orders',
                    cond: { $eq: ['$$this.status', 'delivered'] }
                  }
                }
              },
              cancelledOrders: {
                $size: {
                  $filter: {
                    input: '$orders',
                    cond: { $eq: ['$$this.status', 'cancelled'] }
                  }
                }
              },
              totalRevenue: {
                $sum: {
                  $map: {
                    input: { $filter: { input: '$orders', cond: { $eq: ['$$this.status', 'delivered'] } } },
                    as: 'order',
                    in: '$$order.totalAmount'
                  }
                }
              },
              avgRating: { $avg: '$reviews.rating' },
              reviewCount: { $size: '$reviews' }
            }
          },
          {
            $addFields: {
              successRate: {
                $cond: [
                  { $gt: ['$totalOrders', 0] },
                  { $multiply: [{ $divide: ['$deliveredOrders', '$totalOrders'] }, 100] },
                  0
                ]
              }
            }
          },
          { $sort: { totalRevenue: -1 } }
        ]);

        return NextResponse.json({
          success: true,
          report: {
            type: 'performance',
            data: performanceData
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid report type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin analytics POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
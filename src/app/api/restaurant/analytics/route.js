import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import connectDB from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import Review from '@/models/Review';
import User from '@/models/User';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);

    await connectDB();

    const restaurant = await Restaurant.findOne({ owner: user.id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range') || 'week';

    const now = new Date();
    let currentPeriodStart, previousPeriodStart, previousPeriodEnd;

    switch (dateRange) {
      case 'week':
        currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
      case 'month':
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'year':
        currentPeriodStart = new Date(now.getFullYear(), 0, 1);
        previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        previousPeriodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
    }

    const [currentMetrics, previousMetrics] = await Promise.all([
      getMetrics(restaurant._id, currentPeriodStart, now),
      getMetrics(restaurant._id, previousPeriodStart, previousPeriodEnd)
    ]);

    const analytics = {
      revenue: {
        current: currentMetrics.revenue,
        previous: previousMetrics.revenue,
        change: calculatePercentageChange(currentMetrics.revenue, previousMetrics.revenue)
      },
      orders: {
        current: currentMetrics.orders,
        previous: previousMetrics.orders,
        change: calculatePercentageChange(currentMetrics.orders, previousMetrics.orders)
      },
      customers: {
        current: currentMetrics.customers,
        previous: previousMetrics.customers,
        change: calculatePercentageChange(currentMetrics.customers, previousMetrics.customers)
      },
      rating: {
        current: currentMetrics.rating,
        previous: previousMetrics.rating,
        change: calculatePercentageChange(currentMetrics.rating, previousMetrics.rating)
      }
    };

    const chartData = await getChartData(restaurant._id, dateRange, currentPeriodStart, now);
    const topDishes = await getTopDishes(restaurant._id, currentPeriodStart, now);
    const recentReviews = await getRecentReviews(restaurant._id);
    const hourlyData = await getHourlyData(restaurant._id, currentPeriodStart, now);

    return NextResponse.json({
      success: true,
      analytics,
      chartData,
      topDishes,
      recentReviews,
      hourlyData
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getMetrics(restaurantId, startDate, endDate) {
  console.log('Analytics Debug - Restaurant ID:', restaurantId);
  console.log('Analytics Debug - Date Range:', { startDate, endDate });
  
  const totalOrders = await Order.countDocuments({ restaurant: restaurantId });
  const deliveredOrders = await Order.countDocuments({ restaurant: restaurantId, status: 'delivered' });
  const ordersInRange = await Order.countDocuments({ 
    restaurant: restaurantId, 
    createdAt: { $gte: startDate, $lte: endDate } 
  });
  const deliveredInRange = await Order.countDocuments({ 
    restaurant: restaurantId, 
    status: 'delivered',
    createdAt: { $gte: startDate, $lte: endDate } 
  });
  
  console.log('Analytics Debug - Total orders for restaurant:', totalOrders);
  console.log('Analytics Debug - Delivered orders for restaurant:', deliveredOrders);
  console.log('Analytics Debug - Orders in date range:', ordersInRange);
  console.log('Analytics Debug - Delivered orders in date range:', deliveredInRange);
  
  const [revenueResult, ordersCount, customersResult, ratingResult] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' }
        }
      }
    ]),
    Order.countDocuments({
      restaurant: restaurantId,
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$customer'
        }
      },
      {
        $count: 'uniqueCustomers'
      }
    ]),
    Review.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.overall' }
        }
      }
    ])
  ]);

  const revenue = revenueResult[0]?.total || 0;
  console.log('Analytics Debug - Revenue calculation result:', revenueResult);
  console.log('Analytics Debug - Final revenue:', revenue);
  
  const allOrderStatuses = await Order.aggregate([
    { $match: { restaurant: restaurantId } },
    { $group: { _id: '$status', count: { $sum: 1 }, totalRevenue: { $sum: '$pricing.total' } } },
    { $sort: { count: -1 } }
  ]);
  console.log('Analytics Debug - All order statuses for restaurant:', allOrderStatuses);
  
  return {
    revenue: revenue,
    orders: ordersCount,
    customers: customersResult[0]?.uniqueCustomers || 0,
    rating: ratingResult[0]?.avgRating || 0
  };
}

async function getChartData(restaurantId, dateRange, startDate, endDate) {
  let groupBy, labels;
  
  switch (dateRange) {
    case 'week':
      groupBy = {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$createdAt'
        }
      };
      labels = generateWeekLabels(startDate);
      break;
    case 'month':
      groupBy = {
        $dateToString: {
          format: '%Y-%U',
          date: '$createdAt'
        }
      };
      labels = generateMonthLabels(startDate);
      break;
    case 'year':
      groupBy = {
        $dateToString: {
          format: '%Y-%m',
          date: '$createdAt'
        }
      };
      labels = generateYearLabels();
      break;
  }

  const chartResults = await Order.aggregate([
    {
      $match: {
        restaurant: restaurantId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: groupBy,
        revenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'delivered'] },
              '$pricing.total',
              0
            ]
          }
        },
        orders: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  const chartMap = new Map(chartResults.map(item => [item._id, item]));
  
  return labels.map(label => ({
    label: label.display,
    revenue: chartMap.get(label.key)?.revenue || 0,
    orders: chartMap.get(label.key)?.orders || 0
  }));
}

async function getTopDishes(restaurantId, startDate, endDate) {
  const topDishes = await Order.aggregate([
    {
      $match: {
        restaurant: restaurantId,
        status: 'delivered',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItem',
        name: { $first: '$items.name' },
        orders: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    {
      $lookup: {
        from: 'reviews',
        let: { dishName: '$name' },
        pipeline: [
          {
            $match: {
              restaurant: restaurantId,
              'orderDetails.items.name': '$$dishName'
            }
          },
          {
            $unwind: '$orderDetails.items'
          },
          {
            $match: {
              $expr: { $eq: ['$orderDetails.items.name', '$$dishName'] }
            }
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$orderDetails.items.rating' }
            }
          }
        ],
        as: 'ratingData'
      }
    },
    {
      $addFields: {
        rating: {
          $ifNull: [
            { $arrayElemAt: ['$ratingData.avgRating', 0] },
            4.0
          ]
        }
      }
    },
    { $sort: { orders: -1 } },
    { $limit: 5 }
  ]);

  return topDishes.map((dish, index) => {
    const change = Math.random() * 30 - 10;
    return {
      id: dish._id,
      name: dish.name,
      orders: dish.orders,
      revenue: dish.revenue,
      rating: Math.round(dish.rating * 10) / 10,
      trend: change >= 0 ? 'up' : 'down',
      change: Math.round(Math.abs(change) * 10) / 10
    };
  });
}

async function getRecentReviews(restaurantId) {
  const reviews = await Review.find({
    restaurant: restaurantId,
    moderationStatus: 'approved'
  })
  .populate('user', 'firstName lastName')
  .populate('order', 'items')
  .sort({ createdAt: -1 })
  .limit(3)
  .lean();

  return reviews.map(review => ({
    id: review._id,
    customerName: review.isAnonymous 
      ? 'Anonymous User' 
      : `${review.user.firstName} ${review.user.lastName}`,
    rating: review.rating.overall,
    comment: review.comment,
    dish: review.order.items[0]?.name || 'Multiple items',
    date: review.createdAt
  }));
}

async function getHourlyData(restaurantId, startDate, endDate) {
  const hourlyResults = await Order.aggregate([
    {
      $match: {
        restaurant: restaurantId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        orders: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'delivered'] },
              '$pricing.total',
              0
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const hourlyMap = new Map(hourlyResults.map(item => [item._id, item]));
  
  const hours = [];
  for (let i = 9; i <= 22; i++) {
    const data = hourlyMap.get(i) || { orders: 0, revenue: 0 };
    const hour12 = i > 12 ? i - 12 : i;
    const ampm = i >= 12 ? 'PM' : 'AM';
    
    hours.push({
      hour: `${hour12} ${ampm}`,
      orders: data.orders,
      revenue: data.revenue
    });
  }
  
  return hours;
}

function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function generateWeekLabels(startDate) {
  const labels = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    labels.push({
      key: date.toISOString().split('T')[0],
      display: days[date.getDay()]
    });
  }
  
  return labels;
}

function generateMonthLabels(startDate) {
  const labels = [];
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  
  for (let week = 1; week <= 4; week++) {
    const weekStart = new Date(year, month, (week - 1) * 7 + 1);
    labels.push({
      key: weekStart.toISOString().split('T')[0].substring(0, 7) + '-' + String(week).padStart(2, '0'),
      display: `Week ${week}`
    });
  }
  
  return labels;
}

function generateYearLabels() {
  const labels = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = new Date().getFullYear();
  
  for (let i = 0; i < 12; i++) {
    labels.push({
      key: `${year}-${String(i + 1).padStart(2, '0')}`,
      display: months[i]
    });
  }
  
  return labels;
}
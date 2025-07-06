import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

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

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate, groupBy;
    
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    // Get earnings data grouped by time period
    const earningsData = await Order.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(decoded.restaurantId),
          status: 'delivered',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          earnings: { $sum: '$total' },
          commission: { $sum: { $multiply: ['$total', 0.15] } },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Format data for chart
    const chartData = earningsData.map(item => {
      let label;
      if (range === 'week' || range === 'month') {
        label = `${item._id.month}/${item._id.day}`;
      } else {
        label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }
      
      return {
        period: label,
        earnings: item.earnings,
        commission: item.commission,
        netEarnings: item.earnings - item.commission,
        orders: item.orders
      };
    });

    return NextResponse.json({ chartData });

  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
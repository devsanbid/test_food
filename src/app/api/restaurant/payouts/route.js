import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authenticate } from '@/middleware/auth';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    // Authentication
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }

    const { user } = authResult;
    if (user.role !== 'restaurant') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Restaurant role required.' },
        { status: 403 }
      );
    }

    // Database connection
    await connectDB();

    // Query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const range = searchParams.get('range') || 'all';
    const status = searchParams.get('status') || 'all';

    // Restaurant lookup
    const restaurant = await Restaurant.findOne({ owner: user._id });
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Date filtering
    let dateFilter = {};
    const now = new Date();
    
    switch (range) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateFilter = {
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        };
        break;
      case 'week':
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: weekStart } };
        break;
      case 'month':
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: monthStart } };
        break;
      case 'year':
        const yearStart = new Date();
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: yearStart } };
        break;
      default:
        // 'all' - no date filter
        break;
    }

    // Total earnings calculation
    const totalEarningsResult = await Order.aggregate([
      {
        $match: {
          restaurant: restaurant._id,
          status: 'delivered',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    const totalEarnings = totalEarningsResult[0]?.total || 0;
    const commissionRate = 0.15; // 15% commission
    const commission = totalEarnings * commissionRate;
    const currentBalance = totalEarnings - commission;

    // Generate mock payout history for demonstration
    const mockPayoutHistory = [
      {
        id: 'PO-2024-001',
        netAmount: 450.75,
        status: 'completed',
        date: new Date('2024-01-15'),
        method: 'Bank Transfer'
      },
      {
        id: 'PO-2024-002',
        netAmount: 320.50,
        status: 'pending',
        date: new Date('2024-01-20'),
        method: 'Bank Transfer'
      },
      {
        id: 'PO-2024-003',
        netAmount: 275.25,
        status: 'processing',
        date: new Date('2024-01-25'),
        method: 'PayPal'
      }
    ];

    // Filter mock data based on status
    let filteredHistory = mockPayoutHistory;
    if (status !== 'all') {
      filteredHistory = mockPayoutHistory.filter(payout => payout.status === status);
    }

    // Calculate summary values
    const pendingPayouts = filteredHistory
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.netAmount, 0);
    
    const completedPayouts = filteredHistory
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.netAmount, 0);

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedHistory = filteredHistory.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings,
        commission,
        currentBalance,
        pendingPayouts,
        completedPayouts,
        commissionRate,
        payoutHistory: paginatedHistory,
        pagination: {
          page,
          limit,
          total: filteredHistory.length,
          pages: Math.ceil(filteredHistory.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Payouts fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
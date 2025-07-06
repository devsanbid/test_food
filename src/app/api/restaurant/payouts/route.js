import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authenticate } from '@/middleware/auth';
import Restaurant from '@/models/Restaurant';
import Order from '@/models/Order';
import Payout from '@/models/Payout';

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
    const exportData = searchParams.get('export') === 'true';

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

    // Handle export request
    if (exportData) {
      const payoutQuery = { restaurant: restaurant._id };
      if (status !== 'all') {
        payoutQuery.status = status;
      }
      if (range !== 'all' && dateFilter.createdAt) {
        payoutQuery.createdAt = dateFilter.createdAt;
      }
      
      const allPayouts = await Payout.find(payoutQuery)
        .sort({ createdAt: -1 });

      const csvData = allPayouts.map(payout => ({
        'Payout ID': payout.payoutId,
        'Net Amount': payout.netAmount,
        'Status': payout.status,
        'Payment Method': payout.paymentMethod?.type || '',
        'Date': payout.createdAt.toISOString().split('T')[0],
        'Reference': payout.reference
      }));

      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payouts-${range}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Fetch real payout history from the database
    const payoutQuery = { restaurant: restaurant._id };
    if (status !== 'all') {
      payoutQuery.status = status;
    }
    if (range !== 'all' && dateFilter.createdAt) {
      payoutQuery.createdAt = dateFilter.createdAt;
    }
    const totalPayouts = await Payout.countDocuments(payoutQuery);
    const payouts = await Payout.find(payoutQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Calculate summary values
    const pendingPayouts = await Payout.aggregate([
      { $match: { restaurant: restaurant._id, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]);
    const completedPayouts = await Payout.aggregate([
      { $match: { restaurant: restaurant._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings,
        commission,
        currentBalance,
        pendingPayouts: pendingPayouts[0]?.total || 0,
        completedPayouts: completedPayouts[0]?.total || 0,
        commissionRate,
        payoutHistory: payouts.map(p => ({
          id: p.payoutId,
          netAmount: p.netAmount,
          status: p.status,
          date: p.createdAt,
          method: p.paymentMethod?.type || '',
          reference: p.reference
        })),
        pagination: {
          page,
          limit,
          total: totalPayouts,
          pages: Math.ceil(totalPayouts / limit)
        }
      }
    });
  } catch (error) {
    console.error('Payouts fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
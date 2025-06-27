import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/middleware/auth';

export async function GET(request) {
  try {
    await connectDB();
    
    const user = await verifyToken(request);
    if (!user || user.role !== 'restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mockPayouts = [
      {
        id: 'PO001',
        amount: 1250.00,
        status: 'completed',
        date: new Date('2024-01-15'),
        method: 'Bank Transfer',
        reference: 'TXN123456789'
      },
      {
        id: 'PO002',
        amount: 890.50,
        status: 'pending',
        date: new Date('2024-01-10'),
        method: 'PayPal',
        reference: 'TXN987654321'
      },
      {
        id: 'PO003',
        amount: 2100.75,
        status: 'completed',
        date: new Date('2024-01-05'),
        method: 'Bank Transfer',
        reference: 'TXN456789123'
      }
    ];

    const totalEarnings = 15750.25;
    const pendingPayouts = 890.50;
    const completedPayouts = 14859.75;

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings,
        pendingPayouts,
        completedPayouts,
        payoutHistory: mockPayouts
      }
    });
  } catch (error) {
    console.error('Payouts fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
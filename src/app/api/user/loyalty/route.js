import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import Order from '@/models/Order';
import LoyaltyTransaction from '@/models/LoyaltyTransaction';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Helper function to calculate user level based on points
function calculateUserLevel(points) {
  if (points >= 10000) return { level: 'Platinum', nextLevel: null, pointsToNext: 0 };
  if (points >= 5000) return { level: 'Gold', nextLevel: 'Platinum', pointsToNext: 10000 - points };
  if (points >= 2000) return { level: 'Silver', nextLevel: 'Gold', pointsToNext: 5000 - points };
  if (points >= 500) return { level: 'Bronze', nextLevel: 'Silver', pointsToNext: 2000 - points };
  return { level: 'Member', nextLevel: 'Bronze', pointsToNext: 500 - points };
}

// Helper function to calculate points for order
function calculateOrderPoints(orderValue, userLevel) {
  const baseRate = 1; // 1 point per rupee
  let multiplier = 1;
  
  switch (userLevel) {
    case 'Bronze': multiplier = 1.2; break;
    case 'Silver': multiplier = 1.5; break;
    case 'Gold': multiplier = 2; break;
    case 'Platinum': multiplier = 3; break;
    default: multiplier = 1;
  }
  
  return Math.floor(orderValue * baseRate * multiplier);
}

// GET - Retrieve user loyalty information
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
    const includeTransactions = searchParams.get('includeTransactions') === 'true';
    const transactionType = searchParams.get('transactionType'); // earned, redeemed, expired
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    const userDoc = await User.findById(user.id).select('loyaltyPoints orderCount totalSpent createdAt');
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate user level and progress
    const currentPoints = userDoc.loyaltyPoints || 0;
    const levelInfo = calculateUserLevel(currentPoints);

    // Get loyalty statistics
    const loyaltyStats = await LoyaltyTransaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user.id) } },
      {
        $group: {
          _id: '$type',
          totalPoints: { $sum: '$points' },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      totalEarned: 0,
      totalRedeemed: 0,
      totalExpired: 0,
      transactionCount: 0
    };

    loyaltyStats.forEach(stat => {
      switch (stat._id) {
        case 'earned':
          stats.totalEarned = stat.totalPoints;
          break;
        case 'redeemed':
          stats.totalRedeemed = Math.abs(stat.totalPoints);
          break;
        case 'expired':
          stats.totalExpired = Math.abs(stat.totalPoints);
          break;
      }
      stats.transactionCount += stat.count;
    });

    // Get points expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringPoints = await LoyaltyTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user.id),
          type: 'earned',
          expiresAt: { $lte: thirtyDaysFromNow, $gt: new Date() },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalExpiring: { $sum: '$points' }
        }
      }
    ]);

    const pointsExpiringSoon = expiringPoints.length > 0 ? expiringPoints[0].totalExpiring : 0;

    // Calculate achievements
    const achievements = [];
    
    if (userDoc.orderCount >= 1) achievements.push({ name: 'First Order', description: 'Completed your first order', earned: true });
    if (userDoc.orderCount >= 10) achievements.push({ name: 'Regular Customer', description: 'Completed 10 orders', earned: true });
    if (userDoc.orderCount >= 50) achievements.push({ name: 'Loyal Customer', description: 'Completed 50 orders', earned: true });
    if (userDoc.orderCount >= 100) achievements.push({ name: 'VIP Customer', description: 'Completed 100 orders', earned: true });
    if (userDoc.totalSpent >= 10000) achievements.push({ name: 'Big Spender', description: 'Spent ₹10,000+', earned: true });
    if (levelInfo.level === 'Platinum') achievements.push({ name: 'Platinum Member', description: 'Reached Platinum level', earned: true });

    // Add upcoming achievements
    if (userDoc.orderCount < 10) achievements.push({ name: 'Regular Customer', description: 'Complete 10 orders', earned: false, progress: userDoc.orderCount, target: 10 });
    if (userDoc.orderCount < 50) achievements.push({ name: 'Loyal Customer', description: 'Complete 50 orders', earned: false, progress: userDoc.orderCount, target: 50 });
    if (userDoc.orderCount < 100) achievements.push({ name: 'VIP Customer', description: 'Complete 100 orders', earned: false, progress: userDoc.orderCount, target: 100 });

    const loyaltyData = {
      currentPoints,
      level: levelInfo.level,
      nextLevel: levelInfo.nextLevel,
      pointsToNextLevel: levelInfo.pointsToNext,
      levelProgress: levelInfo.nextLevel ? 
        ((currentPoints - (currentPoints - levelInfo.pointsToNext)) / levelInfo.pointsToNext) * 100 : 100,
      statistics: stats,
      pointsExpiringSoon,
      achievements,
      memberSince: userDoc.createdAt,
      totalOrders: userDoc.orderCount,
      totalSpent: userDoc.totalSpent || 0
    };

    // Include transaction history if requested
    if (includeTransactions) {
      const skip = (page - 1) * limit;
      
      let transactionQuery = { userId: new mongoose.Types.ObjectId(user.id) };
      
      if (transactionType) {
        transactionQuery.type = transactionType;
      }

      const transactions = await LoyaltyTransaction.find(transactionQuery)
        .populate('orderId', 'orderNumber total')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalTransactions = await LoyaltyTransaction.countDocuments(transactionQuery);

      loyaltyData.transactions = {
        data: transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTransactions / limit),
          totalTransactions,
          hasMore: skip + limit < totalTransactions
        }
      };
    }

    // Get available rewards/redemption options
    const availableRewards = [
      {
        id: 'discount_50',
        name: '₹50 Discount',
        description: 'Get ₹50 off on your next order',
        pointsRequired: 500,
        type: 'discount',
        value: 50,
        minOrderValue: 300,
        canRedeem: currentPoints >= 500
      },
      {
        id: 'discount_100',
        name: '₹100 Discount',
        description: 'Get ₹100 off on your next order',
        pointsRequired: 1000,
        type: 'discount',
        value: 100,
        minOrderValue: 600,
        canRedeem: currentPoints >= 1000
      },
      {
        id: 'free_delivery',
        name: 'Free Delivery',
        description: 'Free delivery on your next 3 orders',
        pointsRequired: 300,
        type: 'delivery',
        value: 3,
        canRedeem: currentPoints >= 300
      },
      {
        id: 'priority_support',
        name: 'Priority Support',
        description: '24/7 priority customer support for 1 month',
        pointsRequired: 2000,
        type: 'service',
        duration: '1 month',
        canRedeem: currentPoints >= 2000
      }
    ];

    loyaltyData.availableRewards = availableRewards;

    return NextResponse.json({
      success: true,
      data: loyaltyData
    });
  } catch (error) {
    console.error('Get loyalty info error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Redeem points or perform loyalty actions
export async function POST(request) {
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
    const { action, rewardId, points, orderId } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const currentPoints = userDoc.loyaltyPoints || 0;

    switch (action) {
      case 'redeem-reward':
        if (!rewardId) {
          return NextResponse.json(
            { success: false, message: 'Reward ID is required' },
            { status: 400 }
          );
        }

        // Define available rewards (in production, this would come from a database)
        const rewards = {
          'discount_50': { name: '₹50 Discount', points: 500, value: 50, type: 'discount' },
          'discount_100': { name: '₹100 Discount', points: 1000, value: 100, type: 'discount' },
          'free_delivery': { name: 'Free Delivery', points: 300, value: 3, type: 'delivery' },
          'priority_support': { name: 'Priority Support', points: 2000, value: 1, type: 'service' }
        };

        const reward = rewards[rewardId];
        if (!reward) {
          return NextResponse.json(
            { success: false, message: 'Invalid reward ID' },
            { status: 400 }
          );
        }

        if (currentPoints < reward.points) {
          return NextResponse.json(
            { success: false, message: 'Insufficient points for this reward' },
            { status: 400 }
          );
        }

        // Deduct points
        userDoc.loyaltyPoints = currentPoints - reward.points;
        
        // Create loyalty transaction
        const redeemTransaction = new LoyaltyTransaction({
          userId: user.id,
          type: 'redeemed',
          points: -reward.points,
          description: `Redeemed: ${reward.name}`,
          metadata: {
            rewardId,
            rewardType: reward.type,
            rewardValue: reward.value
          }
        });

        await Promise.all([
          userDoc.save(),
          redeemTransaction.save()
        ]);

        return NextResponse.json({
          success: true,
          message: `Successfully redeemed ${reward.name}`,
          data: {
            rewardRedeemed: reward,
            pointsDeducted: reward.points,
            remainingPoints: userDoc.loyaltyPoints,
            transactionId: redeemTransaction._id
          }
        });

      case 'earn-points':
        if (!points || !orderId) {
          return NextResponse.json(
            { success: false, message: 'Points and order ID are required' },
            { status: 400 }
          );
        }

        // Verify order exists and belongs to user
        const order = await Order.findOne({ _id: orderId, userId: user.id });
        if (!order) {
          return NextResponse.json(
            { success: false, message: 'Order not found' },
            { status: 404 }
          );
        }

        // Check if points already earned for this order
        const existingTransaction = await LoyaltyTransaction.findOne({
          userId: user.id,
          orderId: orderId,
          type: 'earned'
        });

        if (existingTransaction) {
          return NextResponse.json(
            { success: false, message: 'Points already earned for this order' },
            { status: 400 }
          );
        }

        // Calculate points based on user level
        const levelInfo = calculateUserLevel(currentPoints);
        const earnedPoints = calculateOrderPoints(order.total, levelInfo.level);

        // Add points to user
        userDoc.loyaltyPoints = currentPoints + earnedPoints;
        
        // Create loyalty transaction with expiry (1 year from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        const earnTransaction = new LoyaltyTransaction({
          userId: user.id,
          orderId: orderId,
          type: 'earned',
          points: earnedPoints,
          description: `Points earned from order #${order.orderNumber}`,
          expiresAt: expiryDate,
          metadata: {
            orderValue: order.total,
            userLevel: levelInfo.level,
            multiplier: earnedPoints / order.total
          }
        });

        await Promise.all([
          userDoc.save(),
          earnTransaction.save()
        ]);

        return NextResponse.json({
          success: true,
          message: `Earned ${earnedPoints} loyalty points`,
          data: {
            pointsEarned: earnedPoints,
            totalPoints: userDoc.loyaltyPoints,
            transactionId: earnTransaction._id,
            expiresAt: expiryDate
          }
        });

      case 'transfer-points':
        // This could be implemented for transferring points between users
        return NextResponse.json(
          { success: false, message: 'Point transfer not implemented yet' },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Loyalty action error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update loyalty preferences or settings
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
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { success: false, message: 'Preferences are required' },
        { status: 400 }
      );
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Initialize loyalty preferences if not exists
    if (!userDoc.loyaltyPreferences) {
      userDoc.loyaltyPreferences = {};
    }

    // Update allowed preference fields
    const allowedFields = [
      'emailNotifications',
      'smsNotifications',
      'pointExpiryReminders',
      'rewardRecommendations',
      'levelUpNotifications'
    ];

    allowedFields.forEach(field => {
      if (preferences[field] !== undefined) {
        userDoc.loyaltyPreferences[field] = preferences[field];
      }
    });

    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Loyalty preferences updated successfully',
      data: {
        preferences: userDoc.loyaltyPreferences
      }
    });
  } catch (error) {
    console.error('Update loyalty preferences error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
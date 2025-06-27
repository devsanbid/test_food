'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Star, Trophy, Calendar, ArrowRight, Clock, CheckCircle, Zap, Crown, Target } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function LoyaltyPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const [loyaltyData, setLoyaltyData] = useState({
    currentPoints: 1250,
    totalEarned: 3450,
    totalRedeemed: 2200,
    tier: 'Gold',
    nextTier: 'Platinum',
    pointsToNextTier: 750,
    lifetimeOrders: 47,
    memberSince: new Date('2023-01-15')
  });

  const [pointsHistory, setPointsHistory] = useState([
    {
      id: 1,
      type: 'earned',
      points: 50,
      description: 'Order #34562 - Ocean Delights',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      orderId: '34562'
    },
    {
      id: 2,
      type: 'redeemed',
      points: -100,
      description: 'Redeemed $5 discount coupon',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      couponCode: 'LOYALTY5'
    },
    {
      id: 3,
      type: 'earned',
      points: 35,
      description: 'Order #34561 - Italian Corner',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      orderId: '34561'
    },
    {
      id: 4,
      type: 'bonus',
      points: 200,
      description: 'Birthday bonus points',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 5,
      type: 'earned',
      points: 45,
      description: 'Order #34560 - Spice House',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      orderId: '34560'
    },
    {
      id: 6,
      type: 'redeemed',
      points: -200,
      description: 'Redeemed $10 discount coupon',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      couponCode: 'LOYALTY10'
    }
  ]);

  const [availableRewards, setAvailableRewards] = useState([
    {
      id: 1,
      title: '$5 Off Your Next Order',
      description: 'Get $5 discount on orders above $25',
      pointsCost: 100,
      type: 'discount',
      validFor: '30 days',
      minOrder: 25,
      icon: Gift
    },
    {
      id: 2,
      title: '$10 Off Your Next Order',
      description: 'Get $10 discount on orders above $50',
      pointsCost: 200,
      type: 'discount',
      validFor: '30 days',
      minOrder: 50,
      icon: Gift
    },
    {
      id: 3,
      title: 'Free Delivery',
      description: 'Free delivery on your next 3 orders',
      pointsCost: 150,
      type: 'delivery',
      validFor: '60 days',
      icon: Zap
    },
    {
      id: 4,
      title: '$25 Off Premium Orders',
      description: 'Get $25 discount on orders above $100',
      pointsCost: 500,
      type: 'discount',
      validFor: '45 days',
      minOrder: 100,
      icon: Crown
    },
    {
      id: 5,
      title: 'Double Points Weekend',
      description: 'Earn 2x points on all orders this weekend',
      pointsCost: 300,
      type: 'multiplier',
      validFor: '7 days',
      icon: Star
    },
    {
      id: 6,
      title: 'VIP Customer Status',
      description: 'Priority support and exclusive offers for 3 months',
      pointsCost: 1000,
      type: 'status',
      validFor: '90 days',
      icon: Trophy
    }
  ]);

  const [redeemedRewards, setRedeemedRewards] = useState([
    {
      id: 1,
      title: '$5 Off Your Next Order',
      couponCode: 'LOYALTY5-ABC123',
      redeemedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
      status: 'active',
      pointsUsed: 100
    },
    {
      id: 2,
      title: 'Free Delivery',
      couponCode: 'FREEDEL-XYZ789',
      redeemedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: 'active',
      pointsUsed: 150,
      usesLeft: 2,
      totalUses: 3
    },
    {
      id: 3,
      title: '$10 Off Your Next Order',
      couponCode: 'LOYALTY10-DEF456',
      redeemedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'expired',
      pointsUsed: 200
    }
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'user') {
          router.push('/login');
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Bronze': return 'text-amber-600';
      case 'Silver': return 'text-gray-400';
      case 'Gold': return 'text-yellow-500';
      case 'Platinum': return 'text-purple-400';
      case 'Diamond': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'Bronze': return Target;
      case 'Silver': return Star;
      case 'Gold': return Trophy;
      case 'Platinum': return Crown;
      case 'Diamond': return Crown;
      default: return Star;
    }
  };

  const redeemReward = (reward) => {
    if (loyaltyData.currentPoints < reward.pointsCost) {
      alert('Insufficient points to redeem this reward!');
      return;
    }

    const newRedemption = {
      id: redeemedRewards.length + 1,
      title: reward.title,
      couponCode: `${reward.type.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      redeemedDate: new Date(),
      expiryDate: new Date(Date.now() + parseInt(reward.validFor) * 24 * 60 * 60 * 1000),
      status: 'active',
      pointsUsed: reward.pointsCost,
      ...(reward.type === 'delivery' && { usesLeft: 3, totalUses: 3 })
    };

    setRedeemedRewards([newRedemption, ...redeemedRewards]);
    setLoyaltyData({
      ...loyaltyData,
      currentPoints: loyaltyData.currentPoints - reward.pointsCost,
      totalRedeemed: loyaltyData.totalRedeemed + reward.pointsCost
    });

    const newHistoryEntry = {
      id: pointsHistory.length + 1,
      type: 'redeemed',
      points: -reward.pointsCost,
      description: `Redeemed ${reward.title}`,
      date: new Date(),
      couponCode: newRedemption.couponCode
    };

    setPointsHistory([newHistoryEntry, ...pointsHistory]);
    alert(`Successfully redeemed ${reward.title}! Your coupon code is: ${newRedemption.couponCode}`);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const progressPercentage = ((2000 - loyaltyData.pointsToNextTier) / 2000) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Loyalty Rewards</h1>
          <p className="text-gray-400">Earn points with every order and unlock amazing rewards!</p>
        </div>

        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'rewards', label: 'Available Rewards' },
            { key: 'my_rewards', label: 'My Rewards' },
            { key: 'history', label: 'Points History' }
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md transition-colors text-sm ${
                activeTab === tab.key ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Points Summary */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{loyaltyData.currentPoints.toLocaleString()} Points</h2>
                  <p className="opacity-90">Available to redeem</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center ${getTierColor(loyaltyData.tier)}`}>
                    {React.createElement(getTierIcon(loyaltyData.tier), { className: 'w-8 h-8 mr-2' })}
                    <span className="text-2xl font-bold">{loyaltyData.tier}</span>
                  </div>
                  <p className="text-sm opacity-90">Member Tier</p>
                </div>
              </div>
            </div>

            {/* Tier Progress */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Progress to {loyaltyData.nextTier}</h3>
                <span className="text-sm text-gray-400">
                  {loyaltyData.pointsToNextTier} points to go
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>{loyaltyData.tier}</span>
                <span>{loyaltyData.nextTier}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {loyaltyData.totalEarned.toLocaleString()}
                </div>
                <p className="text-gray-400">Total Points Earned</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  {loyaltyData.totalRedeemed.toLocaleString()}
                </div>
                <p className="text-gray-400">Points Redeemed</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">
                  {loyaltyData.lifetimeOrders}
                </div>
                <p className="text-gray-400">Lifetime Orders</p>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">How Loyalty Points Work</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-8 h-8 text-orange-500" />
                  </div>
                  <h4 className="font-semibold mb-2">Earn Points</h4>
                  <p className="text-sm text-gray-400">Get 1 point for every $1 spent on orders</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-8 h-8 text-blue-500" />
                  </div>
                  <h4 className="font-semibold mb-2">Unlock Tiers</h4>
                  <p className="text-sm text-gray-400">Reach higher tiers for better rewards and perks</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="font-semibold mb-2">Redeem Rewards</h4>
                  <p className="text-sm text-gray-400">Use points for discounts and exclusive offers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRewards.map(reward => {
              const IconComponent = reward.icon;
              const canAfford = loyaltyData.currentPoints >= reward.pointsCost;
              
              return (
                <div key={reward.id} className={`bg-gray-800 rounded-lg p-6 border-2 transition-all ${
                  canAfford ? 'border-orange-500/50 hover:border-orange-500' : 'border-gray-700'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${
                      canAfford ? 'bg-orange-500/20' : 'bg-gray-700'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${
                        canAfford ? 'text-orange-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        canAfford ? 'text-orange-500' : 'text-gray-400'
                      }`}>
                        {reward.pointsCost} pts
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{reward.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{reward.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Valid for:</span>
                      <span>{reward.validFor}</span>
                    </div>
                    {reward.minOrder && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Min order:</span>
                        <span>${reward.minOrder}</span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => redeemReward(reward)}
                    disabled={!canAfford}
                    className={`w-full py-2 rounded-lg transition-colors ${
                      canAfford 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Redeem Now' : 'Insufficient Points'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'my_rewards' && (
          <div className="space-y-4">
            {redeemedRewards.length === 0 ? (
              <div className="text-center py-16">
                <Gift className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-semibold mb-2">No rewards redeemed yet</h2>
                <p className="text-gray-400">Start earning points and redeem amazing rewards!</p>
              </div>
            ) : (
              redeemedRewards.map(reward => (
                <div key={reward.id} className={`bg-gray-800 rounded-lg p-6 border-l-4 ${
                  reward.status === 'active' ? 'border-green-500' : 'border-gray-600'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold mr-3">{reward.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          reward.status === 'active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-600/20 text-gray-400'
                        }`}>
                          {reward.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="bg-gray-900 rounded p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Coupon Code:</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(reward.couponCode)}
                            className="font-mono text-orange-500 hover:text-orange-400 transition-colors"
                          >
                            {reward.couponCode}
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Redeemed:</span>
                          <p>{reward.redeemedDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Expires:</span>
                          <p className={reward.status === 'expired' ? 'text-red-400' : ''}>
                            {reward.expiryDate.toLocaleDateString()}
                          </p>
                        </div>
                        {reward.usesLeft !== undefined && (
                          <div>
                            <span className="text-gray-400">Uses left:</span>
                            <p>{reward.usesLeft} of {reward.totalUses}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Points used:</span>
                          <p>{reward.pointsUsed}</p>
                        </div>
                      </div>
                    </div>
                    
                    {reward.status === 'active' && (
                      <button className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors text-sm">
                        Use Now
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Points History</h2>
            
            {pointsHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No points history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pointsHistory.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        entry.type === 'earned' ? 'bg-green-500/20' :
                        entry.type === 'redeemed' ? 'bg-red-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {entry.type === 'earned' ? (
                          <ArrowRight className="w-5 h-5 text-green-500 rotate-180" />
                        ) : entry.type === 'redeemed' ? (
                          <ArrowRight className="w-5 h-5 text-red-500" />
                        ) : (
                          <Star className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{getTimeAgo(entry.date)}</span>
                          {entry.orderId && (
                            <span>Order #{entry.orderId}</span>
                          )}
                          {entry.couponCode && (
                            <span className="font-mono">{entry.couponCode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`text-lg font-semibold ${
                      entry.points > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {entry.points > 0 ? '+' : ''}{entry.points} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search, 
  Calendar, 
  ArrowLeft,
  Reply,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Send,
  MoreHorizontal,
  Flag,
  Eye
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { checkRestaurantProfileComplete, ProfileIncompleteMessage } from '@/lib/restaurantProfileUtils';

export default function RestaurantReviews() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {},
    recentTrend: 0,
    responseRate: 0,
    averageResponseTime: 0
  });
  
  const [reviews, setReviews] = useState([]);
  const router = useRouter();

  const tabs = [
    { id: 'all', name: 'All Reviews', count: 0 },
    { id: 'pending', name: 'Pending Response', count: 0 },
    { id: 'responded', name: 'Responded', count: 0 },
    { id: 'flagged', name: 'Flagged', count: 0 }
  ];

  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' }
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'restaurant') {
          router.push('/login');
          return;
        }
        setUser(userData);
        
        // Check if restaurant profile is complete
        const profileCheck = await checkRestaurantProfileComplete(userData.id);
        if (!profileCheck.isComplete) {
          setProfileIncomplete(true);
          setMissingFields(profileCheck.missingFields);
          setLoading(false);
          return;
        }
        
        // Mock review stats
        setReviewStats({
          averageRating: 4.6,
          totalReviews: 189,
          ratingDistribution: {
            5: 98,
            4: 52,
            3: 25,
            2: 10,
            1: 4
          },
          recentTrend: 0.2,
          responseRate: 85,
          averageResponseTime: 4.2
        });
        
        // Mock reviews data
        setReviews([
          {
            id: 'REV-001',
            customer: {
              name: 'Sarah Johnson',
              avatar: null,
              verified: true
            },
            rating: 5,
            title: 'Absolutely amazing food!',
            comment: 'The pasta was perfectly cooked and the service was exceptional. Will definitely order again!',
            date: new Date('2024-01-28'),
            orderItems: ['Spaghetti Carbonara', 'Caesar Salad'],
            helpful: 12,
            response: null,
            status: 'pending',
            flagged: false,
            verified: true
          },
          {
            id: 'REV-002',
            customer: {
              name: 'Mike Chen',
              avatar: null,
              verified: true
            },
            rating: 4,
            title: 'Great taste, slow delivery',
            comment: 'Food quality was excellent but delivery took longer than expected. The pizza was still hot though.',
            date: new Date('2024-01-27'),
            orderItems: ['Margherita Pizza', 'Garlic Bread'],
            helpful: 8,
            response: {
              text: 'Thank you for your feedback! We apologize for the delay and are working to improve our delivery times.',
              date: new Date('2024-01-27'),
              author: 'Restaurant Manager'
            },
            status: 'responded',
            flagged: false,
            verified: true
          },
          {
            id: 'REV-003',
            customer: {
              name: 'Emily Davis',
              avatar: null,
              verified: false
            },
            rating: 2,
            title: 'Disappointing experience',
            comment: 'The food was cold when it arrived and the portion sizes were smaller than expected. Not worth the price.',
            date: new Date('2024-01-26'),
            orderItems: ['Chicken Alfredo', 'Breadsticks'],
            helpful: 3,
            response: null,
            status: 'pending',
            flagged: true,
            verified: false
          },
          {
            id: 'REV-004',
            customer: {
              name: 'David Wilson',
              avatar: null,
              verified: true
            },
            rating: 5,
            title: 'Perfect dinner!',
            comment: 'Everything was perfect - from the appetizer to the dessert. The staff was friendly and the atmosphere was great.',
            date: new Date('2024-01-25'),
            orderItems: ['Grilled Salmon', 'Chocolate Cake'],
            helpful: 15,
            response: {
              text: 'Thank you so much for the wonderful review! We\'re thrilled you enjoyed your dining experience.',
              date: new Date('2024-01-25'),
              author: 'Restaurant Manager'
            },
            status: 'responded',
            flagged: false,
            verified: true
          },
          {
            id: 'REV-005',
            customer: {
              name: 'Lisa Brown',
              avatar: null,
              verified: true
            },
            rating: 3,
            title: 'Average experience',
            comment: 'Food was okay, nothing special. Service was friendly but could be faster.',
            date: new Date('2024-01-24'),
            orderItems: ['Burger', 'Fries'],
            helpful: 5,
            response: null,
            status: 'pending',
            flagged: false,
            verified: true
          },
          {
            id: 'REV-006',
            customer: {
              name: 'John Smith',
              avatar: null,
              verified: true
            },
            rating: 4,
            title: 'Good food, great service',
            comment: 'Really enjoyed the meal. The staff was attentive and the food came out quickly.',
            date: new Date('2024-01-23'),
            orderItems: ['Steak', 'Mashed Potatoes'],
            helpful: 9,
            response: {
              text: 'Thank you for choosing us! We appreciate your kind words about our service.',
              date: new Date('2024-01-23'),
              author: 'Restaurant Manager'
            },
            status: 'responded',
            flagged: false,
            verified: true
          }
        ]);
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Update tab counts
  useEffect(() => {
    const pendingCount = reviews.filter(r => r.status === 'pending').length;
    const respondedCount = reviews.filter(r => r.status === 'responded').length;
    const flaggedCount = reviews.filter(r => r.flagged).length;
    
    tabs[0].count = reviews.length;
    tabs[1].count = pendingCount;
    tabs[2].count = respondedCount;
    tabs[3].count = flaggedCount;
  }, [reviews]);

  const renderStars = (rating, size = 'sm') => {
    const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'responded': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(date);
  };

  const filteredReviews = reviews.filter(review => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pending' && review.status === 'pending') ||
                      (activeTab === 'responded' && review.status === 'responded') ||
                      (activeTab === 'flagged' && review.flagged);
    
    const matchesSearch = review.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    
    return matchesTab && matchesSearch && matchesRating;
  });

  const handleReply = (review) => {
    setSelectedReview(review);
    setReplyText('');
    setShowReplyModal(true);
  };

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    
    // Update the review with the response
    setReviews(prev => prev.map(review => 
      review.id === selectedReview.id 
        ? {
            ...review,
            response: {
              text: replyText,
              date: new Date(),
              author: 'Restaurant Manager'
            },
            status: 'responded'
          }
        : review
    ));
    
    setShowReplyModal(false);
    setSelectedReview(null);
    setReplyText('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show profile incomplete message if profile is not complete
  if (profileIncomplete) {
    return <ProfileIncompleteMessage missingFields={missingFields} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/restaurant/dashboard" className="flex items-center space-x-2 text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <Star className="h-6 w-6 text-yellow-500" />
                <span className="text-xl font-bold">Reviews & Ratings</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold">{reviewStats.averageRating}</span>
                <span className="text-gray-400">({reviewStats.totalReviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              {reviewStats.recentTrend > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-1">{reviewStats.averageRating}</h3>
            <p className="text-gray-400 text-sm">Average Rating</p>
            <p className={`text-xs mt-2 ${
              reviewStats.recentTrend > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {reviewStats.recentTrend > 0 ? '+' : ''}{reviewStats.recentTrend} from last month
            </p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-400" />
              </div>
              <MessageSquare className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{reviewStats.totalReviews}</h3>
            <p className="text-gray-400 text-sm">Total Reviews</p>
            <p className="text-blue-400 text-xs mt-2">+12 this month</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Reply className="h-6 w-6 text-green-400" />
              </div>
              <Reply className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{reviewStats.responseRate}%</h3>
            <p className="text-gray-400 text-sm">Response Rate</p>
            <p className="text-green-400 text-xs mt-2">+5% from last month</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
              <Clock className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{reviewStats.averageResponseTime}h</h3>
            <p className="text-gray-400 text-sm">Avg Response Time</p>
            <p className="text-orange-400 text-xs mt-2">-1.2h from last month</p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-semibold mb-6">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = reviewStats.ratingDistribution[rating] || 0;
              const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 w-20">
                    <span className="text-sm">{rating}</span>
                    <Star className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400 w-12">{count}</span>
                  <span className="text-sm text-gray-400 w-12">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-xl mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {ratingOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {dateOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <button className="flex items-center space-x-2 text-orange-400 hover:text-orange-300">
              <Filter className="h-4 w-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.map(review => (
            <div key={review.id} className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-300" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{review.customer.name}</h4>
                      {review.customer.verified && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                      {review.flagged && (
                        <Flag className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mb-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-400">{formatTimeAgo(review.date)}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                        {review.status === 'responded' ? 'Responded' : 'Pending Response'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-white p-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium mb-2">{review.title}</h5>
                <p className="text-gray-300 mb-3">{review.comment}</p>
                
                {review.orderItems && review.orderItems.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">Order items:</p>
                    <div className="flex flex-wrap gap-2">
                      {review.orderItems.map((item, index) => (
                        <span key={index} className="bg-gray-700/50 text-xs px-2 py-1 rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <button className="flex items-center space-x-1 hover:text-white">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Helpful ({review.helpful})</span>
                  </button>
                </div>
              </div>
              
              {review.response ? (
                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">R</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.response.author}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(review.response.date)}</p>
                    </div>
                  </div>
                  <p className="text-gray-300">{review.response.text}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400">No response yet</p>
                  <button
                    onClick={() => handleReply(review)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Reply className="h-4 w-4" />
                    <span>Reply</span>
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {filteredReviews.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No reviews found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more reviews.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Reply to Review</h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            {/* Original Review */}
            <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-300" />
                </div>
                <div>
                  <p className="font-medium">{selectedReview.customer.name}</p>
                  <div className="flex items-center space-x-2">
                    {renderStars(selectedReview.rating, 'sm')}
                    <span className="text-sm text-gray-400">{formatDate(selectedReview.date)}</span>
                  </div>
                </div>
              </div>
              <h5 className="font-medium mb-2">{selectedReview.title}</h5>
              <p className="text-gray-300">{selectedReview.comment}</p>
            </div>
            
            {/* Reply Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Response</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a professional and helpful response..."
                  rows={4}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Tip: Thank the customer and address their concerns professionally.
                </p>
                <div className="text-sm text-gray-400">
                  {replyText.length}/500
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowReplyModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReply}
                disabled={!replyText.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>Send Reply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ThumbsUp, ThumbsDown, Filter, Search, Calendar, MapPin, Clock, Edit, Trash2, Camera } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { toast } from 'react-hot-toast';

export default function ReviewsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my_reviews');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();

  const [pendingReviews, setPendingReviews] = useState([]);

  const [myReviews, setMyReviews] = useState([]);

  const [newReview, setNewReview] = useState({
    rating: 0,
    foodRating: 0,
    deliveryRating: 0,
    comment: '',
    images: []
  });

  const fetchPendingReviews = async () => {
    try {
      const response = await fetch('/api/user/orders?status=delivered&hasReview=false', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const pending = data.data.orders.map(order => ({
            id: order._id,
            orderId: order.orderNumber,
            restaurantName: order.restaurant.name,
            restaurantImage: order.restaurant.logo || '/placeholder-food.jpg',
            items: order.items.map(item => item.name),
            deliveredAt: new Date(order.actualDeliveryTime || order.updatedAt),
            totalAmount: order.pricing.total
          }));
          setPendingReviews(pending);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pending reviews:', error);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const response = await fetch('/api/user/reviews', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const reviews = data.data.reviews.map(review => ({
            id: review._id,
            orderId: review.order.orderNumber,
            restaurantName: review.restaurant.name,
            restaurantImage: review.restaurant.logo || '/placeholder-food.jpg',
            items: review.orderDetails?.items?.map(item => item.name) || [],
            rating: review.rating.overall,
            foodRating: review.rating.food,
            deliveryRating: review.rating.delivery,
            comment: review.comment,
            images: review.images || [],
            helpful: review.helpfulVotes,
            reviewDate: new Date(review.createdAt),
            restaurantReply: review.response?.message || null
          }));
          setMyReviews(reviews);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'user') {
          router.push('/login');
          return;
        }
        setUser(userData);
        await Promise.all([fetchPendingReviews(), fetchMyReviews()]);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const StarRating = ({ rating, onRatingChange, readonly = false, size = 'w-5 h-5' }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange && onRatingChange(star)}
            className={`${size} ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            disabled={readonly}
          >
            <Star 
              className={`w-full h-full ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
              }`} 
            />
          </button>
        ))}
      </div>
    );
  };

  const openReviewModal = (order) => {
    setSelectedOrder(order);
    setNewReview({
      rating: 0,
      foodRating: 0,
      deliveryRating: 0,
      comment: '',
      images: []
    });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (newReview.rating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    try {
      const response = await fetch('/api/user/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          restaurantId: selectedOrder.restaurantId,
          orderId: selectedOrder.id,
          rating: {
            overall: newReview.rating,
            food: newReview.foodRating || newReview.rating,
            service: newReview.rating,
            delivery: newReview.deliveryRating || newReview.rating
          },
          comment: newReview.comment,
          images: newReview.images
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await Promise.all([fetchPendingReviews(), fetchMyReviews()]);
          setShowReviewModal(false);
          setSelectedOrder(null);
          alert('Review submitted successfully!');
        } else {
          alert(data.message || 'Failed to submit review');
        }
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  const filteredReviews = myReviews.filter(review => {
    const matchesSearch = review.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         review.comment.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRating = filterRating === 'all' || review.rating.toString() === filterRating;
    
    return matchesSearch && matchesRating;
  });

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

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
          <h1 className="text-3xl font-bold mb-2">Reviews & Ratings</h1>
          <p className="text-gray-400">Share your experience and help others make better choices</p>
        </div>

        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { key: 'my_reviews', label: `My Reviews (${myReviews.length})` },
            { key: 'pending', label: `Pending Reviews (${pendingReviews.length})` }
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

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-semibold mb-2">No pending reviews</h2>
                <p className="text-gray-400">All your recent orders have been reviewed!</p>
              </div>
            ) : (
              pendingReviews.map(order => (
                <div key={order.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4">
                      <img 
                        src={order.restaurantImage} 
                        alt={order.restaurantName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{order.restaurantName}</h3>
                        <p className="text-gray-400 text-sm mb-2">Order #{order.orderId}</p>
                        <div className="flex items-center text-sm text-gray-400 mb-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Delivered {getTimeAgo(order.deliveredAt)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, index) => (
                            <span key={index} className="bg-gray-700 px-2 py-1 rounded text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold mb-2">${order.totalAmount}</p>
                      <button 
                        onClick={() => openReviewModal(order)}
                        className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Write Review
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'my_reviews' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-orange-500"
                />
              </div>
              <select 
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div className="space-y-6">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-16">
                  <Star className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                  <h2 className="text-2xl font-semibold mb-2">No reviews found</h2>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredReviews.map(review => (
                  <div key={review.id} className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex space-x-4">
                        <img 
                          src={review.restaurantImage} 
                          alt={review.restaurantName}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{review.restaurantName}</h3>
                          <p className="text-gray-400 text-sm mb-2">Order #{review.orderId}</p>
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{review.reviewDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-gray-700 rounded transition-colors text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Overall Rating</p>
                        <StarRating rating={review.rating} readonly />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Food Quality</p>
                        <StarRating rating={review.foodRating} readonly />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Delivery</p>
                        <StarRating rating={review.deliveryRating} readonly />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {review.items.map((item, index) => (
                        <span key={index} className="bg-gray-700 px-2 py-1 rounded text-sm">
                          {item}
                        </span>
                      ))}
                    </div>

                    {review.comment && (
                      <p className="text-gray-300 mb-4">{review.comment}</p>
                    )}

                    {review.images.length > 0 && (
                      <div className="flex space-x-2 mb-4">
                        {review.images.map((image, index) => (
                          <img 
                            key={index}
                            src={image} 
                            alt={`Review image ${index + 1}`}
                            className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 hover:text-white transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{review.helpful} helpful</span>
                        </button>
                      </div>
                      <span>{getTimeAgo(review.reviewDate)}</span>
                    </div>

                    {review.restaurantReply && (
                      <div className="mt-4 bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-semibold">R</span>
                          </div>
                          <span className="font-semibold text-sm">{review.restaurantName} replied:</span>
                        </div>
                        <p className="text-gray-300 text-sm">{review.restaurantReply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Write a Review</h2>
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <img 
                  src={selectedOrder.restaurantImage} 
                  alt={selectedOrder.restaurantName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-xl font-semibold">{selectedOrder.restaurantName}</h3>
                  <p className="text-gray-400">Order #{selectedOrder.orderId}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Overall Rating *</label>
                  <StarRating 
                    rating={newReview.rating} 
                    onRatingChange={(rating) => setNewReview({...newReview, rating})} 
                    size="w-8 h-8"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Food Quality</label>
                    <StarRating 
                      rating={newReview.foodRating} 
                      onRatingChange={(rating) => setNewReview({...newReview, foodRating: rating})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Experience</label>
                    <StarRating 
                      rating={newReview.deliveryRating} 
                      onRatingChange={(rating) => setNewReview({...newReview, deliveryRating: rating})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Review</label>
                  <textarea 
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    placeholder="Share your experience with this order..."
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Add Photos (Optional)</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400 text-sm">Click to upload photos of your food</p>
                    <input type="file" multiple accept="image/*" className="hidden" />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitReview}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 py-2 rounded-lg transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
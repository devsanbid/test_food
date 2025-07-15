'use client';
import { useState, useEffect, useCallback } from 'react';
import { Star, ThumbsUp, Calendar, User, Filter, Search, Plus, X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const RestaurantReviews = ({ restaurantId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    overall: 0,
    food: 0,
    service: 0,
    delivery: 0,
    comment: '',
    images: [],
    isAnonymous: false,
    orderId: ''
  });
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [filters, setFilters] = useState({
    rating: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalReviews: 0
  });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({

        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/restaurants/${restaurantId}/reviews?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          totalReviews: data.pagination.totalReviews
        }));
      } else {
        toast.error('Failed to load reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchInput);
  }, [searchInput, debouncedSearch]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUser(result.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUser();
    
    if (restaurantId) {
      fetchReviews();
    }
  }, [restaurantId, pagination.page, filters.rating, filters.sortBy, filters.sortOrder, filters.search]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-600'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handleRatingChange = (category, rating) => {
    setNewReview(prev => ({ ...prev, [category]: rating }));
  };

  const fetchUserOrders = async () => {
    if (!user || !restaurantId) return;
    
    try {
      setLoadingOrders(true);
      const response = await fetch(`/api/user/orders?status=delivered&restaurant=${restaurantId}&hasReview=false`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserOrders(data.data.orders || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }

    if (newReview.overall === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    if (!newReview.orderId) {
      toast.error('Please select an order to review');
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await fetch('/api/user/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          restaurantId,
          orderId: newReview.orderId,
          rating: {
            overall: newReview.overall,
            food: newReview.food || newReview.overall,
            service: newReview.service || newReview.overall,
            delivery: newReview.delivery || newReview.overall
          },
          comment: newReview.comment,
          images: newReview.images,
          isAnonymous: newReview.isAnonymous
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Review submitted successfully!');
        setShowWriteReview(false);
        setNewReview({
          overall: 0,
          food: 0,
          service: 0,
          delivery: 0,
          comment: '',
          images: [],
          isAnonymous: false,
          orderId: ''
        });
        fetchReviews();
        fetchUserOrders(); // Refresh orders list
      } else {
        toast.error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderRatingInput = (category, label, value) => {
    return (
      <div className="text-center">
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <div className="flex justify-center space-x-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRatingChange(category, rating)}
              className="focus:outline-none"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  rating <= value
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-600 hover:text-yellow-300'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 mt-1">{value > 0 ? value : 'Not rated'}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Write Review Button */}
      {user && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowWriteReview(true);
              fetchUserOrders();
            }}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Write a Review</span>
          </button>
        </div>
      )}

      {/* Write Review Modal */}
      {showWriteReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Write a Review</h3>
              <button
                onClick={() => setShowWriteReview(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Order to Review *</label>
                {loadingOrders ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <p className="text-gray-400 mt-2">Loading your orders...</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 text-center">
                    <p className="text-gray-400">No delivered orders found for this restaurant.</p>
                    <p className="text-sm text-gray-500 mt-1">You can only review restaurants you've ordered from.</p>
                  </div>
                ) : (
                  <select
                    value={newReview.orderId}
                    onChange={(e) => setNewReview(prev => ({ ...prev, orderId: e.target.value }))}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select an order...</option>
                    {userOrders.map((order) => (
                      <option key={order._id} value={order._id}>
                        Order #{order.orderNumber} - {new Date(order.createdAt).toLocaleDateString()} - ${order.total.toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Overall Rating */}
              <div className="text-center">
                <label className="block text-lg font-medium text-white mb-4">Overall Rating *</label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingChange('overall', rating)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          rating <= newReview.overall
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-600 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-400 mt-2">
                  {newReview.overall > 0 ? `${newReview.overall} star${newReview.overall > 1 ? 's' : ''}` : 'Select a rating'}
                </span>
              </div>

              {/* Detailed Ratings */}
              <div className="grid grid-cols-3 gap-4">
                {renderRatingInput('food', 'Food Quality', newReview.food)}
                {renderRatingInput('service', 'Service', newReview.service)}
                {renderRatingInput('delivery', 'Delivery', newReview.delivery)}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience with this restaurant..."
                  rows={4}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={newReview.isAnonymous}
                  onChange={(e) => setNewReview(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                />
                <label htmlFor="anonymous" className="text-sm text-gray-300">
                  Post anonymously
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowWriteReview(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || newReview.overall === 0 || !newReview.orderId || userOrders.length === 0}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Review Statistics */}
      {stats && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-2xl font-bold mb-4 text-orange-400">Review Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.averageRating?.toFixed(1) || 'N/A'}</div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(stats.averageRating || 0))}
              </div>
              <div className="text-gray-400 text-sm">{stats.totalReviews} reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.averageFood?.toFixed(1) || 'N/A'}</div>
              <div className="text-gray-400 text-sm">Food Quality</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.averageService?.toFixed(1) || 'N/A'}</div>
              <div className="text-gray-400 text-sm">Service</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.averageDelivery?.toFixed(1) || 'N/A'}</div>
              <div className="text-gray-400 text-sm">Delivery</div>
            </div>
          </div>
          
          {/* Rating Distribution */}
          {stats.ratingDistribution && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3">Rating Distribution</h4>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = stats.ratingDistribution[rating] || 0;
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="text-sm w-8">{rating}★</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-400 w-12">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(prev => ({ ...prev, sortBy, sortOrder }));
            }}
            className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="overall-desc">Highest Rated</option>
            <option value="overall-asc">Lowest Rated</option>
            <option value="helpfulVotes-desc">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No reviews found</div>
            <div className="text-gray-500 text-sm mt-2">Be the first to review this restaurant!</div>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {review.isAnonymous ? 'Anonymous User' : (review.user?.name || 'User')}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(review.createdAt)}</span>
                      {review.isVerified && (
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    {renderStars(review.overall)}
                    <span className="ml-2 font-medium text-white">{review.overall}</span>
                  </div>
                  <div className="text-sm text-gray-400">Overall Rating</div>
                </div>
              </div>
              
              {/* Detailed Ratings */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    {renderStars(review.food)}
                  </div>
                  <div className="text-sm text-gray-400">Food ({review.food})</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    {renderStars(review.service)}
                  </div>
                  <div className="text-sm text-gray-400">Service ({review.service})</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    {renderStars(review.delivery)}
                  </div>
                  <div className="text-sm text-gray-400">Delivery ({review.delivery})</div>
                </div>
              </div>
              
              {/* Review Comment */}
              {review.comment && (
                <div className="mb-4">
                  <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                </div>
              )}
              
              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="mb-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Order Details */}
              {review.orderDetails && (
                <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Order Details:</div>
                  <div className="text-sm text-gray-300">
                    Order #{review.orderDetails.orderNumber} • 
                    {review.orderDetails.items?.map(item => item.name).join(', ')}
                  </div>
                </div>
              )}
              
              {/* Helpful Votes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm">{review.helpfulVotes || 0} helpful</span>
                  </button>
                </div>
                
                {/* Restaurant Response */}
                {review.response && (
                  <div className="text-sm text-orange-400">
                    Restaurant responded
                  </div>
                )}
              </div>
              
              {/* Restaurant Response */}
              {review.response && (
                <div className="mt-4 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="font-medium text-orange-400">Restaurant Response</div>
                    <div className="text-sm text-gray-400">
                      {formatDate(review.response.createdAt)}
                    </div>
                  </div>
                  <p className="text-gray-300">{review.response.message}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pagination.page === pageNumber
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantReviews;
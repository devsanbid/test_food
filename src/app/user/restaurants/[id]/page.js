'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Star, Clock, MapPin, Heart, ArrowLeft, Plus, Minus, ShoppingCart, Phone, Info } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

import { toast } from 'react-hot-toast';
import { getCurrentUser } from '@/actions/authActions';
import { getRestaurantById } from '@/actions/restaurantActions';
import { getCartFromStorage, saveCartToStorage, addToCart, updateCartItemQuantity, removeFromCart, getCartItemsCount } from '@/utils/cartUtils';

export default function RestaurantProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    orderId: '',
    rating: { food: 5, service: 5, overall: 5 },
    comment: '',
    images: [],
    tags: []
  });
  const [userOrders, setUserOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id;

  const fetchRestaurantData = async () => {
    try {
      setLoadingRestaurant(true);
      const data = await getRestaurantById(restaurantId);
      console.log("Full API response: ", data);
      console.log("Reviews data structure: ", data.reviews);
      console.log("Reviews array: ", data.reviews?.reviews);

      setRestaurant(data.restaurant);
      setMenuItems(data.restaurant.menu || []);
      setReviews(data.reviews?.reviews || []);
      
      console.log("Reviews state after setting: ", data.reviews?.reviews || []);

    } catch (error) {
      console.error('Failed to fetch restaurant data:', error);
      router.push('/user/restaurants');
    } finally {
      setLoadingRestaurant(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const response = await fetch(`/api/user/orders?restaurant=${restaurantId}&status=delivered`);
      
      const data = await response.json();
      
      if (data.success) {
        setUserOrders(data.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/user/restaurants/${restaurantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add-review',
          ...reviewFormData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh restaurant data to get updated reviews and rating
        await fetchRestaurantData();
        
        // Reset form and close modal
        setReviewFormData({
          orderId: '',
          rating: { food: 5, service: 5, overall: 5 },
          comment: '',
          images: [],
          tags: []
        });
        setShowReviewForm(false);
        
        toast.success('Review submitted successfully!');
      } else {
        toast.error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    }
  };

  const categories = [
    { id: 'all', name: 'All Items', count: menuItems.length },
    ...(restaurant?.menuCategories || []).map(category => ({
      id: category.toLowerCase(),
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count: menuItems.filter(item => item.category === category).length
    }))
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
          router.push('/login');
          return;
        }
        setUser(userData);
        await fetchRestaurantData();
        await fetchUserOrders();
      } catch (error) {
        console.error('Failed to fetch data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchData();
    }
    
    // Load cart from localStorage using utility function
    const savedCart = getCartFromStorage();
    setCart(savedCart);
  }, [router, restaurantId]);

  const filteredMenuItems = menuItems.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );



  const addToCartHandler = (item) => {
    // Convert item to the expected format
    const dishItem = {
      _id: item.id || item._id,
      name: item.name,
      price: item.price,
      imageUrl: item.image,
      category: item.category,
      restaurantId: restaurant._id,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name
      },
      preparationTime: item.preparationTime || 15
    };
    
    const updatedCart = addToCart(dishItem, cart);
    setCart(updatedCart);
    saveCartToStorage(updatedCart);
    
    // Dispatch custom event to update other components
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.success(`${item.name} added to cart!`);
  };

  const removeFromCartHandler = (itemId) => {
    const existingItem = cart.find(cartItem => cartItem._id === itemId || cartItem.id === itemId);
    if (!existingItem) return;
    
    const actualId = existingItem._id || existingItem.id;
    let updatedCart;
    
    if (existingItem.quantity > 1) {
      updatedCart = updateCartItemQuantity(actualId, existingItem.quantity - 1, cart);
    } else {
      updatedCart = removeFromCart(actualId, cart);
    }
    
    setCart(updatedCart);
    saveCartToStorage(updatedCart);
    
    // Dispatch custom event to update other components
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getItemQuantity = (itemId) => {
    const item = cart.find(cartItem => cartItem._id === itemId || cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  if (loading || loadingRestaurant) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300">Restaurant not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="relative h-80">
        <img
          src={restaurant.bannerImage}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
        
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 p-3 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-black/40 transition-all duration-200"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border-2 border-white shadow-lg">
                <img
                  src={restaurant.profileImage || restaurant.logo || '/images/default-restaurant.jpg'}
                  alt={`${restaurant.name} profile`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
              <div className="flex items-center space-x-4 text-gray-300">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-medium">{restaurant.rating?.average?.toFixed(1) || 'N/A'}</span>
                  <span>({restaurant.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-5 w-5" />
                  <span>
                          {restaurant.deliveryTime ? 
                            `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max} min` : 
                            'N/A'
                          }
                        </span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-5 w-5" />
                  <span>{restaurant.distance ? `${restaurant.distance.toFixed(1)} km` : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-full font-medium ${
              restaurant.isCurrentlyOpen 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {restaurant.isCurrentlyOpen ? 'Open Now' : 'Closed'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex space-x-8 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-4 px-2 font-medium transition-colors duration-200 ${
              activeTab === 'menu'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-4 px-2 font-medium transition-colors duration-200 ${
              activeTab === 'info'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Restaurant Info
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 px-2 font-medium transition-colors duration-200 ${
              activeTab === 'reviews'
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Reviews
          </button>
        </div>
        
        {activeTab === 'reviews' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Reviews & Ratings</h2>
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Write a Review
              </button>
            </div>
            
            {/* Review Form Modal */}
            {showReviewForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Write a Review</h3>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <form onSubmit={handleReviewSubmit} className="space-y-6">
                    {/* Order Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Order *
                      </label>
                      <select
                        value={reviewFormData.orderId}
                        onChange={(e) => setReviewFormData({...reviewFormData, orderId: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      >
                        <option value="">Choose an order to review</option>
                        {userOrders.map(order => (
                          <option key={order._id} value={order._id}>
                            Order #{order._id.slice(-6)} - {new Date(order.createdAt).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Rating Section */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white">Rate Your Experience</h4>
                      
                      {/* Food Rating */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Food Quality</label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewFormData({
                                ...reviewFormData,
                                rating: {...reviewFormData.rating, food: star}
                              })}
                              className={`text-2xl transition-colors ${
                                star <= reviewFormData.rating.food ? 'text-yellow-400' : 'text-gray-600'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Service Rating */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Service</label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewFormData({
                                ...reviewFormData,
                                rating: {...reviewFormData.rating, service: star}
                              })}
                              className={`text-2xl transition-colors ${
                                star <= reviewFormData.rating.service ? 'text-yellow-400' : 'text-gray-600'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Overall Rating */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Overall Experience</label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewFormData({
                                ...reviewFormData,
                                rating: {...reviewFormData.rating, overall: star}
                              })}
                              className={`text-2xl transition-colors ${
                                star <= reviewFormData.rating.overall ? 'text-yellow-400' : 'text-gray-600'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Review *
                      </label>
                      <textarea
                        value={reviewFormData.comment}
                        onChange={(e) => setReviewFormData({...reviewFormData, comment: e.target.value})}
                        placeholder="Share your experience with this restaurant..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 h-32 resize-none"
                        required
                      />
                    </div>
                    
                    {/* Submit Buttons */}
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Submit Review
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review._id} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {(review.user?.firstName?.charAt(0) || review.user?.username?.charAt(0) || 'U')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">
                            {review.user?.firstName && review.user?.lastName 
                              ? `${review.user.firstName} ${review.user.lastName}`
                              : review.user?.username || 'Anonymous'
                            }
                          </h4>
                          <p className="text-sm text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white font-semibold">{review.rating.overall}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex space-x-4 text-sm">
                        <span className="text-gray-300">Food: <span className="text-yellow-400">{'★'.repeat(review.rating.food)}</span></span>
                        <span className="text-gray-300">Service: <span className="text-yellow-400">{'★'.repeat(review.rating.service)}</span></span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{review.comment}</p>
                    
                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {review.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-6xl mb-4">💬</div>
                  <p className="text-gray-400 text-lg">No reviews yet</p>
                  <p className="text-gray-500 text-sm mt-2">Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-8">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`relative cursor-pointer transition-all duration-300 pb-2 ${
                      selectedCategory === category.id
                        ? 'text-orange-500 font-semibold'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {category.name} ({category.count})
                    {selectedCategory === category.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Dishes</h2>
              <p className="text-gray-400">
                {filteredMenuItems.length > 0
                  ? `Discover our ${filteredMenuItems.length} delicious menu items`
                  : 'No menu items available'
                }
              </p>
            </div>
            

            {filteredMenuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMenuItems.map((item, index) => {
                  const dishWithRestaurant = {
                    ...item,
                    _id: item._id || item.id,
                    restaurant: {
                      _id: restaurant._id,
                      name: restaurant.name,
                      logo: restaurant.logo,
                      cuisine: restaurant.cuisine,
                      rating: restaurant.rating,
                      deliveryTime: restaurant.deliveryTime,
                      isActive: restaurant.isActive
                    }
                  };
                  
                  return (
                    <ProductCard
                      key={item._id || item.id || `menu-item-${index}`}
                      dish={dishWithRestaurant}
                      onAddToCart={addToCartHandler}
                      onRemoveFromCart={removeFromCartHandler}
                    />
                  );
                })
              }
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-6xl mb-4">🍽️</div>
                <p className="text-gray-400 text-lg">No dishes found for the selected category</p>
                <p className="text-gray-500 text-sm mt-2">Try selecting a different category or check back later</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-2xl font-bold mb-4 text-orange-400">About {restaurant.name}</h3>
              <p className="text-gray-300 mb-6">{restaurant.description || 'No description available.'}</p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-orange-400" />
                  <span>{restaurant.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-orange-400" />
                  <span>
                    {restaurant.address 
                      ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}, ${restaurant.address.state || ''} ${restaurant.address.zipCode || ''}`.replace(/^,\s*|,\s*$|,\s*,/g, '').trim() || 'N/A'
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
              
              {restaurant.tags && restaurant.tags.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3">Cuisine Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-2xl font-bold mb-4 text-orange-400">Opening Hours</h3>
              <div className="space-y-3">
                {restaurant.operatingHours && Object.keys(restaurant.operatingHours).length > 0 ? (
                  Object.entries(restaurant.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center">
                      <span className="capitalize font-medium">{day}</span>
                      <span className="text-gray-400">
                        {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">Operating hours not available</p>
                )}
              </div>
            </div>
          </div>
        )}
        

      </div>
      
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => router.push('/user/cart')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-4 rounded-full shadow-2xl transition-all duration-200 transform hover:scale-110"
          >
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6" />
              <span className="font-medium">{getCartItemsCount(cart)}</span>
            </div>
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
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
      setRestaurant(data.restaurant);
      setMenuItems(data.restaurant.menu || []);
    } catch (error) {
      console.error('Failed to fetch restaurant data:', error);
      router.push('/user/restaurants');
    } finally {
      setLoadingRestaurant(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Items', count: menuItems.length },
    ...restaurant?.menuCategories?.map(category => ({
      id: category.toLowerCase(),
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count: menuItems.filter(item => item.category === category).length
    })) || []
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
      <div className="relative h-80 overflow-hidden">
        <img
          src={restaurant.coverImage || restaurant.image || '/default-restaurant.jpg'}
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
        </div>
        
        {activeTab === 'menu' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-8">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  />
                );
              })}
            </div>
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
  );
}
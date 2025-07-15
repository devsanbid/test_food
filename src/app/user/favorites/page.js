'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Star, Clock, MapPin, Plus, Trash2, ShoppingCart, Filter, Search } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { toast } from 'react-hot-toast';
import { getCartFromStorage, saveCartToStorage, addToCart } from '@/utils/cartUtils';
import { getUserFavorites, getUserFavoriteDishes, removeFromFavorites, removeDishFromFavorites } from '@/actions/favoritesActions';

export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dishes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const router = useRouter();

  const [favoriteDishes, setFavoriteDishes] = useState([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoadingFavorites(true);
      const [dishesData, restaurantsData] = await Promise.all([
        getUserFavoriteDishes({ page: 1, limit: 50 }),
        getUserFavorites({ page: 1, limit: 50 })
      ]);
      
      setFavoriteDishes(dishesData.dishes || []);
      setFavoriteRestaurants(restaurantsData.restaurants || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoadingFavorites(false);
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
        await fetchFavorites();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const removeFavoriteDish = async (dish) => {
    try {
      await removeDishFromFavorites(dish.restaurantId, dish.menuItemId || dish._id);
      setFavoriteDishes(prev => prev.filter(d => d._id !== dish._id));
      toast.success('Dish removed from favorites');
    } catch (error) {
      console.error('Failed to remove dish from favorites:', error);
      toast.error('Failed to remove dish from favorites');
    }
  };

  const removeFavoriteRestaurant = async (restaurantId) => {
    try {
      await removeFromFavorites(restaurantId);
      setFavoriteRestaurants(prev => prev.filter(restaurant => restaurant._id !== restaurantId));
      toast.success('Restaurant removed from favorites');
    } catch (error) {
      console.error('Failed to remove restaurant from favorites:', error);
      toast.error('Failed to remove restaurant from favorites');
    }
  };

  const addToCartHandler = (dish) => {
    try {
      const currentCart = getCartFromStorage();
      const updatedCart = addToCart(dish, currentCart);
      saveCartToStorage(updatedCart);
      
      // Dispatch custom event to update other components
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast.success(`${dish.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const filteredDishes = favoriteDishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dish.restaurant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || dish.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredRestaurants = favoriteRestaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || loadingFavorites) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <Heart className="mr-3 text-red-500" />
            My Favorites
          </h1>
          <button 
            onClick={() => router.push('/user/foodlist')}
            className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add More
          </button>
        </div>

        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
          <button 
            onClick={() => setActiveTab('dishes')}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === 'dishes' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Favorite Dishes ({favoriteDishes.length})
          </button>
          <button 
            onClick={() => setActiveTab('restaurants')}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === 'restaurants' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Favorite Restaurants ({favoriteRestaurants.length})
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500"
            />
          </div>
          {activeTab === 'dishes' && (
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-8 py-2 focus:outline-none focus:border-orange-500 appearance-none"
              >
                <option value="all">All Categories</option>
                <option value="seafood">Seafood</option>
                <option value="soup">Soup</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="pasta">Pasta</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === 'dishes' && (
          <div>
            {filteredDishes.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-semibold mb-2">No favorite dishes found</h2>
                <p className="text-gray-400 mb-6">Start adding dishes to your favorites!</p>
                <button 
                  onClick={() => router.push('/user/foodlist')}
                  className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredDishes.map((dish) => (
                  <div key={dish._id} className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
                    <div className="relative">
                      <img 
                        src={dish.image} 
                        alt={dish.name}
                        className="w-full h-48 object-cover"
                      />
                      <button 
                        onClick={() => removeFavoriteDish(dish)}
                        className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 px-2 py-1 rounded text-sm">
                        {dish.category}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{dish.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{dish.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-500 font-semibold">${dish.price.toFixed(2)}</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm">{dish.rating?.average?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-400 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="mr-3">{dish.restaurant?.name || 'Unknown Restaurant'}</span>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{dish.prepTime || 'N/A'}</span>
                      </div>
                      <button 
                        onClick={() => addToCartHandler(dish)}
                        className="w-full bg-orange-500 hover:bg-orange-600 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center"
                      >
                        <ShoppingCart className="mr-2 w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                   ))}
                 </div>
               )}
           </div>
        )}

        {activeTab === 'restaurants' && (
          <div>
            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-semibold mb-2">No favorite restaurants found</h2>
                <p className="text-gray-400 mb-6">Start adding restaurants to your favorites!</p>
                <button 
                  onClick={() => router.push('/user/foodlist')}
                  className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Browse Restaurants
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                   {filteredRestaurants.map((restaurant) => (
                  <div key={restaurant._id} className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
                    <div className="relative">
                      <img 
                        src={restaurant.image} 
                        alt={restaurant.name}
                        className="w-full h-32 object-cover"
                      />
                      <button 
                        onClick={() => removeFavoriteRestaurant(restaurant._id)}
                        className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded text-sm ${
                        restaurant.isOpen ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {restaurant.isOpen ? 'Open' : 'Closed'}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm">{restaurant.rating?.average?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{restaurant.cuisine} • {restaurant.address?.city || 'Location'}</p>
                      <div className="flex items-center text-sm text-gray-400 mb-3">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="mr-3">
                          {restaurant.deliveryTime ? 
                            `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max} min` : 
                            'N/A'
                          }
                        </span>
                        <span>Delivery: ${(restaurant.deliveryFee || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(restaurant.specialties || []).map((specialty, index) => (
                          <span key={index} className="bg-gray-700 px-2 py-1 rounded text-xs">
                            {specialty}
                          </span>
                        ))}
                      </div>
                      <button 
                        onClick={() => router.push('/user/foodlist')}
                        className="w-full bg-orange-500 hover:bg-orange-600 py-2 rounded-lg font-semibold transition-colors"
                        disabled={!restaurant.isOpen}
                      >
                        {restaurant.isOpen ? 'View Menu' : 'Currently Closed'}
                      </button>
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
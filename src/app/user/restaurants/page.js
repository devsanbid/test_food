'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Clock, MapPin, Heart, Filter, Search } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { getRestaurants } from '@/actions/restaurantActions';
import { addToFavorites, removeFromFavorites, getUserFavorites } from '@/actions/favoritesActions';
import { toast } from 'react-hot-toast';

export default function RestaurantsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsData, setRestaurantsData] = useState(null);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState(new Set());
  const [togglingFavorite, setTogglingFavorite] = useState(new Set());
  const router = useRouter();


  const categories = [
    { id: 'all', name: 'All Restaurants', count: restaurants.length },
    ...(restaurantsData?.filters?.cuisines?.map(cuisine => ({
      id: cuisine.name.toLowerCase(),
      name: cuisine.name,
      count: cuisine.count
    })) || [])
  ];

  const fetchRestaurants = async (params = {}) => {
    try {
      setLoadingRestaurants(true);
      const data = await getRestaurants({
        search: searchTerm,
        cuisine: selectedCategory !== 'all' ? selectedCategory : '',
        sortBy: 'rating',
        sortOrder: 'desc',
        limit: 12,
        ...params
      });
      setRestaurantsData(data);
      setRestaurants(data.restaurants || []);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const favoritesData = await getUserFavorites();
      const favoriteIds = new Set(favoritesData.restaurants.map(restaurant => restaurant._id));
      setFavoriteRestaurants(favoriteIds);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const toggleFavorite = async (e, restaurantId) => {
    e.stopPropagation();
    
    if (togglingFavorite.has(restaurantId)) return;
    
    setTogglingFavorite(prev => new Set([...prev, restaurantId]));
    
    try {
      if (favoriteRestaurants.has(restaurantId)) {
        await removeFromFavorites(restaurantId);
        setFavoriteRestaurants(prev => {
          const newSet = new Set(prev);
          newSet.delete(restaurantId);
          return newSet;
        });
        toast.success('Removed from favorites');
      } else {
        await addToFavorites(restaurantId);
        setFavoriteRestaurants(prev => new Set([...prev, restaurantId]));
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setTogglingFavorite(prev => {
        const newSet = new Set(prev);
        newSet.delete(restaurantId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
          router.push('/login');
          return;
        }
        setUser(userData);
        await fetchRestaurants();
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

  useEffect(() => {
    if (user) {
      fetchRestaurants();
    }
  }, [searchTerm, selectedCategory]);

  const filteredRestaurants = restaurants;

  const handleRestaurantClick = (restaurantId) => {
    router.push(`/user/restaurants/${restaurantId}`);
  };

  if (loading || loadingRestaurants) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Discover Restaurants
          </h1>
          <p className="text-gray-400 text-lg">Find your favorite restaurants and explore new cuisines</p>
        </div>

        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search restaurants, cuisines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant._id}
              onClick={() => handleRestaurantClick(restaurant._id)}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={restaurant.bannerImage || restaurant.logo || restaurant.images?.[0] || '/img1.jpg'}
                  alt={restaurant.name}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                <button 
                  onClick={(e) => toggleFavorite(e, restaurant._id)}
                  disabled={togglingFavorite.has(restaurant._id)}
                  className={`absolute top-4 right-4 p-2 backdrop-blur-sm rounded-full transition-all duration-200 ${
                    favoriteRestaurants.has(restaurant._id)
                      ? 'bg-red-500/80 text-white hover:bg-red-600/80'
                      : 'bg-black/20 text-white hover:bg-black/40'
                  } ${togglingFavorite.has(restaurant._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {togglingFavorite.has(restaurant._id) ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Heart className={`h-5 w-5 ${
                      favoriteRestaurants.has(restaurant._id) ? 'fill-current' : ''
                    }`} />
                  )}
                </button>
                
                <div className="absolute bottom-4 left-4 right-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    restaurant.isCurrentlyOpen 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      restaurant.isCurrentlyOpen ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    {restaurant.isCurrentlyOpen ? 'Open' : 'Closed'}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors duration-200">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white font-medium">{restaurant.rating?.average?.toFixed(1) || '4.0'}</span>
                    <span className="text-gray-400 text-sm">({restaurant.rating?.count || 0})</span>
                  </div>
                </div>
                
                <p className="text-gray-400 mb-4">{restaurant.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {restaurant.cuisine?.map((cuisineType, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm"
                    >
                      {cuisineType}
                    </span>
                  ))}
                  {restaurant.tags?.map((tag, index) => (
                    <span
                      key={`tag-${index}`}
                      className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{restaurant.deliveryTime?.min}-{restaurant.deliveryTime?.max} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{restaurant.distance ? `${restaurant.distance.toFixed(1)} km` : restaurant.address?.city}</span>
                    </div>
                  </div>
                  <div className="text-orange-400 font-medium">
                    ${restaurant.deliveryFee?.toFixed(2) || '2.99'} delivery
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredRestaurants.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-4">No restaurants found</div>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
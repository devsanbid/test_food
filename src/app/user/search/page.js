'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Search, Filter, Star, Clock, MapPin, Heart, ShoppingCart, Mic, X, SlidersHorizontal } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { toast } from 'react-hot-toast';
import { getCartFromStorage, saveCartToStorage, addToCart } from '@/utils/cartUtils';

export default function SearchPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dishes');
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    rating: 'all',
    deliveryTime: 'all',
    distance: 'all',
    cuisine: 'all',
    isOpen: false
  });

  const [dishes] = useState([
    {
      id: 1,
      name: "Spicy seasoned seafood noodles",
      price: 2.29,
      image: "/seasoned.png",
      restaurant: "Ocean Delights",
      rating: 4.8,
      category: "seafood",
      prepTime: "15-20 min",
      distance: "1.2 km",
      isFavorite: true
    },
    {
      id: 2,
      name: "Salted pasta with mushroom sauce",
      price: 2.69,
      image: "/Image2.png",
      restaurant: "Italian Corner",
      rating: 4.6,
      category: "pasta",
      prepTime: "20-25 min",
      distance: "2.1 km",
      isFavorite: false
    },
    {
      id: 3,
      name: "Beef dumpling in hot and sour soup",
      price: 2.99,
      image: "/Image3.png",
      restaurant: "Asian Fusion",
      rating: 4.7,
      category: "soup",
      prepTime: "18-22 min",
      distance: "1.8 km",
      isFavorite: false
    },
    {
      id: 4,
      name: "Healthy noodle with spinach leaf",
      price: 3.29,
      image: "/Image5.png",
      restaurant: "Green Garden",
      rating: 4.5,
      category: "vegetarian",
      prepTime: "12-18 min",
      distance: "0.8 km",
      isFavorite: true
    },
    {
      id: 5,
      name: "Hot spicy fried rice with omelet",
      price: 3.49,
      image: "/Image5.png",
      restaurant: "Spice House",
      rating: 4.4,
      category: "rice",
      prepTime: "15-20 min",
      distance: "2.5 km",
      isFavorite: false
    },
    {
      id: 6,
      name: "Margherita Pizza",
      price: 8.99,
      image: "/Image2.png",
      restaurant: "Italian Corner",
      rating: 4.8,
      category: "pizza",
      prepTime: "25-30 min",
      distance: "2.1 km",
      isFavorite: false
    }
  ]);

  const [restaurants] = useState([
    {
      id: 1,
      name: "Ocean Delights",
      image: "/seasoned.png",
      rating: 4.8,
      cuisine: "Seafood",
      deliveryTime: "25-35 min",
      deliveryFee: 2.50,
      distance: "1.2 km",
      isOpen: true,
      isFavorite: true
    },
    {
      id: 2,
      name: "Italian Corner",
      image: "/Image2.png",
      rating: 4.7,
      cuisine: "Italian",
      deliveryTime: "30-40 min",
      deliveryFee: 3.00,
      distance: "2.1 km",
      isOpen: true,
      isFavorite: false
    },
    {
      id: 3,
      name: "Green Garden",
      image: "/Image5.png",
      rating: 4.5,
      cuisine: "Vegetarian",
      deliveryTime: "20-30 min",
      deliveryFee: 2.00,
      distance: "0.8 km",
      isOpen: false,
      isFavorite: true
    },
    {
      id: 4,
      name: "Spice House",
      image: "/Image6.png",
      rating: 4.4,
      cuisine: "Indian",
      deliveryTime: "35-45 min",
      deliveryFee: 2.75,
      distance: "2.5 km",
      isOpen: true,
      isFavorite: false
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

    // Get search term from URL params
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
    }
  }, [router, searchParams]);

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        alert('Voice search not available or permission denied');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      alert('Voice search is not supported in your browser');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      priceRange: 'all',
      rating: 'all',
      deliveryTime: 'all',
      distance: 'all',
      cuisine: 'all',
      isOpen: false
    });
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dish.restaurant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dish.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.category === 'all' || dish.category === filters.category;
    const matchesPrice = filters.priceRange === 'all' || 
                        (filters.priceRange === 'low' && dish.price < 3) ||
                        (filters.priceRange === 'medium' && dish.price >= 3 && dish.price < 6) ||
                        (filters.priceRange === 'high' && dish.price >= 6);
    const matchesRating = filters.rating === 'all' || dish.rating >= parseFloat(filters.rating);
    
    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCuisine = filters.cuisine === 'all' || restaurant.cuisine.toLowerCase() === filters.cuisine.toLowerCase();
    const matchesRating = filters.rating === 'all' || restaurant.rating >= parseFloat(filters.rating);
    const matchesOpen = !filters.isOpen || restaurant.isOpen;
    
    return matchesSearch && matchesCuisine && matchesRating && matchesOpen;
  });

  const toggleFavorite = (type, id) => {
    // Simulate toggling favorite status
    console.log(`Toggle favorite for ${type} with id ${id}`);
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
          <h1 className="text-3xl font-bold mb-6">Search Food & Restaurants</h1>
          
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for dishes, restaurants, or cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:border-orange-500"
              />
              <button 
                onClick={handleVoiceSearch}
                className={`absolute right-3 top-3 p-1 rounded transition-colors ${
                  isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-orange-500'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-800 border border-gray-600 hover:border-orange-500 px-4 py-3 rounded-lg transition-colors flex items-center"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button 
                  onClick={clearFilters}
                  className="text-orange-500 hover:text-orange-400 text-sm"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="seafood">Seafood</option>
                    <option value="pasta">Pasta</option>
                    <option value="soup">Soup</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="rice">Rice</option>
                    <option value="pizza">Pizza</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Prices</option>
                    <option value="low">Under $3</option>
                    <option value="medium">$3 - $6</option>
                    <option value="high">Above $6</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Ratings</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Cuisine</label>
                  <select
                    value={filters.cuisine}
                    onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Cuisines</option>
                    <option value="seafood">Seafood</option>
                    <option value="italian">Italian</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="indian">Indian</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Distance</label>
                  <select
                    value={filters.distance}
                    onChange={(e) => handleFilterChange('distance', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">Any Distance</option>
                    <option value="1">Within 1 km</option>
                    <option value="2">Within 2 km</option>
                    <option value="5">Within 5 km</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isOpen}
                      onChange={(e) => handleFilterChange('isOpen', e.target.checked)}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm">Open Now</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
            <button 
              onClick={() => setActiveTab('dishes')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'dishes' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Dishes ({filteredDishes.length})
            </button>
            <button 
              onClick={() => setActiveTab('restaurants')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'restaurants' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Restaurants ({filteredRestaurants.length})
            </button>
          </div>
        </div>

        {activeTab === 'dishes' && (
          <div>
            {filteredDishes.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-semibold mb-2">No dishes found</h2>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDishes.map((dish) => (
                  <div key={dish.id} className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
                    <div className="relative">
                      <img 
                        src={dish.image} 
                        alt={dish.name}
                        className="w-full h-48 object-cover"
                      />
                      <button 
                        onClick={() => toggleFavorite('dish', dish.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                          dish.isFavorite ? 'bg-red-500 text-white' : 'bg-gray-800 bg-opacity-70 text-gray-300 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${dish.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{dish.name}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-500 font-semibold">${dish.price.toFixed(2)}</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm">{dish.rating?.average?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-400 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="mr-3">{dish.restaurant}</span>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{dish.prepTime}</span>
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
                <Search className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-semibold mb-2">No restaurants found</h2>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
                    <div className="relative">
                      <img 
                        src={restaurant.image} 
                        alt={restaurant.name}
                        className="w-full h-32 object-cover"
                      />
                      <button 
                        onClick={() => toggleFavorite('restaurant', restaurant.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                          restaurant.isFavorite ? 'bg-red-500 text-white' : 'bg-gray-800 bg-opacity-70 text-gray-300 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${restaurant.isFavorite ? 'fill-current' : ''}`} />
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
                      <p className="text-gray-400 text-sm mb-3">{restaurant.cuisine} • {restaurant.distance}</p>
                      <div className="flex items-center text-sm text-gray-400 mb-4">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="mr-3">
                          {restaurant.deliveryTime ? 
                            `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max} min` : 
                            'N/A'
                          }
                        </span>
                        <span>Delivery: ${restaurant.deliveryFee.toFixed(2)}</span>
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
'use client';
import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { getMenuItems } from '@/actions/menuActions';
import { toast } from 'react-hot-toast';
import { getCartFromStorage, saveCartToStorage, addToCart } from '@/utils/cartUtils';

const defaultCategories = ['All', 'Hot Dishes', 'Cold Dishes', 'Soup', 'Grill', 'Appetizer', 'Dessert'];

export default function FoodMenu() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [cartItems, setCartItems] = useState([]);

  // Load cart items from localStorage on component mount
  useEffect(() => {
    const savedCart = getCartFromStorage();
    setCartItems(savedCart);
  }, []);
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          ...filters,
          category: activeCategory === 0 ? '' : categories[activeCategory],
          page: 1,
          limit: 50
        };
        
        const response = await getMenuItems(params);
        
        if (response.success) {
          setDishes(response.menuItems || []);
          
          // Update categories with API data
          if (response.categories && response.categories.length > 0) {
            setCategories(['All', ...response.categories]);
          }
        } else {
          setError(response.message || 'Failed to fetch menu items');
          toast.error('Failed to load menu items');
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('Failed to load menu items');
        toast.error('Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [activeCategory, filters]);

  const handleAddToCart = (dish) => {
    setCartItems(prev => {
      const updatedCart = addToCart(dish, prev);
      return updatedCart;
    });
    
    // Save to localStorage and show toast outside of setState
    const currentCart = getCartFromStorage();
    const saved = saveCartToStorage(addToCart(dish, currentCart));
    
    if (saved) {
      toast.success(`${dish.name} added to cart!`);
      // Dispatch custom event for cart updates
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } else {
      toast.error('Failed to add item to cart');
    }
  };

  const handleCategoryChange = (index) => {
    setActiveCategory(index);
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400">Loading menu items...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-gray-400">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-8">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => handleCategoryChange(i)}
              className={`relative cursor-pointer transition-all duration-300 pb-2 ${
                i === activeCategory 
                  ? 'text-orange-500 font-semibold' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat}
              {i === activeCategory && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
        <select 
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
          value={filters.sortBy}
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
          <option value="rating">Sort by Rating</option>
          <option value="preparationTime">Sort by Prep Time</option>
        </select>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Dishes</h2>
        <p className="text-gray-400">
          {dishes.length > 0 
            ? `Discover our ${dishes.length} delicious menu items` 
            : 'No menu items available'
          }
        </p>
      </div>
      
      {dishes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dishes.map((dish) => (
            <ProductCard 
              key={dish._id} 
              dish={dish} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 text-6xl mb-4">🍽️</div>
          <p className="text-gray-400 text-lg">No dishes found for the selected category</p>
          <p className="text-gray-500 text-sm mt-2">Try selecting a different category or check back later</p>
        </div>
      )}
    </div>
  );
}

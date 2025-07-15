'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Heart, Star, Clock, Minus } from 'lucide-react';
import { addDishToFavorites, removeDishFromFavorites, getUserFavoriteDishes } from '@/actions/favoritesActions';
import { toast } from 'react-hot-toast';
import { getCartFromStorage } from '@/utils/cartUtils';

export default function ProductCard({ dish, onAddToCart, onRemoveFromCart }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    checkIfFavorite();
    updateQuantityFromCart();
  }, [dish._id]);

  useEffect(() => {
    const handleCartUpdate = () => {
      updateQuantityFromCart();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const updateQuantityFromCart = () => {
    const cart = getCartFromStorage();
    const cartItem = cart.find(item => item._id === dish._id || item.id === dish._id);
    setQuantity(cartItem ? cartItem.quantity : 0);
  };

  const checkIfFavorite = async () => {
    try {
      const favoritesData = await getUserFavoriteDishes();
      const isFavorite = favoritesData.dishes.some(
        favDish => favDish.menuItemId === dish._id
      );
      setIsLiked(isFavorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  // Helper function to safely render values that might be objects
  const safeRender = (value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.min !== undefined && value.max !== undefined) {
        return `${value.min}-${value.max}`;
      }
      return JSON.stringify(value);
    }
    return value;
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onAddToCart && onAddToCart(dish);
    setIsAdding(false);
  };

  const toggleLike = async (e) => {
    e.stopPropagation();
    setIsTogglingFavorite(true);
    
    try {
      if (isLiked) {
        await removeDishFromFavorites(dish.restaurant._id, dish._id);
        setIsLiked(false);
        toast.success('Removed from favorites');
      } else {
        const dishData = {
          restaurantId: dish.restaurant._id,
          menuItemId: dish._id,
          name: dish.name,
          price: dish.price,
          image: dish.imageUrl || dish.image
        };
        await addDishToFavorites(dishData);
        setIsLiked(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      if (error.message && error.message.includes('already in favorites')) {
        setIsLiked(true);
        toast.info('Item is already in your favorites');
      } else if (error.message && error.message.includes('not in favorites')) {
        setIsLiked(false);
        toast.info('Item was not in your favorites');
      } else {
        toast.error('Failed to update favorites');
      }
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <div className="group relative bg-gray-800 rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Image */}
        <div className="relative h-48 mb-4 rounded-xl overflow-hidden">
          <img
            src={dish.imageUrl || dish.image || '/images/default-food.jpg'}
            alt={dish.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Favorite button */}
          <button 
            onClick={toggleLike}
            disabled={isTogglingFavorite}
            className={`absolute top-3 right-3 p-2 backdrop-blur-sm rounded-full transition-all duration-200 ${
              isLiked 
                ? 'bg-red-500/80 text-white hover:bg-red-600/80' 
                : 'bg-black/20 text-white hover:bg-black/40'
            } ${isTogglingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          
          {/* Price badge */}
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full font-bold text-lg shadow-lg">
            ${dish.price}
          </div>
        </div>
        
        {/* Dish info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors duration-300">
              {dish.name}
            </h3>
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">
              {dish.description || 'Delicious dish prepared with fresh ingredients'}
            </p>
          </div>
          
          {/* Restaurant info */}
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <img
                src={dish.restaurant?.logo || '/images/default-restaurant.jpg'}
                alt={dish.restaurant?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span>{dish.restaurant?.name}</span>
          </div>
          
          {/* Rating and time */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1 text-yellow-400">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-white font-medium">
                {dish.rating?.toFixed(1) || dish.restaurant?.rating?.average?.toFixed(1) || '4.5'}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{dish.preparationTime || dish.restaurant?.deliveryTime?.min || '15'} min</span>
            </div>
          </div>
          
          {/* Category tag */}
          {dish.category && (
            <div className="inline-block">
              <span className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium">
                {dish.category.charAt(0).toUpperCase() + dish.category.slice(1)}
              </span>
            </div>
          )}
        </div>
        
        {/* Add to cart section */}
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          {quantity > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromCart(dish._id || dish.id);
                  }}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors duration-200"
                >
                  <Minus className="h-4 w-4 text-white" />
                </button>
                <span className="text-lg font-bold text-white min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(dish);
                  }}
                  className="p-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-full transition-all duration-200 transform hover:scale-110"
                >
                  <Plus className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-lg font-bold text-orange-400">
                  ${(dish.price * quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(dish);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Hover effect border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-500/30 rounded-2xl transition-all duration-500"></div>
    </div>
  );
}
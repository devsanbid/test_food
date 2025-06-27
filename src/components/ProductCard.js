'use client';
import React, { useState } from 'react';
import { Plus, Heart, Star } from 'lucide-react';

export default function ProductCard({ dish, onAddToCart }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onAddToCart && onAddToCart(dish);
    setIsAdding(false);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <div className="group relative bg-gray-800 rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 cursor-pointer overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="relative mb-4">
          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-700 transition-transform duration-500 group-hover:scale-110">
            <img 
              src={dish.img} 
              alt={dish.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125" 
            />
          </div>
          
          <button
            onClick={toggleLike}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 ${
              isLiked 
                ? 'bg-red-500 text-white scale-110' 
                : 'bg-gray-700/80 text-gray-300 hover:bg-red-500 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform duration-300 ${
              isLiked ? 'fill-current scale-110' : ''
            }`} />
          </button>
          
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            {dish.available} available
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-semibold text-white text-lg leading-tight group-hover:text-orange-400 transition-colors duration-300">
            {dish.name}
          </h3>
          
          <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${
                i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-600'
              }`} />
            ))}
            <span className="text-xs text-gray-400 ml-1">4.0</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 font-bold text-xl">
                ${dish.price.toFixed(2)}
              </p>
              <p className="text-gray-500 text-xs">
                {dish.available} Bowls
              </p>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`relative bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-orange-500/50 ${
                isAdding ? 'scale-95 bg-green-500' : ''
              }`}
            >
              <div className={`transition-all duration-300 ${
                isAdding ? 'rotate-180 scale-0' : 'rotate-0 scale-100'
              }`}>
                <Plus className="w-5 h-5" />
              </div>
              
              {isAdding && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </div>
        </div>
        
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
      </div>
    </div>
  );
}
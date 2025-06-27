'use client';
import React, { useState } from 'react';
import ProductCard from './ProductCard';

const categories = ['Hot Dishes', 'Cold Dishes', 'Soup', 'Grill', 'Appetizer', 'Dessert'];

const dishes = [
  { id: 1, name: "Spicy seasoned seafood noodles", price: 2.29, available: 20, img: "/seasoned.png" },
  { id: 2, name: "Salted Pasta with mushroom sauce", price: 2.69, available: 11, img: "/Image2.png" },
  { id: 3, name: "Beef dumpling in hot and sour soup", price: 2.99, available: 16, img: "/Image3.png" },
  { id: 4, name: "Healthy noodle with spinach leaf", price: 3.29, available: 22, img: "/Image5.png" },
  { id: 5, name: "Hot spicy fried rice with omelet", price: 3.49, available: 13, img: "/Image5.png" },
  { id: 6, name: "Spicy instant noodle with omelette", price: 3.59, available: 17, img: "/Image6.png" },
];

export default function FoodMenu() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [cartItems, setCartItems] = useState([]);

  const handleAddToCart = (dish) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === dish.id);
      if (existingItem) {
        return prev.map(item => 
          item.id === dish.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-8">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
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
        <select className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none transition-colors">
          <option>Dine In</option>
          <option>To Go</option>
          <option>Delivery</option>
        </select>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Dishes</h2>
        <p className="text-gray-400">Discover our delicious menu items</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {dishes.map((dish) => (
          <ProductCard 
            key={dish.id} 
            dish={dish} 
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

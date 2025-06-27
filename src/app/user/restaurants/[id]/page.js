'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Star, Clock, MapPin, Heart, ArrowLeft, Plus, Minus, ShoppingCart, Phone, Info } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function RestaurantProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id;

  const [restaurant] = useState({
    id: 1,
    name: "Ocean Delights",
    image: "/img1.jpg",
    coverImage: "/img1.jpg",
    rating: 4.8,
    reviews: 1250,
    cuisine: "Seafood",
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
    distance: "1.2 km",
    isOpen: true,
    phone: "+1 (555) 123-4567",
    address: "123 Ocean Drive, Seaside City",
    description: "Fresh seafood and ocean delicacies prepared by our expert chefs. We source our ingredients daily from local fishermen to ensure the highest quality and freshness.",
    tags: ["Seafood", "Fresh", "Premium", "Sustainable"],
    openingHours: {
      monday: "11:00 AM - 10:00 PM",
      tuesday: "11:00 AM - 10:00 PM",
      wednesday: "11:00 AM - 10:00 PM",
      thursday: "11:00 AM - 10:00 PM",
      friday: "11:00 AM - 11:00 PM",
      saturday: "10:00 AM - 11:00 PM",
      sunday: "10:00 AM - 9:00 PM"
    }
  });

  const [menuItems] = useState([
    {
      id: 1,
      name: "Spicy Seasoned Seafood Noodles",
      price: 18.99,
      image: "/seasoned.png",
      category: "noodles",
      description: "Fresh seafood noodles with our signature spicy seasoning blend",
      ingredients: ["Fresh noodles", "Mixed seafood", "Spicy sauce", "Vegetables"],
      isPopular: true,
      prepTime: "15-20 min"
    },
    {
      id: 2,
      name: "Grilled Salmon Fillet",
      price: 24.99,
      image: "/Image2.png",
      category: "main",
      description: "Premium Atlantic salmon grilled to perfection with herbs",
      ingredients: ["Atlantic salmon", "Herbs", "Lemon", "Vegetables"],
      isPopular: true,
      prepTime: "20-25 min"
    },
    {
      id: 3,
      name: "Seafood Paella",
      price: 28.99,
      image: "/Image3.png",
      category: "main",
      description: "Traditional Spanish paella with fresh seafood and saffron rice",
      ingredients: ["Saffron rice", "Mixed seafood", "Bell peppers", "Peas"],
      isPopular: false,
      prepTime: "30-35 min"
    },
    {
      id: 4,
      name: "Fish Tacos",
      price: 16.99,
      image: "/Image5.png",
      category: "appetizers",
      description: "Crispy fish tacos with fresh salsa and avocado",
      ingredients: ["Fresh fish", "Corn tortillas", "Salsa", "Avocado"],
      isPopular: false,
      prepTime: "10-15 min"
    },
    {
      id: 5,
      name: "Lobster Bisque",
      price: 14.99,
      image: "/Image6.png",
      category: "soups",
      description: "Rich and creamy lobster bisque with fresh herbs",
      ingredients: ["Fresh lobster", "Cream", "Herbs", "Cognac"],
      isPopular: true,
      prepTime: "8-12 min"
    },
    {
      id: 6,
      name: "Chocolate Lava Cake",
      price: 8.99,
      image: "/spa.png",
      category: "desserts",
      description: "Warm chocolate cake with molten center and vanilla ice cream",
      ingredients: ["Dark chocolate", "Vanilla ice cream", "Berries"],
      isPopular: false,
      prepTime: "5-8 min"
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Items', count: menuItems.length },
    { id: 'appetizers', name: 'Appetizers', count: menuItems.filter(item => item.category === 'appetizers').length },
    { id: 'main', name: 'Main Courses', count: menuItems.filter(item => item.category === 'main').length },
    { id: 'noodles', name: 'Noodles', count: menuItems.filter(item => item.category === 'noodles').length },
    { id: 'soups', name: 'Soups', count: menuItems.filter(item => item.category === 'soups').length },
    { id: 'desserts', name: 'Desserts', count: menuItems.filter(item => item.category === 'desserts').length }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
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
    
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  }, [router]);

  const filteredMenuItems = menuItems.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...cart, { ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
    }
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    let newCart;
    
    if (existingItem && existingItem.quantity > 1) {
      newCart = cart.map(cartItem => 
        cartItem.id === itemId 
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
    } else {
      newCart = cart.filter(cartItem => cartItem.id !== itemId);
    }
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getItemQuantity = (itemId) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="relative h-80 overflow-hidden">
        <img
          src={restaurant.coverImage}
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
                  <span className="font-medium">{restaurant.rating}</span>
                  <span>({restaurant.reviews} reviews)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-5 w-5" />
                  <span>{restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-5 w-5" />
                  <span>{restaurant.distance}</span>
                </div>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-full font-medium ${
              restaurant.isOpen 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {restaurant.isOpen ? 'Open Now' : 'Closed'}
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
              {filteredMenuItems.map((item) => {
                const quantity = getItemQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group"
                  >
                    {item.isPopular && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      <button className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-black/40 transition-all duration-200">
                        <Heart className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors duration-200">
                          {item.name}
                        </h3>
                        <div className="text-orange-400 font-bold text-lg">
                          ${item.price}
                        </div>
                      </div>
                      
                      <p className="text-gray-400 mb-4">{item.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{item.prepTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {quantity > 0 ? (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors duration-200"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-medium text-lg">{quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full transition-colors duration-200"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span>Add to Cart</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-2xl font-bold mb-4 text-orange-400">About {restaurant.name}</h3>
              <p className="text-gray-300 mb-6">{restaurant.description}</p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-orange-400" />
                  <span>{restaurant.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-orange-400" />
                  <span>{restaurant.address}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Cuisine Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {restaurant.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-2xl font-bold mb-4 text-orange-400">Opening Hours</h3>
              <div className="space-y-3">
                {Object.entries(restaurant.openingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="capitalize font-medium">{day}</span>
                    <span className="text-gray-400">{hours}</span>
                  </div>
                ))}
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
              <span className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
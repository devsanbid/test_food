'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ShoppingCart, MapPin, User, Settings, ChevronDown, X, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCartFromStorage, getCartItemsCount, getCartTotal } from '@/utils/cartUtils';

export default function UserHeader() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [currentLocation, setCurrentLocation] = useState('');
  
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const cartRef = useRef(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUserData(result.user);
          } else {
            setUserData(null);
          }
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserData(null);
      }
    };

    loadUserData();
    
    // Sample notifications data
    setNotifications([
      { id: 1, title: 'Order Delivered', message: 'Your order from Pizza Palace has been delivered!', time: '5 min ago', read: false },
      { id: 2, title: 'New Offer', message: '20% off on your next order from Burger Barn', time: '1 hour ago', read: false },
      { id: 3, title: 'Order Confirmed', message: 'Your order #12345 has been confirmed', time: '2 hours ago', read: true }
    ]);
    
    // Load cart items from localStorage
    const loadCartItems = () => {
      const savedCart = getCartFromStorage();
      setCartItems(savedCart);
    };

    loadCartItems();

    // Listen for storage changes to update cart in real-time
    const handleStorageChange = (e) => {
      if (e.key === 'foodSewaCart') {
        loadCartItems();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom cart update events
    const handleCartUpdate = () => {
      loadCartItems();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
    
    // Get user location
    const userLocation = localStorage.getItem('userLocation') || 'New York, NY';
    setCurrentLocation(userLocation);
    
    // Cleanup function no longer needed since we're not using localStorage
    return () => {};
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setShowCart(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
        setShowNotifications(false);
        setShowCart(false);
      }
    };

    if (showDropdown || showNotifications || showCart) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showDropdown, showNotifications, showCart]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setUserData(null);
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <header className="relative bg-gray-800/50 backdrop-blur-md border-b border-gray-700 px-4 sm:px-6 py-4 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-300">
            <MapPin className="h-4 w-4 text-orange-500" />
            <span className="text-sm">{currentLocation}</span>
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for restaurants, dishes..."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-full pl-12 pr-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 cursor-pointer"
              onClick={() => window.location.href = '/user/restaurants'}
              readOnly
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors duration-200"
            >
              <ShoppingCart size={20} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartItemsCount(cartItems)}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors duration-200"
            >
              <Bell size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                {userData?.avatar ? (
                  <img 
                    src={userData.avatar} 
                    alt={userData.name || 'User'} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-white">
                  {userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username || 'Guest User' : 'Guest User'}
                </div>
                <div className="text-xs text-gray-400">
                  {userData?.email || 'guest@foodsewa.com'}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50">
                <a
                  href="/user/profile"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </a>
                <a
                  href="/user/settings"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </a>
                <a
                  href="/user/orderhistory"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <span>Order History</span>
                </a>
                <a
                  href="/user/loyalty"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <span>Loyalty Points</span>
                </a>
                <hr className="my-2 border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-left"
                >
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Popup */}
        {showNotifications && (
          <div ref={notificationsRef} className="absolute top-16 right-4 w-80 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className={`p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors ${
                    !notification.read ? 'bg-orange-500/10' : ''
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{notification.title}</h4>
                        <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">
                  No notifications
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cart Popup */}
        {showCart && (
          <div ref={cartRef} className="absolute top-16 right-4 w-96 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Cart ({getCartItemsCount(cartItems)})</h3>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {cartItems.length > 0 ? (
                <>
                  {cartItems.map((item, index) => (
                    <div key={`${item.menuItem || item.name}-${index}`} className="p-4 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{item.name}</h4>
                          <p className="text-sm text-gray-400">{item.restaurant?.name || item.restaurantName || item.restaurant}</p>
                          <p className="text-sm text-orange-400 font-medium">${item.price}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                            <Minus size={16} className="text-white" />
                          </button>
                          <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                          <button className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
                            <Plus size={16} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span className="text-white">Total:</span>
                      <span className="text-orange-400">
                        ${getCartTotal(cartItems).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <button 
                      onClick={() => {
                        setShowCart(false);
                        router.push('/user/checkout');
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                      Continue to Checkout
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-gray-400">
                  Your cart is empty
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
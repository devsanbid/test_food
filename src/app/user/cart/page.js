'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CreditCard, MapPin, Clock, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getCartFromStorage, 
  saveCartToStorage, 
  updateCartItemQuantity, 
  removeFromCart as removeCartItem, 
  clearCart as clearCartStorage,
  getCartTotal,
  getCartItemsCount
} from '@/utils/cartUtils';

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(2.50);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'pickup'

  useEffect(() => {
    loadCartData();
  }, []);

  const loadCartData = () => {
    try {
      setLoading(true);
      setError('');
      
      // Load cart data from localStorage
      const savedCart = getCartFromStorage();
      setCartItems(savedCart);
      
      // Load other cart settings from localStorage if available
      const cartSettings = localStorage.getItem('cartSettings');
      if (cartSettings) {
        try {
          const settings = JSON.parse(cartSettings);
          setCouponCode(settings.couponCode || '');
          setDiscount(settings.discount || 0);
          setDeliveryFee(settings.deliveryFee || 2.50);
          setOrderType(settings.orderType || 'delivery');
        } catch (e) {
          console.error('Error parsing cart settings:', e);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = (itemIndex, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemIndex);
      return;
    }
    
    try {
      const item = cartItems[itemIndex];
      if (!item) return;
      
      const updatedCart = updateCartItemQuantity(item._id, newQuantity, cartItems);
      setCartItems(updatedCart);
      saveCartToStorage(updatedCart);
      
      // Dispatch custom event to update other components
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast.success('Cart updated successfully');
    } catch (error) {
      console.error('Error updating cart:', error);
      setError('Failed to update cart');
    }
  };

  const handleRemoveItem = (itemIndex) => {
    try {
      const item = cartItems[itemIndex];
      if (!item) return;
      
      const updatedCart = removeCartItem(item._id, cartItems);
      setCartItems(updatedCart);
      saveCartToStorage(updatedCart);
      
      // Dispatch custom event to update other components
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item from cart');
    }
  };

  const saveCartSettings = () => {
    const settings = {
      couponCode,
      discount,
      deliveryFee,
      orderType
    };
    localStorage.setItem('cartSettings', JSON.stringify(settings));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setIsApplyingCoupon(true);
      
      // Get restaurant ID from cart items (assuming all items are from same restaurant)
      const restaurantId = cartItems[0]?.restaurant?._id || cartItems[0]?.restaurantId;
      if (!restaurantId) {
        toast.error('Restaurant information not found');
        return;
      }

      const subtotal = getCartTotal(cartItems);
      
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          restaurantId: restaurantId,
          orderAmount: subtotal,
          items: cartItems
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setDiscount(data.discount.discountAmount);
        saveCartSettings();
        toast.success(`Coupon applied! $${data.discount.discountAmount.toFixed(2)} discount`);
      } else {
        toast.error(data.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    try {
      setDiscount(0);
      setCouponCode('');
      saveCartSettings();
      toast.success('Coupon removed');
    } catch (error) {
      console.error('Error removing coupon:', error);
      toast.error('Failed to remove coupon');
    }
  };

  const subtotal = getCartTotal(cartItems);
  const discountAmount = discount;
  const tax = subtotal * 0.08; // 8% tax
  const serviceFee = subtotal * 0.03; // 3% service fee
  const finalDeliveryFee = orderType === 'delivery' ? deliveryFee : 0;
  const total = subtotal + tax + serviceFee + finalDeliveryFee - discountAmount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold flex items-center">
            <ShoppingCart className="mr-3" />
            Your Cart ({getCartItemsCount(cartItems)} items)
          </h1>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 mx-auto mb-4 text-gray-600" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Add some delicious items to get started!</p>
            <button 
              onClick={() => router.push('/user/foodlist')}
              className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <img 
                      src={item.image || '/images/default-food.jpg'} 
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-gray-400 text-sm">{item.restaurant?.name || 'Restaurant'}</p>
                      <p className="text-orange-500 font-semibold">${item.price.toFixed(2)}</p>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {item.customizations.map((custom, idx) => (
                            <span key={idx}>{custom.name}: {custom.value} </span>
                          ))}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-400 mt-1">Note: {item.specialInstructions}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                      <button 
                        onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      <button 
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-400 mt-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 h-fit order-1 lg:order-2">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Discount ({(discount * 100).toFixed(0)}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-green-500 mt-2">
                    <span>Coupon Applied!</span>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/user/checkout')}
                  className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  <CreditCard className="mr-2 w-5 h-5" />
                  Proceed to Checkout
                </button>
                <button 
                  onClick={() => router.push('/user/foodlist')}
                  className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition-colors"
                >
                  Continue Shopping
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center text-sm text-gray-300">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Estimated delivery: 25-35 mins</span>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
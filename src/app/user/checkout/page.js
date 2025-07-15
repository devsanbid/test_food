'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, Clock, User, Phone, Mail, Home, Building, CheckCircle } from 'lucide-react';
import { getCurrentUserClient } from '@/utils/authUtils';
import { getCartFromStorage, saveCartToStorage, clearCart, getCartTotal, getCartItemsCount } from '@/utils/cartUtils';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const [deliveryDetails, setDeliveryDetails] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    instructions: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const [savedAddresses, setSavedAddresses] = useState([]);

  const [orderItems, setOrderItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2.50;
  const tax = subtotal * 0.08;
  const serviceFee = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax + serviceFee - discount;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUserClient();
        console.log('getCurrentUser result:', userData);
        if (!userData || userData.role !== 'user') {
          console.log('Auth failed: no user data or wrong role');
          router.push('/auth/login');
          return;
        }
        setUser(userData);
        setDeliveryDetails(prev => ({
          ...prev,
          fullName: userData.username || '',
          email: userData.email || ''
        }));
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    const loadCartData = async () => {
      console.log('Loading cart data in checkout...');
      const cartData = getCartFromStorage();
      console.log('Cart data loaded:', cartData);
      
      if (!cartData || cartData.length === 0) {
        console.log('Cart is empty, redirecting to cart page');
        toast.error('Your cart is empty');
        router.push('/user/cart');
        return;
      }
      
      // Load cart settings including discount
      const cartSettings = localStorage.getItem('cartSettings');
      if (cartSettings) {
        try {
          const settings = JSON.parse(cartSettings);
          setDiscount(settings.discount || 0);
          setCouponCode(settings.couponCode || '');
          console.log('Cart settings loaded:', settings);
        } catch (e) {
          console.error('Error parsing cart settings:', e);
        }
      }
      
      // Validate and fix cart items that might be missing the category field
      const validatedCartData = cartData.map(item => {
        if (!item.category) {
          // Set a default category if missing
          return { ...item, category: 'main' };
        }
        return item;
      });
      
      // Update localStorage with validated data if any items were fixed
      if (validatedCartData.some((item, index) => item.category !== cartData[index]?.category)) {
        saveCartToStorage(validatedCartData);
      }
      
      if (validatedCartData.length > 0) {
          try {
            const response = await fetch('/api/user/cart', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                action: 'sync-cart',
                items: validatedCartData,
                discount: discount,
                couponCode: couponCode
              })
            });
          
          const result = await response.json();
          if (result.success) {
            console.log('Cart synced to database successfully');
          } else {
            console.error('Failed to sync cart:', result.message);
            if (result.message.includes('Failed to clear cart')) {
              console.log('Retrying cart sync after delay...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const retryResponse = await fetch('/api/user/cart', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                  action: 'sync-cart',
                  items: validatedCartData,
                  discount: discount,
                  couponCode: couponCode
                })
              });
              
              const retryResult = await retryResponse.json();
              if (retryResult.success) {
                console.log('Cart synced successfully on retry');
              } else {
                console.error('Cart sync failed on retry:', retryResult.message);
              }
            }
          }
        } catch (error) {
          console.error('Cart sync error:', error);
        }
      }
      
      setOrderItems(validatedCartData);
    };

    checkAuth();
    loadCartData();
  }, [router]);

  const handleDeliveryChange = (field, value) => {
    setDeliveryDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (field, value) => {
    setCardDetails(prev => ({ ...prev, [field]: value }));
  };

  const selectSavedAddress = (address) => {
    setDeliveryDetails(prev => ({
      ...prev,
      address: address.address,
      phone: address.phone
    }));
  };

  const validateStep1 = () => {
    return deliveryDetails.fullName && deliveryDetails.phone && deliveryDetails.address && deliveryDetails.city;
  };

  const validateStep2 = () => {
    if (paymentMethod === 'card') {
      return cardDetails.cardNumber && cardDetails.expiryDate && cardDetails.cvv && cardDetails.cardholderName;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateStep2()) {
      alert('Please fill in all required payment details');
      return;
    }
    
    try {
       const orderData = {
         orderType: 'delivery',
         deliveryAddress: {
           street: deliveryDetails.address,
           city: deliveryDetails.city,
           state: 'NY',
           zipCode: deliveryDetails.zipCode,
           phone: deliveryDetails.phone
         },
         paymentMethod: paymentMethod,
         specialInstructions: deliveryDetails.instructions || '',
         tip: 0
       };

       const response = await fetch('/api/user/orders', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         credentials: 'include', // Important: include cookies in the request
         body: JSON.stringify(orderData)
       });

       const result = await response.json();

       if (result.success) {
         // Clear cart from localStorage
         clearCart();
         // Dispatch cart updated event
         window.dispatchEvent(new Event('cartUpdated'));
         
         toast.success('Order placed successfully!');
         router.push('/user/orderhistory');
       } else {
         if (result.message && (result.message.includes('jwt') || result.message.includes('Unauthorized'))) {
           toast.error('Session expired. Please login again.');
           router.push('/auth/login');
         } else {
           toast.error(result.message || 'Failed to place order');
         }
       }
     } catch (error) {
       console.error('Order placement error:', error);
       if (error.message && (error.message.includes('jwt') || error.message.includes('Unauthorized'))) {
         toast.error('Session expired. Please login again.');
         router.push('/auth/login');
       } else {
         toast.error('Failed to place order. Please try again.');
       }
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 1 ? 'bg-orange-500' : 'bg-gray-600'
            }`}>
              {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className={currentStep >= 1 ? 'text-orange-500' : 'text-gray-400'}>Delivery Details</span>
            <div className={`w-16 h-0.5 ${
              currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-600'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-600'
            }`}>
              {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <span className={currentStep >= 2 ? 'text-orange-500' : 'text-gray-400'}>Payment</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <MapPin className="mr-2" />
                  Delivery Information
                </h2>

                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Saved Addresses</h3>
                    <div className="grid gap-3">
                      {savedAddresses.map((address) => (
                        <div 
                          key={address.id}
                          onClick={() => selectSavedAddress(address)}
                          className="p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-orange-500 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                {address.name === 'Home' ? <Home className="w-4 h-4 mr-2" /> : <Building className="w-4 h-4 mr-2" />}
                                <span className="font-medium">{address.name}</span>
                              </div>
                              <p className="text-gray-400 text-sm mt-1">{address.address}</p>
                              <p className="text-gray-400 text-sm">{address.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="my-4 text-center text-gray-400">or enter new address</div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={deliveryDetails.fullName}
                        onChange={(e) => handleDeliveryChange('fullName', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={deliveryDetails.phone}
                        onChange={(e) => handleDeliveryChange('phone', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={deliveryDetails.email}
                        onChange={(e) => handleDeliveryChange('email', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Street Address *</label>
                    <input
                      type="text"
                      value={deliveryDetails.address}
                      onChange={(e) => handleDeliveryChange('address', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                      placeholder="Enter your street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City *</label>
                    <input
                      type="text"
                      value={deliveryDetails.city}
                      onChange={(e) => handleDeliveryChange('city', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                      placeholder="Enter your city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ZIP Code</label>
                    <input
                      type="text"
                      value={deliveryDetails.zipCode}
                      onChange={(e) => handleDeliveryChange('zipCode', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                      placeholder="Enter ZIP code"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Delivery Instructions</label>
                    <textarea
                      value={deliveryDetails.instructions}
                      onChange={(e) => handleDeliveryChange('instructions', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                      rows="3"
                      placeholder="Any special delivery instructions..."
                    />
                  </div>
                </div>

                <button 
                  onClick={() => validateStep1() && setCurrentStep(2)}
                  disabled={!validateStep1()}
                  className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <CreditCard className="mr-2" />
                  Payment Information
                </h2>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Payment Method</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 border border-orange-500 bg-orange-500/10 rounded-lg">
                      <div className="flex items-center justify-center">
                        <span className="text-2xl mb-2 block">💵</span>
                        <span className="text-lg font-medium ml-2">Cash on Delivery</span>
                      </div>
                      <p className="text-sm text-gray-400 text-center mt-2">Pay with cash when your order arrives</p>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Cardholder Name *</label>
                      <input
                        type="text"
                        value={cardDetails.cardholderName}
                        onChange={(e) => handleCardChange('cardholderName', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                        placeholder="Enter cardholder name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Card Number *</label>
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Expiry Date *</label>
                      <input
                        type="text"
                        value={cardDetails.expiryDate}
                        onChange={(e) => handleCardChange('expiryDate', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">CVV *</label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={(e) => handleCardChange('cvv', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                        placeholder="123"
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-4 mt-6">
                  <button 
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handlePlaceOrder}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Place Order (Cash on Delivery)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              {orderItems.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount {couponCode && `(${couponCode})`}</span>
                  <span>-${discount.toFixed(2)}</span>
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
              <div className="flex justify-between">
                <span>Service Fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <hr className="border-gray-700" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center text-sm text-gray-300 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                <span>Estimated delivery: 25-35 mins</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Delivering to: {deliveryDetails.address || 'Address not set'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
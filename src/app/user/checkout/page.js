'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, Clock, User, Phone, Mail, Home, Building, CheckCircle } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

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

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const [savedAddresses] = useState([
    { id: 1, name: 'Home', address: '123 Main St, New York, NY 10001', phone: '+1 (555) 123-4567' },
    { id: 2, name: 'Office', address: '456 Business Ave, New York, NY 10002', phone: '+1 (555) 987-6543' }
  ]);

  const [orderItems] = useState([
    { id: 1, name: "Spicy seasoned seafood noodles", price: 2.29, quantity: 2 },
    { id: 2, name: "Salted pasta with mushroom sauce", price: 2.69, quantity: 1 }
  ]);

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2.50;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'user') {
          router.push('/login');
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
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
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
    
    // Simulate order placement
    router.push('/user/orderconfirmation');
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
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 border rounded-lg transition-colors ${
                        paymentMethod === 'card' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600'
                      }`}
                    >
                      <CreditCard className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Card</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-4 border rounded-lg transition-colors ${
                        paymentMethod === 'cash' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">💵</span>
                      <span className="text-sm">Cash</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('digital')}
                      className={`p-4 border rounded-lg transition-colors ${
                        paymentMethod === 'digital' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">📱</span>
                      <span className="text-sm">Digital</span>
                    </button>
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
                    Place Order
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
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
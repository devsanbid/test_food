"use client"

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, MapPin, Phone, Mail, Star, ArrowRight, Download, Share2, MessageCircle, Truck, Package, ChefHat, Home } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function OrderConfirmation() {
  const [orderStatus, setOrderStatus] = useState('confirmed');
  const [estimatedTime, setEstimatedTime] = useState(35);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'user') {
          router.push('/login');
          return;
        }
        setUserData(user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Simulate order progress
  useEffect(() => {
    const timer = setInterval(() => {
      setEstimatedTime(prev => {
        if (prev > 0) return prev - 1;
        return 0;
      });
    }, 60000); // Update every minute

    // Simulate order status progression
    const statusTimer = setTimeout(() => {
      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
        if (currentStep === 1) setOrderStatus('preparing');
        if (currentStep === 2) setOrderStatus('on-the-way');
        if (currentStep === 3) setOrderStatus('delivered');
      }
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(statusTimer);
    };
  }, [currentStep]);

  const orderData = {
    orderNumber: 'YUM-2024-001234',
    restaurant: 'Pizza Palace',
    items: [
      { name: 'Margherita Pizza', quantity: 1, price: 18.99, image: '🍕' },
      { name: 'Garlic Bread', quantity: 2, price: 6.50, image: '🥖' },
      { name: 'Caesar Salad', quantity: 1, price: 8.99, image: '🥗' },
      { name: 'Coca Cola', quantity: 2, price: 3.99, image: '🥤' }
    ],
    subtotal: 38.47,
    deliveryFee: 2.99,
    tax: 3.31,
    discount: 5.00,
    total: 39.77,
    paymentMethod: '**** 4532',
    deliveryAddress: '123 Main Street, Apt 4B, New York, NY 10001',
    customerPhone: '+1 (555) 123-4567',
    driverName: 'Mike Johnson',
    driverPhone: '+1 (555) 987-6543',
    restaurantPhone: '+1 (555) 456-7890'
  };

  const orderSteps = [
    { id: 1, title: 'Order Confirmed', icon: CheckCircle, description: 'Restaurant received your order' },
    { id: 2, title: 'Preparing', icon: ChefHat, description: 'Your food is being prepared' },
    { id: 3, title: 'On the Way', icon: Truck, description: 'Driver is heading to you' },
    { id: 4, title: 'Delivered', icon: Home, description: 'Enjoy your meal!' }
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Yum Order',
        text: `Order #${orderData.orderNumber} from ${orderData.restaurant}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Order link copied to clipboard!');
    }
  };

  const handleDownloadReceipt = () => {
    // Simulate download
    alert('Receipt download started!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-blue-500';
      case 'preparing': return 'text-yellow-500';
      case 'on-the-way': return 'text-orange-500';
      case 'delivered': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
          <p className="text-gray-400">Thank you for your order. We'll have it ready soon.</p>
          <p className="text-orange-500 font-semibold mt-2">Order #{orderData.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Order Status</h2>
              <div className="space-y-4">
                {orderSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  const isCompleted = currentStep >= step.id;
                  const isCurrent = currentStep === step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center space-x-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${isCompleted ? 'text-white' : 'text-gray-400'}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-500">{step.description}</p>
                        {isCurrent && (
                          <p className="text-sm text-orange-500 mt-1">
                            Estimated: {estimatedTime} minutes
                          </p>
                        )}
                      </div>
                      {index < orderSteps.length - 1 && (
                        <div className={`w-px h-8 ${isCompleted ? 'bg-orange-500' : 'bg-gray-700'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Order Details</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                  <button
                    onClick={handleDownloadReceipt}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Receipt</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-700">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl">
                    🍕
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{orderData.restaurant}</h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <Star className="w-4 h-4 text-orange-400 fill-current" />
                      <span>4.8</span>
                      <span>•</span>
                      <span>Italian</span>
                    </div>
                  </div>
                </div>

                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{item.image}</span>
                      <div>
                        <h4 className="text-white font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-white font-medium">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Call Restaurant</h4>
                    <p className="text-sm text-gray-400">{orderData.restaurantPhone}</p>
                  </div>
                </div>
              </button>

              <button className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Chat with Support</h4>
                    <p className="text-sm text-gray-400">Get help with your order</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            {/* Delivery Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Delivery Information</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400">Delivering to</p>
                    <p className="text-white">{orderData.deliveryAddress}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Your number</p>
                    <p className="text-white">{orderData.customerPhone}</p>
                  </div>
                </div>

                {currentStep >= 3 && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {orderData.driverName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-medium">{orderData.driverName}</p>
                        <p className="text-sm text-gray-400">Your delivery driver</p>
                      </div>
                    </div>
                    <button className="w-full mt-3 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors">
                      Call Driver
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Total */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Order Total</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Sub-total</span>
                  <span>${orderData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Delivery</span>
                  <span>${orderData.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Tax</span>
                  <span>+${orderData.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-500">
                  <span>Discount</span>
                  <span>-${orderData.discount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between text-white font-semibold text-lg">
                    <span>Total</span>
                    <span>${orderData.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  Paid with card ending in {orderData.paymentMethod}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium">
                Reorder
              </button>
              <button className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium">
                Rate Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
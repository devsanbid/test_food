'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, Clock, MapPin, Phone, Mail, Star, ArrowRight, Download, Share2, MessageCircle, Truck, Package, ChefHat, Home, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function OrderConfirmation() {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`/api/user/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }

        const result = await response.json();
        if (result.success) {
          setOrderData(result.data);
        } else {
          setError(result.message || 'Failed to load order details');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, router]);

  const orderSteps = [
    { id: 1, status: 'pending', title: 'Order Confirmed', icon: CheckCircle, description: 'Restaurant received your order' },
    { id: 2, status: 'confirmed', title: 'Confirmed', icon: Package, description: 'Restaurant confirmed your order' },
    { id: 3, status: 'preparing', title: 'Preparing', icon: ChefHat, description: 'Your food is being prepared' },
    { id: 4, status: 'ready', title: 'Ready', icon: Clock, description: 'Order is ready for pickup/delivery' },
    { id: 5, status: 'out-for-delivery', title: 'On the Way', icon: Truck, description: 'Driver is heading to you' },
    { id: 6, status: 'delivered', title: 'Delivered', icon: Home, description: 'Enjoy your meal!' }
  ];

  const getCurrentStep = (status) => {
    const stepMap = {
      'pending': 1,
      'confirmed': 2,
      'preparing': 3,
      'ready': 4,
      'out-for-delivery': 5,
      'delivered': 6,
      'cancelled': 0
    };
    return stepMap[status] || 1;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My FoodSewa Order',
        text: `Order #${orderData?.orderNumber} from ${orderData?.restaurant?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Order link copied to clipboard!');
    }
  };

  const handleDownloadReceipt = () => {
    toast.info('Receipt download feature coming soon!');
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading order details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 text-xl mb-4">{error || 'Order not found'}</div>
          <button
            onClick={() => router.push('/user/orders')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            View All Orders
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStep = getCurrentStep(orderData.status);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
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
            <p className="text-gray-400 text-sm mt-1">{formatDate(orderData.createdAt)}</p>
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
                          {isCurrent && orderData.estimatedDeliveryTime && (
                            <p className="text-sm text-orange-500 mt-1">
                              Estimated: {formatTime(orderData.estimatedDeliveryTime)}
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
                  {orderData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                          {item.specialInstructions && (
                            <p className="text-gray-500 text-xs mt-1">{item.specialInstructions}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-white font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary & Contact */}
            <div className="space-y-6">
              {/* Restaurant Info */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Restaurant</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{orderData.restaurant?.name?.charAt(0) || 'R'}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{orderData.restaurant?.name || 'Restaurant'}</h4>
                      <p className="text-gray-400 text-sm">{orderData.restaurant?.cuisine || 'Cuisine'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              {orderData.orderType === 'delivery' && orderData.deliveryAddress && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Delivery Address</h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                      <div className="text-gray-300 text-sm">
                        <p>{orderData.deliveryAddress.street}</p>
                        <p>{orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} {orderData.deliveryAddress.zipCode}</p>
                      </div>
                    </div>
                    {orderData.deliveryAddress.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-300 text-sm">{orderData.deliveryAddress.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>${orderData.pricing?.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {orderData.pricing?.deliveryFee > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>Delivery Fee</span>
                      <span>${orderData.pricing.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {orderData.pricing?.serviceFee > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>Service Fee</span>
                      <span>${orderData.pricing.serviceFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-300">
                    <span>Tax</span>
                    <span>${orderData.pricing?.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  {orderData.pricing?.discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-${orderData.pricing.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {orderData.pricing?.tip > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>Tip</span>
                      <span>${orderData.pricing.tip.toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="border-gray-700" />
                  <div className="flex justify-between text-lg font-semibold text-white">
                    <span>Total</span>
                    <span>${orderData.pricing?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    {orderData.payment?.method === 'card' && <CreditCard className="w-5 h-5 text-gray-400" />}
                    {orderData.payment?.method === 'cash' && <span className="text-gray-400 text-xs">💵</span>}
                    {orderData.payment?.method === 'digital' && <Phone className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">{orderData.payment?.method || 'N/A'}</p>
                    <p className="text-gray-400 text-sm capitalize">{orderData.payment?.status || 'Pending'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/user/orders')}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>View All Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push('/user/restaurants')}
                  className="w-full bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Order Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
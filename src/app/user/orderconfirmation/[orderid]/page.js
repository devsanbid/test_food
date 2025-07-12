'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Clock, Truck, Package, Star, Share2, Download, Phone, MessageCircle, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OrderConfirmation() {
  const params = useParams();
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  const orderId = params.orderid;

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`/api/user/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/auth/login');
            return;
          }
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        if (data.success) {
          setOrderData(data.data.order);
        } else {
          throw new Error(data.message || 'Failed to fetch order details');
        }
        
        if (data.success && data.data.order.estimatedDeliveryTime) {
          const now = new Date();
          const deliveryTime = new Date(data.data.order.estimatedDeliveryTime);
          const timeDiff = Math.max(0, Math.floor((deliveryTime - now) / (1000 * 60)));
          setEstimatedTime(timeDiff);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  useEffect(() => {
    if (!orderData) return;

    setCurrentStep(getStatusStep(orderData.status));

    const timer = setInterval(() => {
      setEstimatedTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [orderData]);

  const getStatusStep = (status) => {
    switch (status) {
      case 'pending':
      case 'confirmed': return 1;
      case 'preparing': return 2;
      case 'ready':
      case 'out-for-delivery': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'Address not provided';
    if (typeof address === 'string') return address;
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '');
  };

  const formatPaymentMethod = (payment) => {
    if (!payment) return 'Payment method not specified';
    if (payment.method === 'card') {
      return `Paid with card ending in ${payment.cardLastFour || '****'}`;
    }
    return `Paid with ${payment.method || 'unknown method'}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'confirmed': return 'text-blue-500';
      case 'preparing':
      case 'ready': return 'text-yellow-500';
      case 'out-for-delivery': return 'text-orange-500';
      case 'delivered': return 'text-green-500';
      case 'cancelled': return 'text-red-500';
      case 'refunded': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My FoodSewa Order',
          text: `I just ordered from ${orderData.restaurant?.name || 'a restaurant'}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  const handleDownloadReceipt = () => {
    console.log('Download receipt');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <button 
            onClick={() => router.back()}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">No order data found</div>
      </div>
    );
  }

  const orderSteps = [
    { id: 1, title: 'Order Confirmed', description: 'Your order has been received', icon: CheckCircle },
    { id: 2, title: 'Preparing', description: 'Restaurant is preparing your food', icon: Package },
    { id: 3, title: orderData.orderType === 'pickup' ? 'Ready for Pickup' : 'On the Way', description: orderData.orderType === 'pickup' ? 'Your order is ready' : 'Driver is on the way', icon: orderData.orderType === 'pickup' ? Package : Truck },
    { id: 4, title: orderData.orderType === 'pickup' ? 'Picked Up' : 'Delivered', description: orderData.orderType === 'pickup' ? 'Order picked up' : 'Enjoy your meal!', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {orderData.status === 'delivered' ? 'Order Delivered!' : 
             orderData.status === 'cancelled' ? 'Order Cancelled' :
             orderData.status === 'refunded' ? 'Order Refunded' : 'Order Confirmed!'}
          </h1>
          <p className="text-gray-400">
            {orderData.status === 'delivered' ? 'Your order has been delivered. Enjoy your meal!' :
             orderData.status === 'cancelled' ? 'Your order has been cancelled.' :
             orderData.status === 'refunded' ? 'Your order has been refunded.' :
             'Thank you for your order. We\'ll have it ready soon.'}
          </p>
          <p className="text-orange-500 font-semibold mt-2">Order #{orderData.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Order Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
                  {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-6">
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
                    <h3 className="text-white font-medium">{orderData.restaurant?.name || 'Restaurant'}</h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <Star className="w-4 h-4 text-orange-400 fill-current" />
                      <span>{orderData.restaurant?.rating || '4.8'}</span>
                      <span>•</span>
                      <span>{orderData.restaurant?.cuisine || 'Restaurant'}</span>
                    </div>
                  </div>
                </div>

                {orderData.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🍽️</span>
                      <div>
                        <h4 className="text-white font-medium">{item.menuItem?.name || item.name}</h4>
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                        {item.customizations && item.customizations.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {item.customizations.map(c => c.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-white font-medium">${item.price.toFixed(2)}</span>
                  </div>
                )) || []}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Call Restaurant</h4>
                    <p className="text-sm text-gray-400">{orderData.restaurant?.phone || 'Contact restaurant'}</p>
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

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Delivery Information</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-400">
                      {orderData.orderType === 'pickup' ? 'Pickup from' : 'Delivering to'}
                    </p>
                    <p className="text-white">
                      {orderData.orderType === 'pickup' 
                        ? orderData.restaurant?.address || 'Restaurant address'
                        : formatAddress(orderData.deliveryAddress)
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-400">Your number</p>
                    <p className="text-white">{orderData.customer?.phone || 'Phone number'}</p>
                  </div>
                </div>

                {orderData.orderType === 'delivery' && orderData.trackingInfo?.driverName && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {orderData.trackingInfo.driverName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-medium">{orderData.trackingInfo.driverName}</p>
                        <p className="text-sm text-gray-400">Your delivery driver</p>
                      </div>
                    </div>
                    {orderData.trackingInfo.driverPhone && (
                      <button className="w-full mt-3 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors">
                        Call Driver
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Order Total</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Sub-total</span>
                  <span>${orderData.pricing?.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {orderData.orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-300">
                    <span>Delivery Fee</span>
                    <span>${orderData.pricing?.deliveryFee?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                {orderData.pricing?.serviceFee > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>Service Fee</span>
                    <span>${orderData.pricing?.serviceFee?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300">
                  <span>Tax</span>
                  <span>+${orderData.pricing?.tax?.toFixed(2) || '0.00'}</span>
                </div>
                {orderData.pricing?.discount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Discount</span>
                    <span>-${orderData.pricing?.discount?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                {orderData.pricing?.tip > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>Tip</span>
                    <span>${orderData.pricing?.tip?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between text-white font-semibold text-lg">
                    <span>Total</span>
                    <span>${orderData.pricing?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  {formatPaymentMethod(orderData.payment)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium">
                Reorder
              </button>
              {orderData.status === 'delivered' && !orderData.rating && (
                <button className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium">
                  Rate Order
                </button>
              )}
              {['pending', 'confirmed', 'preparing'].includes(orderData.status) && (
                <button className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium">
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
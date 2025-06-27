"use client"
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/actions/authActions';
import { 
  ArrowLeft,
  Truck,
  Package,
  Clock,
  CheckCircle,
  X,
  Edit,
  Save,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  User,
  Store
} from 'lucide-react';

const OrderDetailsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState('');

  // Authentication check
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch order details
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || user.role !== 'admin') {
        router.push('/auth/login');
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders?id=${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      setOrder(data.order);
      setEditedStatus(data.order.status);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error.message);
      setToast({ message: 'Failed to load order details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const response = await fetch(`/api/admin/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order._id,
          action: 'update-status',
          status: editedStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const data = await response.json();
      setOrder(prev => ({ ...prev, status: editedStatus }));
      setIsEditing(false);
      setToast({ message: 'Order status updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ message: 'Failed to update order status', type: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-black';
      case 'confirmed': return 'bg-blue-500 text-white';
      case 'preparing': return 'bg-purple-500 text-white';
      case 'ready': return 'bg-indigo-500 text-white';
      case 'out_for_delivery': return 'bg-orange-500 text-white';
      case 'delivered': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { id: 'pending', title: 'Order Received', icon: Package },
      { id: 'confirmed', title: 'Confirmed', icon: CheckCircle },
      { id: 'preparing', title: 'Preparing', icon: Clock },
      { id: 'ready', title: 'Ready', icon: CheckCircle },
      { id: 'out_for_delivery', title: 'Out for Delivery', icon: Truck },
      { id: 'delivered', title: 'Delivered', icon: CheckCircle }
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Toast Component
  const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 
        'bg-blue-600'
      } text-white`}>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <button onClick={onClose} className="ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested order could not be found.'}</p>
          <button
            onClick={() => router.push('/admin/order/list')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/order/list')}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Orders
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600">Order #{order.orderNumber || order._id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedStatus(order.status);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Status
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order Date</p>
                  <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order Number</p>
                  <p className="font-medium text-gray-900">#{order.orderNumber || order._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Restaurant</p>
                  <p className="font-medium text-gray-900">{order.restaurant?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Customer</p>
                  <p className="font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Customer & Delivery Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-orange-500" />
                  Customer Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{order.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{order.user?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                  Delivery Address
                </h3>
                <div className="space-y-3">
                  {order.deliveryAddress ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium text-gray-900">
                          {order.deliveryAddress.street}, {order.deliveryAddress.city}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Postal Code</p>
                        <p className="font-medium text-gray-900">{order.deliveryAddress.postalCode}</p>
                      </div>
                      {order.deliveryAddress.instructions && (
                        <div>
                          <p className="text-sm text-gray-500">Instructions</p>
                          <p className="font-medium text-gray-900">{order.deliveryAddress.instructions}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">No delivery address provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-orange-500" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal || 0)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span className="text-red-500">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee:</span>
                  <span>{formatCurrency(order.deliveryFee || 0)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax:</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-gray-900 font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Restaurant Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Store className="w-5 h-5 mr-2 text-orange-500" />
                Restaurant Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Restaurant Name</p>
                  <p className="font-medium text-gray-900">{order.restaurant?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Contact</p>
                  <p className="font-medium text-gray-900">{order.restaurant?.phone || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="font-medium text-gray-900">{order.restaurant?.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Order Progress */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h3>
              <div className="space-y-4">
                {getStatusSteps(order.status).map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        step.completed ? 'bg-green-500' : step.active ? 'bg-orange-500' : 'bg-gray-300'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          step.completed || step.active ? 'text-white' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className={`text-sm font-medium ${
                          step.completed || step.active ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </div>
                        {step.active && (
                          <div className="text-xs text-orange-600 mt-1">Current Status</div>
                        )}
                      </div>
                      {step.completed && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-gray-600 font-medium">Item</th>
                      <th className="text-left py-3 text-gray-600 font-medium">Price</th>
                      <th className="text-left py-3 text-gray-600 font-medium">Quantity</th>
                      <th className="text-right py-3 text-gray-600 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{item.name || item.dish?.name || 'N/A'}</div>
                                {item.description && (
                                  <div className="text-sm text-gray-500">{item.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-gray-600">{formatCurrency(item.price || 0)}</td>
                          <td className="py-4 text-gray-600">{item.quantity || 1}</td>
                          <td className="py-4 text-right text-gray-900 font-medium">
                            {formatCurrency((item.price || 0) * (item.quantity || 1))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-500">
                          No items found in this order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Payment Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-orange-500" />
                Payment Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900">{order.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus || 'Unknown'}
                  </span>
                </div>
                {order.transactionId && (
                  <div>
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-medium text-gray-900">{order.transactionId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-500" />
                  Order Timeline
                </h3>
                <div className="space-y-4">
                  {order.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {history.status.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(history.timestamp)}
                        </p>
                        {history.note && (
                          <p className="text-xs text-gray-600 mt-1">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Information */}
            {order.deliveryPerson && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-orange-500" />
                  Delivery Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Delivery Person</p>
                    <p className="font-medium text-gray-900">{order.deliveryPerson.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium text-gray-900">{order.deliveryPerson.phone}</p>
                  </div>
                  {order.estimatedDeliveryTime && (
                    <div>
                      <p className="text-sm text-gray-500">Estimated Delivery</p>
                      <p className="font-medium text-gray-900">{formatDate(order.estimatedDeliveryTime)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

 
        </div>
      </div>
    </div>
    </div>
  );
}

export default OrderDetailsPage;
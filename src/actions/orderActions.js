export async function getUserOrders(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetch(`/api/user/orders?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch orders');
    }

    const data = await response.json();
    
    return {
      orders: data.data?.orders || [],
      pagination: data.data?.pagination || {},
      stats: data.data?.stats || {},
      favoriteRestaurants: data.data?.favoriteRestaurants || []
    };
  } catch (error) {
    console.error('Get orders error:', error);
    throw error;
  }
}

export async function getOrderById(orderId) {
  try {
    const response = await fetch(`/api/user/orders/${orderId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order details');
    }

    return data;
  } catch (error) {
    console.error('Get order details error:', error);
    throw error;
  }
}

export async function cancelOrder(orderId, reason = '') {
  try {
    const response = await fetch(`/api/user/orders/${orderId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
        reason
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel order');
    }

    return data;
  } catch (error) {
    console.error('Cancel order error:', error);
    throw error;
  }
}

export async function reorderItems(orderId) {
  try {
    const response = await fetch(`/api/user/orders/${orderId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'reorder'
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reorder items');
    }

    return data;
  } catch (error) {
    console.error('Reorder error:', error);
    throw error;
  }
}
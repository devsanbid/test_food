// Get menu items from all restaurants
export async function getMenuItems(params = {}) {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.cuisine) queryParams.append('cuisine', params.cuisine);
    if (params.priceRange) queryParams.append('priceRange', params.priceRange);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.latitude) queryParams.append('latitude', params.latitude.toString());
    if (params.longitude) queryParams.append('longitude', params.longitude.toString());
    if (params.maxDistance) queryParams.append('maxDistance', params.maxDistance.toString());

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/user/menu?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch menu items');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
}

// Add item to cart
export async function addToCart(restaurantId, menuItemId, quantity = 1, customizations = {}) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/user/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        restaurantId,
        menuItemId,
        quantity,
        customizations
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add item to cart');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

// Get cart items
export async function getCart() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/user/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch cart');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}

// Update cart item quantity
export async function updateCartItem(itemId, quantity) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/user/cart`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        itemId,
        quantity
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update cart item');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

// Remove item from cart
export async function removeFromCart(itemId) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/user/cart`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        itemId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove item from cart');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}
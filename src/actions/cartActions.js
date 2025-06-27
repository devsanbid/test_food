export async function getCart() {
  try {
    const response = await fetch('/api/user/cart', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch cart');
    }

    return data;
  } catch (error) {
    console.error('Get cart error:', error);
    throw error;
  }
}

export async function addToCart(itemData) {
  try {
    const response = await fetch('/api/user/cart', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add item to cart');
    }

    return data;
  } catch (error) {
    console.error('Add to cart error:', error);
    throw error;
  }
}

export async function updateCartItem(updateData) {
  try {
    const response = await fetch('/api/user/cart', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update cart item');
    }

    return data;
  } catch (error) {
    console.error('Update cart item error:', error);
    throw error;
  }
}

export async function removeFromCart(itemIndex) {
  try {
    const response = await fetch('/api/user/cart', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'remove-item',
        itemIndex
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove item from cart');
    }

    return data;
  } catch (error) {
    console.error('Remove from cart error:', error);
    throw error;
  }
}

export async function updateQuantity(itemIndex, quantity) {
  try {
    const response = await fetch('/api/user/cart', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update-quantity',
        itemIndex,
        quantity
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update quantity');
    }

    return data;
  } catch (error) {
    console.error('Update quantity error:', error);
    throw error;
  }
}

export async function applyCoupon(couponCode) {
  try {
    const response = await fetch('/api/user/cart', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'apply-coupon',
        couponCode
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to apply coupon');
    }

    return data;
  } catch (error) {
    console.error('Apply coupon error:', error);
    throw error;
  }
}

export async function removeCoupon() {
  try {
    const response = await fetch('/api/user/cart', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'remove-coupon'
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove coupon');
    }

    return data;
  } catch (error) {
    console.error('Remove coupon error:', error);
    throw error;
  }
}

export async function clearCart() {
  try {
    const response = await fetch('/api/user/cart', {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to clear cart');
    }

    return data;
  } catch (error) {
    console.error('Clear cart error:', error);
    throw error;
  }
}
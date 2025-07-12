// Cart utility functions for localStorage management

const CART_STORAGE_KEY = 'foodSewaCart';

/**
 * Get cart items from localStorage
 * @returns {Array} Array of cart items
 */
export const getCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    console.log('Getting cart from storage:', savedCart);
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];
    console.log('Parsed cart:', parsedCart);
    return parsedCart;
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
};

/**
 * Save cart items to localStorage
 * @param {Array} cartItems - Array of cart items to save
 * @returns {boolean} Success status
 */
export const saveCartToStorage = (cartItems) => {
  try {
    console.log('Saving cart to storage:', cartItems);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    console.log('Cart saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
    return false;
  }
};

/**
 * Add item to cart
 * @param {Object} dish - Dish object to add
 * @param {Array} currentCart - Current cart items
 * @returns {Array} Updated cart items
 */
export const addToCart = (dish, currentCart = []) => {
  const existingItem = currentCart.find(item => item._id === dish._id);
  
  if (existingItem) {
    return currentCart.map(item => 
      item._id === dish._id 
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }
  
  // Extract restaurantId from dish.restaurant._id for compatibility with sync-cart API
  const dishWithRestaurantId = {
    ...dish,
    restaurantId: dish.restaurant?._id || dish.restaurantId,
    quantity: 1
  };
  
  return [...currentCart, dishWithRestaurantId];
};

/**
 * Remove item from cart
 * @param {string} dishId - ID of dish to remove
 * @param {Array} currentCart - Current cart items
 * @returns {Array} Updated cart items
 */
export const removeFromCart = (dishId, currentCart = []) => {
  return currentCart.filter(item => item._id !== dishId);
};

/**
 * Update item quantity in cart
 * @param {string} dishId - ID of dish to update
 * @param {number} quantity - New quantity
 * @param {Array} currentCart - Current cart items
 * @returns {Array} Updated cart items
 */
export const updateCartItemQuantity = (dishId, quantity, currentCart = []) => {
  if (quantity <= 0) {
    return removeFromCart(dishId, currentCart);
  }
  
  return currentCart.map(item => 
    item._id === dishId 
      ? { ...item, quantity }
      : item
  );
};

/**
 * Clear all items from cart
 * @returns {Array} Empty array
 */
export const clearCart = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  return [];
};

/**
 * Get total cart value
 * @param {Array} cartItems - Cart items
 * @returns {number} Total price
 */
export const getCartTotal = (cartItems = []) => {
  return cartItems.reduce((total, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    return total + (price * quantity);
  }, 0);
};

/**
 * Get total cart items count
 * @param {Array} cartItems - Cart items
 * @returns {number} Total quantity
 */
export const getCartItemsCount = (cartItems = []) => {
  return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
};
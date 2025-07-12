const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
    return token ? {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    } : {
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

export async function getFavorites(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}/api/favorites${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch favorites' }));
      throw new Error(errorData.message || 'Failed to fetch favorites');
    }

    const data = await response.json();
    return {
      favorites: data.data.favorites || [],
      pagination: data.data.pagination || {},
      stats: data.data.stats || {}
    };
  } catch (error) {
    console.error('Get favorites error:', error);
    throw error;
  }
}

export async function getUserFavorites(params = {}) {
  try {
    const favoritesData = await getFavorites({ ...params, type: 'restaurant' });
    return {
      restaurants: favoritesData.favorites.map(fav => fav.restaurant).filter(Boolean),
      pagination: favoritesData.pagination,
      stats: favoritesData.stats
    };
  } catch (error) {
    console.error('Get user favorites error:', error);
    throw error;
  }
}

export async function getUserFavoriteDishes(params = {}) {
  try {
    const favoritesData = await getFavorites({ ...params, type: 'dish' });
    return {
      dishes: favoritesData.favorites.map(fav => ({
        _id: fav.dish._id,
        restaurantId: fav.restaurant._id,
        menuItemId: fav.dish._id,
        name: fav.dish.name,
        price: fav.dish.price,
        image: fav.dish.image,
        addedAt: fav.addedAt,
        restaurant: fav.restaurant
      })).filter(dish => dish.name),
      pagination: favoritesData.pagination,
      stats: favoritesData.stats
    };
  } catch (error) {
    console.error('Get favorite dishes error:', error);
    throw error;
  }
}

export async function addToFavorites(restaurantId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ 
        restaurantId,
        type: 'restaurant'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add to favorites' }));
      throw new Error(errorData.message || 'Failed to add to favorites');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Add to favorites error:', error);
    throw error;
  }
}

export async function removeFromFavorites(restaurantId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites?restaurantId=${restaurantId}&type=restaurant`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to remove from favorites' }));
      throw new Error(errorData.message || 'Failed to remove from favorites');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Remove from favorites error:', error);
    throw error;
  }
}

export async function addDishToFavorites(dishData) {
  try {
    const { restaurantId, menuItemId, name, price, image, category } = dishData;
    
    const response = await fetch(`${API_BASE_URL}/api/favorites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        restaurantId,
        menuItemId,
        type: 'dish',
        dishDetails: {
          name,
          price,
          image,
          category
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add dish to favorites' }));
      throw new Error(errorData.message || 'Failed to add dish to favorites');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Add dish to favorites error:', error);
    throw error;
  }
}

export async function removeDishFromFavorites(restaurantId, menuItemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites?restaurantId=${restaurantId}&menuItemId=${menuItemId}&type=dish`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to remove dish from favorites' }));
      throw new Error(errorData.message || 'Failed to remove dish from favorites');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Remove dish from favorites error:', error);
    throw error;
  }
}

export async function clearAllFavorites() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites?removeAll=true`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to clear favorites' }));
      throw new Error(errorData.message || 'Failed to clear favorites');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Clear favorites error:', error);
    throw error;
  }
}
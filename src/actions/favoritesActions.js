'use server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getUserFavorites(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}/api/user/favorites${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch favorites' }));
      throw new Error(errorData.message || 'Failed to fetch favorites');
    }

    const data = await response.json();
    return {
      restaurants: data.data.restaurants || [],
      pagination: data.data.pagination || {},
      stats: data.data.stats || {}
    };
  } catch (error) {
    console.error('Get favorites error:', error);
    throw error;
  }
}

export async function addToFavorites(restaurantId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ restaurantId })
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
    const response = await fetch(`${API_BASE_URL}/api/user/favorites?restaurantId=${restaurantId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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

export async function clearAllFavorites() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/favorites?removeAll=true`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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

export async function addDishToFavorites(dishData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/favorites/dishes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(dishData)
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
    const response = await fetch(`${API_BASE_URL}/api/user/favorites/dishes?restaurantId=${restaurantId}&menuItemId=${menuItemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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

export async function getUserFavoriteDishes(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}/api/user/favorites/dishes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch favorite dishes' }));
      throw new Error(errorData.message || 'Failed to fetch favorite dishes');
    }

    const data = await response.json();
    return {
      dishes: data.data.dishes || [],
      pagination: data.data.pagination || {},
      stats: data.data.stats || {}
    };
  } catch (error) {
    console.error('Get favorite dishes error:', error);
    throw error;
  }
}
'use server';

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getRestaurants(params = {}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const searchParams = new URLSearchParams();
    
    if (params.search) searchParams.append('search', params.search);
    if (params.cuisine) searchParams.append('cuisine', params.cuisine);
    if (params.priceRange) searchParams.append('priceRange', params.priceRange);
    if (params.rating) searchParams.append('rating', params.rating);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.latitude) searchParams.append('latitude', params.latitude);
    if (params.longitude) searchParams.append('longitude', params.longitude);
    if (params.maxDistance) searchParams.append('maxDistance', params.maxDistance);
    if (params.isOpen !== undefined) searchParams.append('isOpen', params.isOpen);
    if (params.features) searchParams.append('features', params.features.join(','));

    const url = `${API_BASE_URL}/api/user/restaurants${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch restaurants' }));
      throw new Error(errorData.message || 'Failed to fetch restaurants');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch restaurants');
    }

    return result.data;
  } catch (error) {
    console.error('Get restaurants error:', error);
    throw error;
  }
}

export async function getRestaurantById(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/api/user/restaurants/${id}?includeMenu=true&includeReviews=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch restaurant' }));
      throw new Error(errorData.message || 'Failed to fetch restaurant');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch restaurant');
    }

    return result.data;
  } catch (error) {
    console.error('Get restaurant error:', error);
    throw error;
  }
}

export async function addToFavorites(restaurantId) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/api/user/favorites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ restaurantId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add to favorites' }));
      throw new Error(errorData.message || 'Failed to add to favorites');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to add to favorites');
    }

    return result.data;
  } catch (error) {
    console.error('Add to favorites error:', error);
    throw error;
  }
}

export async function removeFromFavorites(restaurantId) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/api/user/favorites`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ restaurantId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to remove from favorites' }));
      throw new Error(errorData.message || 'Failed to remove from favorites');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to remove from favorites');
    }

    return result.data;
  } catch (error) {
    console.error('Remove from favorites error:', error);
    throw error;
  }
}
// Client-side authentication utilities

/**
 * Get current user from client-side (browser environment)
 * This function works with httpOnly cookies and makes API calls from the browser
 */
export async function getCurrentUserClient() {
  try {
    // Make API call without manually handling tokens since cookies are httpOnly
    const response = await fetch('/api/auth', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Important: include cookies in the request
    });

    const result = await response.json();

    if (!result.success) {
      return null;
    }

    return result.user;
  } catch (error) {
    console.error('Client auth check failed:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (client-side)
 * Since we use httpOnly cookies, we need to make an API call to check
 */
export async function isAuthenticated() {
  try {
    const user = await getCurrentUserClient();
    return !!user;
  } catch (error) {
    return false;
  }
}

/**
 * Get authentication token (client-side)
 * Note: With httpOnly cookies, tokens are not accessible from JavaScript
 * This function is kept for backward compatibility but will return null
 */
export function getAuthToken() {
  console.warn('getAuthToken: Tokens are stored in httpOnly cookies and not accessible from JavaScript');
  return null;
}

/**
 * Clear authentication data (client-side)
 * Makes API call to clear httpOnly cookies
 */
export async function clearAuthData() {
  try {
    await fetch('/api/auth', {
      method: 'DELETE',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
}
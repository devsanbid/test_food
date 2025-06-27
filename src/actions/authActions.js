'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function registerAction(formData) {
  try {
    const userData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role') || 'user'
    };

    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        ...userData
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message
      };
    }

    const cookieStore = await cookies();
    cookieStore.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    return {
      success: true,
      message: result.message,
      user: result.user
    };
  } catch (error) {
    return {
      success: false,
      message: 'Registration failed. Please try again.'
    };
  }
}

export async function loginAction(formData) {
  try {
    const loginData = {
      identifier: formData.get('identifier'),
      password: formData.get('password')
    };

    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        ...loginData
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message
      };
    }

    const cookieStore = await cookies();
    cookieStore.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    return {
      success: true,
      message: result.message,
      user: result.user
    };
  } catch (error) {
    return {
      success: false,
      message: 'Login failed. Please try again.'
    };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Logout failed'
    };
  }
}

export async function forgotPasswordAction(formData) {
  try {
    const email = formData.get('email');

    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'forgot-password',
        email
      }),
    });

    const result = await response.json();

    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send reset email. Please try again.'
    };
  }
}

export async function resetPasswordAction(formData) {
  try {
    const resetData = {
      resetToken: formData.get('resetToken'),
      newPassword: formData.get('newPassword')
    };

    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'reset-password',
        ...resetData
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message
      };
    }

    const cookieStore = await cookies();
    cookieStore.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    return {
      success: true,
      message: result.message
    };
  } catch (error) {
    return {
      success: false,
      message: 'Password reset failed. Please try again.'
    };
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
    });

    const result = await response.json();

    if (!result.success) {
      return null;
    }

    return result.user;
  } catch (error) {
    return null;
  }
}

export async function getDashboardData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    console.log("token: ", token)

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("responsessss: ", response)

    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error Response:', errorText);
      throw new Error(`Failed to fetch dashboard data: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.log('JSON Parse Error:', parseError);
      throw new Error('Invalid JSON response from server');
    }

    if (!result.success) {
      throw new Error(result.message || 'Failed to load dashboard data');
    }

    return result.data;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function redirectBasedOnRole(user) {
  if (!user) {
    redirect('/login');
  }

  switch (user.role) {
    case 'admin':
      redirect('/admin/dashboard');
      break;
    case 'restaurant':
      redirect('/restaurant/dashboard');
      break;
    case 'user':
      redirect('/user/dashboard');
      break;
    default:
      redirect('/login');
  }
}

import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = async (request) => {
  try {
    let token;
    
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get token from cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.token;
      }
    }
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const authorize = (...roles) => {
  return (user) => {
    if (!roles.includes(user.role)) {
      throw new Error('Access denied. Insufficient permissions.');
    }
    return true;
  };
};

export const adminOnly = (user) => {
  if (user.role !== 'admin') {
    throw new Error('Access denied. Admin only.');
  }
  return true;
};

export const restaurantOnly = (user) => {
  if (user.role !== 'restaurant') {
    throw new Error('Access denied. Restaurant only.');
  }
  return true;
};

export const userOnly = (user) => {
  if (user.role !== 'user') {
    throw new Error('Access denied. User only.');
  }
  return true;
};

export const extractTokenFromCookies = (request) => {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;
  
  const tokenCookie = cookies
    .split(';')
    .find(cookie => cookie.trim().startsWith('token='));
  
  if (!tokenCookie) return null;
  
  return tokenCookie.split('=')[1];
};

export const createAuthResponse = (data, token = null) => {
  const response = Response.json(data);
  
  if (token) {
    response.headers.set(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
    );
  }
  
  return response;
};

export const clearAuthCookie = () => {
  const response = Response.json({ success: true, message: 'Logged out successfully' });
  response.headers.set(
    'Set-Cookie',
    'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
  );
  return response;
};
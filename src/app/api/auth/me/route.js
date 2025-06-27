import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { extractTokenFromCookies } from '@/middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request) {
  try {
    const token = extractTokenFromCookies(request);
    
    if (!token) {
      return Response.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return Response.json(
        { success: false, message: 'Account is deactivated' },
        { status: 403 }
      );
    }

    return Response.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return Response.json(
      { success: false, message: 'Invalid token' },
      { status: 401 }
    );
  }
}
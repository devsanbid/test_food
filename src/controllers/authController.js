import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (user) => {
  return jwt.sign({ 
    id: user._id, 
    role: user.role,
    email: user.email 
  }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

export const registerUser = async (userData) => {
  try {
    await connectDB();

    const { firstName, lastName, username, email, password, role = 'user' } = userData;

    if (!firstName || !lastName || !username || !email || !password) {
      throw new Error('All fields are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already exists');
      }
      if (existingUser.username === username) {
        throw new Error('Username already exists');
      }
    }

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
      role
    });

    const token = generateToken(user);

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      token
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const loginUser = async (loginData) => {
  try {
    await connectDB();

    const { identifier, password } = loginData;

    if (!identifier || !password) {
      throw new Error('Please provide email/username and password');
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    }).select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user);

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      token
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const forgotPassword = async (email) => {
  try {
    await connectDB();

    if (!email) {
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('User not found with this email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    return {
      success: true,
      message: 'Password reset token generated',
      resetToken
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const resetPassword = async (resetToken, newPassword) => {
  try {
    await connectDB();

    if (!resetToken || !newPassword) {
      throw new Error('Reset token and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const token = generateToken(user);

    return {
      success: true,
      message: 'Password reset successful',
      token
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getUserProfile = async (userId) => {
  try {
    await connectDB();

    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateUserProfile = async (userId, updateData) => {
  try {
    await connectDB();

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'profileImage'];
    const updates = {};

    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      user
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
};
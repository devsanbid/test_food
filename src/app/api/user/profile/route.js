import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// GET - Get user profile
export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const userProfile = await User.findById(user.id).select('-password -resetPasswordToken -verificationToken');
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { firstName, lastName, username, email, phone, dateOfBirth, address, preferences } = body;

    // Validate required fields
    if (!firstName || !lastName || !username || !email) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, username, and email are required' },
        { status: 400 }
      );
    }

    // Check if username or email already exists (excluding current user)
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: user.id } },
        {
          $or: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() }
          ]
        }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 400 }
        );
      }
      if (existingUser.username === username.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: 'Username already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      updatedAt: new Date()
    };

    // Add optional fields if provided
    if (phone) updateData.phone = phone.trim();
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (address) updateData.address = address;
    if (preferences) updateData.preferences = preferences;

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -verificationToken');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, message: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update password
export async function PATCH(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'All password fields are required' },
        { status: 400 }
      );
    }

    // Validate new password
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if new password matches confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'New password and confirmation do not match' },
        { status: 400 }
      );
    }

    // Get user with password
    const userWithPassword = await User.findById(user.id);
    if (!userWithPassword) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(user.id, {
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user account
export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { password, confirmDeletion } = body;

    // Validate required fields
    if (!password || !confirmDeletion) {
      return NextResponse.json(
        { success: false, message: 'Password and confirmation are required' },
        { status: 400 }
      );
    }

    if (confirmDeletion !== 'DELETE') {
      return NextResponse.json(
        { success: false, message: 'Please type DELETE to confirm account deletion' },
        { status: 400 }
      );
    }

    // Get user with password
    const userWithPassword = await User.findById(user.id);
    if (!userWithPassword) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Password is incorrect' },
        { status: 400 }
      );
    }

    // TODO: Add cleanup logic for user's orders, reviews, etc.
    // For now, we'll just delete the user account
    await User.findByIdAndDelete(user.id);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
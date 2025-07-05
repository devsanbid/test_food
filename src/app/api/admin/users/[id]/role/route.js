import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

const validRoles = ['user', 'restaurant', 'admin', 'super_admin'];

// PATCH /api/admin/users/[id]/role - Update user role
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const { role } = await request.json();
    
    // Validate role
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid role. Valid roles are: ' + validRoles.join(', ') 
        },
        { status: 400 }
      );
    }
    
    const user = await User.findById(id).select('-password -resetPasswordToken -verificationToken');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const oldRole = user.role;
    
    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: role, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -verificationToken').lean();
    
    // Log the role change (in a real app, you'd want to audit this)
    console.log(`Role changed for user ${id}: ${oldRole} -> ${role}`);
    
    return NextResponse.json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}`,
      user: updatedUser,
      roleChange: {
        from: oldRole,
        to: role,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
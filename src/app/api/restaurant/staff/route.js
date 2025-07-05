import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import Notification from '@/models/Notification';
import bcrypt from 'bcryptjs';

// GET /api/restaurant/staff - Get staff management data
export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    const restaurantId = request.user.restaurantId;
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'list':
        const filter = { 
          restaurantId,
          role: { $in: ['staff', 'manager', 'chef', 'delivery'] }
        };
        
        if (role && ['staff', 'manager', 'chef', 'delivery'].includes(role)) {
          filter.role = role;
        }
        
        if (status && ['active', 'inactive'].includes(status)) {
          filter.isActive = status === 'active';
        }
        
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ];
        }

        const skip = (page - 1) * limit;
        const [staff, totalStaff] = await Promise.all([
          User.find(filter)
            .select('name email phone role isActive avatar createdAt lastLogin permissions workSchedule')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          User.countDocuments(filter)
        ]);

        // Get staff statistics
        const staffStats = await User.aggregate([
          { $match: { restaurantId, role: { $in: ['staff', 'manager', 'chef', 'delivery'] } } },
          {
            $group: {
              _id: null,
              totalStaff: { $sum: 1 },
              activeStaff: {
                $sum: { $cond: ['$isActive', 1, 0] }
              },
              managers: {
                $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] }
              },
              chefs: {
                $sum: { $cond: [{ $eq: ['$role', 'chef'] }, 1, 0] }
              },
              deliveryStaff: {
                $sum: { $cond: [{ $eq: ['$role', 'delivery'] }, 1, 0] }
              },
              generalStaff: {
                $sum: { $cond: [{ $eq: ['$role', 'staff'] }, 1, 0] }
              }
            }
          }
        ]);

        return NextResponse.json({
          success: true,
          staff,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalStaff / limit),
            totalItems: totalStaff,
            hasNext: page < Math.ceil(totalStaff / limit),
            hasPrev: page > 1
          },
          stats: staffStats[0] || {
            totalStaff: 0,
            activeStaff: 0,
            managers: 0,
            chefs: 0,
            deliveryStaff: 0,
            generalStaff: 0
          }
        });

      case 'details':
        const staffId = searchParams.get('staffId');
        if (!staffId) {
          return NextResponse.json(
            { success: false, message: 'Staff ID is required' },
            { status: 400 }
          );
        }

        const staffMember = await User.findOne({
          _id: staffId,
          restaurantId,
          role: { $in: ['staff', 'manager', 'chef', 'delivery'] }
        }).select('-password');

        if (!staffMember) {
          return NextResponse.json(
            { success: false, message: 'Staff member not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          staff: staffMember
        });

      case 'schedule':
        const scheduleStaffId = searchParams.get('staffId');
        const week = searchParams.get('week'); // YYYY-MM-DD format for start of week
        
        const scheduleFilter = { 
          restaurantId,
          role: { $in: ['staff', 'manager', 'chef', 'delivery'] }
        };
        
        if (scheduleStaffId) {
          scheduleFilter._id = scheduleStaffId;
        }

        const staffWithSchedule = await User.find(scheduleFilter)
          .select('name role workSchedule')
          .sort({ name: 1 });

        return NextResponse.json({
          success: true,
          schedule: staffWithSchedule.map(staff => ({
            _id: staff._id,
            name: staff.name,
            role: staff.role,
            workSchedule: staff.workSchedule || {
              monday: { isWorking: false, startTime: '', endTime: '' },
              tuesday: { isWorking: false, startTime: '', endTime: '' },
              wednesday: { isWorking: false, startTime: '', endTime: '' },
              thursday: { isWorking: false, startTime: '', endTime: '' },
              friday: { isWorking: false, startTime: '', endTime: '' },
              saturday: { isWorking: false, startTime: '', endTime: '' },
              sunday: { isWorking: false, startTime: '', endTime: '' }
            }
          }))
        });

      case 'performance':
        const performanceStaffId = searchParams.get('staffId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        if (!performanceStaffId) {
          return NextResponse.json(
            { success: false, message: 'Staff ID is required for performance data' },
            { status: 400 }
          );
        }

        const staffMemberPerformance = await User.findOne({
          _id: performanceStaffId,
          restaurantId,
          role: { $in: ['staff', 'manager', 'chef', 'delivery'] }
        }).select('name role');

        if (!staff) {
          return NextResponse.json(
            { success: false, message: 'Staff member not found' },
            { status: 404 }
          );
        }

        // This would typically involve order data, attendance, etc.
        // For now, returning basic structure
        const performanceData = {
          staff: {
            _id: staff._id,
            name: staff.name,
            role: staff.role
          },
          period: {
            startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: endDate || new Date()
          },
          metrics: {
            ordersHandled: 0,
            averageOrderTime: 0,
            customerRating: 0,
            attendanceRate: 0,
            punctualityScore: 0
          }
        };

        return NextResponse.json({
          success: true,
          performance: performanceData
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant staff GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/restaurant/staff - Add new staff member
export async function POST(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { action, ...staffData } = await request.json();
    const restaurantId = request.user.restaurantId;

    switch (action) {
      case 'add-staff':
        const {
          name,
          email,
          phone,
          role,
          password,
          permissions,
          workSchedule,
          salary,
          hireDate
        } = staffData;

        // Validation
        if (!name || !email || !phone || !role || !password) {
          return NextResponse.json(
            { success: false, message: 'Name, email, phone, role, and password are required' },
            { status: 400 }
          );
        }

        if (!['staff', 'manager', 'chef', 'delivery'].includes(role)) {
          return NextResponse.json(
            { success: false, message: 'Invalid role' },
            { status: 400 }
          );
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'Email already exists' },
            { status: 400 }
          );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create staff member
        const newStaff = await User.create({
          name,
          email,
          phone,
          password: hashedPassword,
          role,
          restaurantId,
          isActive: true,
          permissions: permissions || [],
          workSchedule: workSchedule || {},
          employmentDetails: {
            salary: salary || 0,
            hireDate: hireDate || new Date(),
            position: role
          }
        });

        // Send notification to new staff member
        await Notification.create({
          user: newStaff._id,
          type: 'staff_welcome',
          title: 'Welcome to the Team!',
          message: `You have been added as ${role} to the restaurant team. Please check your work schedule and permissions.`,
          data: { restaurantId }
        });

        const staffResponse = await User.findById(newStaff._id).select('-password');

        return NextResponse.json({
          success: true,
          message: 'Staff member added successfully',
          staff: staffResponse
        });

      case 'invite-staff':
        const { inviteEmail, inviteRole, inviteMessage } = staffData;
        
        if (!inviteEmail || !inviteRole) {
          return NextResponse.json(
            { success: false, message: 'Email and role are required for invitation' },
            { status: 400 }
          );
        }

        if (!['staff', 'manager', 'chef', 'delivery'].includes(inviteRole)) {
          return NextResponse.json(
            { success: false, message: 'Invalid role' },
            { status: 400 }
          );
        }

        // Check if user already exists
        const existingInvitee = await User.findOne({ email: inviteEmail });
        if (existingInvitee) {
          return NextResponse.json(
            { success: false, message: 'User with this email already exists' },
            { status: 400 }
          );
        }

        // Get restaurant details
        const restaurant = await Restaurant.findById(restaurantId).select('name');
        
        // In a real application, you would send an email invitation here
        // For now, we'll create a pending invitation record
        
        return NextResponse.json({
          success: true,
          message: 'Invitation sent successfully',
          invitation: {
            email: inviteEmail,
            role: inviteRole,
            restaurant: restaurant.name,
            sentAt: new Date()
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant staff POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurant/staff - Update staff member
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { staffId, action, ...updateData } = await request.json();

    if (!staffId) {
      return NextResponse.json(
        { success: false, message: 'Staff ID is required' },
        { status: 400 }
      );
    }

    const restaurantId = request.user.restaurantId;
    const staff = await User.findOne({
      _id: staffId,
      restaurantId,
      role: { $in: ['staff', 'manager', 'chef', 'delivery'] }
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Staff member not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update-profile':
        const { name, phone, permissions, salary } = updateData;
        
        if (name) staff.name = name;
        if (phone) staff.phone = phone;
        if (permissions) staff.permissions = permissions;
        if (salary !== undefined) {
          if (!staff.employmentDetails) staff.employmentDetails = {};
          staff.employmentDetails.salary = salary;
        }

        await staff.save();

        return NextResponse.json({
          success: true,
          message: 'Staff profile updated successfully',
          staff: await User.findById(staff._id).select('-password')
        });

      case 'change-role':
        const { newRole } = updateData;
        
        if (!newRole || !['staff', 'manager', 'chef', 'delivery'].includes(newRole)) {
          return NextResponse.json(
            { success: false, message: 'Valid role is required' },
            { status: 400 }
          );
        }

        const oldRole = staff.role;
        staff.role = newRole;
        
        if (!staff.employmentDetails) staff.employmentDetails = {};
        staff.employmentDetails.position = newRole;

        await staff.save();

        // Send notification about role change
        await Notification.create({
          user: staff._id,
          type: 'role_change',
          title: 'Role Updated',
          message: `Your role has been changed from ${oldRole} to ${newRole}`,
          data: { oldRole, newRole, restaurantId }
        });

        return NextResponse.json({
          success: true,
          message: 'Staff role updated successfully',
          staff: await User.findById(staff._id).select('-password')
        });

      case 'toggle-status':
        staff.isActive = !staff.isActive;
        await staff.save();

        // Send notification about status change
        await Notification.create({
          user: staff._id,
          type: 'account_status',
          title: `Account ${staff.isActive ? 'Activated' : 'Deactivated'}`,
          message: `Your account has been ${staff.isActive ? 'activated' : 'deactivated'}`,
          data: { isActive: staff.isActive, restaurantId }
        });

        return NextResponse.json({
          success: true,
          message: `Staff ${staff.isActive ? 'activated' : 'deactivated'} successfully`,
          staff: await User.findById(staff._id).select('-password')
        });

      case 'update-schedule':
        const { workSchedule } = updateData;
        
        if (!workSchedule) {
          return NextResponse.json(
            { success: false, message: 'Work schedule is required' },
            { status: 400 }
          );
        }

        staff.workSchedule = workSchedule;
        await staff.save();

        // Send notification about schedule update
        await Notification.create({
          user: staff._id,
          type: 'schedule_update',
          title: 'Work Schedule Updated',
          message: 'Your work schedule has been updated. Please check the new schedule.',
          data: { restaurantId }
        });

        return NextResponse.json({
          success: true,
          message: 'Work schedule updated successfully',
          staff: await User.findById(staff._id).select('-password')
        });

      case 'update-permissions':
        const { newPermissions } = updateData;
        
        if (!Array.isArray(newPermissions)) {
          return NextResponse.json(
            { success: false, message: 'Permissions must be an array' },
            { status: 400 }
          );
        }

        staff.permissions = newPermissions;
        await staff.save();

        // Send notification about permission update
        await Notification.create({
          user: staff._id,
          type: 'permissions_update',
          title: 'Permissions Updated',
          message: 'Your account permissions have been updated.',
          data: { permissions: newPermissions, restaurantId }
        });

        return NextResponse.json({
          success: true,
          message: 'Permissions updated successfully',
          staff: await User.findById(staff._id).select('-password')
        });

      case 'reset-password':
        const { newPassword } = updateData;
        
        if (!newPassword || newPassword.length < 6) {
          return NextResponse.json(
            { success: false, message: 'Password must be at least 6 characters long' },
            { status: 400 }
          );
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        staff.password = hashedNewPassword;
        await staff.save();

        // Send notification about password reset
        await Notification.create({
          user: staff._id,
          type: 'password_reset',
          title: 'Password Reset',
          message: 'Your password has been reset by the restaurant manager.',
          data: { restaurantId }
        });

        return NextResponse.json({
          success: true,
          message: 'Password reset successfully'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant staff PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurant/staff - Remove staff member
export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return NextResponse.json(
        { success: false, message: 'Staff ID is required' },
        { status: 400 }
      );
    }

    const restaurantId = request.user.restaurantId;
    const staff = await User.findOne({
      _id: staffId,
      restaurantId,
      role: { $in: ['staff', 'manager', 'chef', 'delivery'] }
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if staff member has any active responsibilities
    // In a real application, you might check for active orders, shifts, etc.
    
    // Send notification before deletion
    await Notification.create({
      user: staff._id,
      type: 'account_termination',
      title: 'Employment Terminated',
      message: 'Your employment with the restaurant has been terminated.',
      data: { restaurantId, terminationDate: new Date() }
    });

    // Remove staff member
    await User.findByIdAndDelete(staffId);

    return NextResponse.json({
      success: true,
      message: 'Staff member removed successfully'
    });
  } catch (error) {
    console.error('Restaurant staff DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
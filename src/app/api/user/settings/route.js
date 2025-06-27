import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// GET - Get user settings
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

    // Get user settings
    const userSettings = await User.findById(user.id)
      .select('preferences notifications privacy security twoFactorAuth')
      .lean();

    if (!userSettings) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Default settings structure if not exists
    const defaultSettings = {
      preferences: {
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
        theme: 'light',
        defaultDeliveryAddress: null,
        dietaryRestrictions: [],
        allergens: [],
        preferredCuisines: [],
        maxDeliveryDistance: 10,
        autoReorder: false,
        savePaymentMethods: true
      },
      notifications: {
        email: {
          orderUpdates: true,
          promotions: true,
          newsletter: false,
          securityAlerts: true,
          reviewReminders: true
        },
        push: {
          orderUpdates: true,
          promotions: false,
          nearbyOffers: false,
          deliveryUpdates: true
        },
        sms: {
          orderUpdates: false,
          promotions: false,
          securityAlerts: true
        }
      },
      privacy: {
        profileVisibility: 'private',
        showReviews: true,
        shareLocation: true,
        dataCollection: true,
        marketingEmails: false,
        thirdPartySharing: false
      },
      security: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 30, // minutes
        passwordLastChanged: null,
        trustedDevices: []
      }
    };

    // Merge with default settings
    const settings = {
      preferences: { ...defaultSettings.preferences, ...userSettings.preferences },
      notifications: {
        email: { ...defaultSettings.notifications.email, ...userSettings.notifications?.email },
        push: { ...defaultSettings.notifications.push, ...userSettings.notifications?.push },
        sms: { ...defaultSettings.notifications.sms, ...userSettings.notifications?.sms }
      },
      privacy: { ...defaultSettings.privacy, ...userSettings.privacy },
      security: { ...defaultSettings.security, ...userSettings.security }
    };

    return NextResponse.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
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
    const { category, settings } = body;

    if (!category || !settings) {
      return NextResponse.json(
        { success: false, message: 'Category and settings are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['preferences', 'notifications', 'privacy', 'security'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, message: 'Invalid settings category' },
        { status: 400 }
      );
    }

    // Get current user
    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Initialize settings if not exists
    if (!userDoc[category]) {
      userDoc[category] = {};
    }

    // Update specific category settings
    switch (category) {
      case 'preferences':
        // Validate preferences
        const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'];
        const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'];
        const validThemes = ['light', 'dark', 'auto'];

        if (settings.language && !validLanguages.includes(settings.language)) {
          return NextResponse.json(
            { success: false, message: 'Invalid language' },
            { status: 400 }
          );
        }

        if (settings.currency && !validCurrencies.includes(settings.currency)) {
          return NextResponse.json(
            { success: false, message: 'Invalid currency' },
            { status: 400 }
          );
        }

        if (settings.theme && !validThemes.includes(settings.theme)) {
          return NextResponse.json(
            { success: false, message: 'Invalid theme' },
            { status: 400 }
          );
        }

        if (settings.maxDeliveryDistance && (settings.maxDeliveryDistance < 1 || settings.maxDeliveryDistance > 50)) {
          return NextResponse.json(
            { success: false, message: 'Max delivery distance must be between 1 and 50 km' },
            { status: 400 }
          );
        }

        userDoc.preferences = { ...userDoc.preferences, ...settings };
        break;

      case 'notifications':
        // Validate notification settings structure
        const validNotificationTypes = ['email', 'push', 'sms'];
        
        for (const [type, typeSettings] of Object.entries(settings)) {
          if (!validNotificationTypes.includes(type)) {
            return NextResponse.json(
              { success: false, message: `Invalid notification type: ${type}` },
              { status: 400 }
            );
          }

          if (!userDoc.notifications) userDoc.notifications = {};
          if (!userDoc.notifications[type]) userDoc.notifications[type] = {};
          
          userDoc.notifications[type] = { ...userDoc.notifications[type], ...typeSettings };
        }
        break;

      case 'privacy':
        // Validate privacy settings
        const validVisibility = ['public', 'private', 'friends'];
        
        if (settings.profileVisibility && !validVisibility.includes(settings.profileVisibility)) {
          return NextResponse.json(
            { success: false, message: 'Invalid profile visibility' },
            { status: 400 }
          );
        }

        userDoc.privacy = { ...userDoc.privacy, ...settings };
        break;

      case 'security':
        // Handle security settings carefully
        const allowedSecuritySettings = ['loginNotifications', 'sessionTimeout'];
        
        const filteredSettings = {};
        for (const [key, value] of Object.entries(settings)) {
          if (allowedSecuritySettings.includes(key)) {
            filteredSettings[key] = value;
          }
        }

        if (filteredSettings.sessionTimeout && (filteredSettings.sessionTimeout < 5 || filteredSettings.sessionTimeout > 1440)) {
          return NextResponse.json(
            { success: false, message: 'Session timeout must be between 5 and 1440 minutes' },
            { status: 400 }
          );
        }

        userDoc.security = { ...userDoc.security, ...filteredSettings };
        break;
    }

    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: { [category]: userDoc[category] }
    });
  } catch (error) {
    console.error('Settings update error:', error);
    
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

// POST - Handle specific security actions
export async function POST(request) {
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
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'change-password':
        const { currentPassword, newPassword, confirmPassword } = body;

        if (!currentPassword || !newPassword || !confirmPassword) {
          return NextResponse.json(
            { success: false, message: 'All password fields are required' },
            { status: 400 }
          );
        }

        if (newPassword !== confirmPassword) {
          return NextResponse.json(
            { success: false, message: 'New passwords do not match' },
            { status: 400 }
          );
        }

        if (newPassword.length < 8) {
          return NextResponse.json(
            { success: false, message: 'New password must be at least 8 characters long' },
            { status: 400 }
          );
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userDoc.password);
        if (!isCurrentPasswordValid) {
          return NextResponse.json(
            { success: false, message: 'Current password is incorrect' },
            { status: 400 }
          );
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password and security settings
        userDoc.password = hashedNewPassword;
        if (!userDoc.security) userDoc.security = {};
        userDoc.security.passwordLastChanged = new Date();

        await userDoc.save();

        return NextResponse.json({
          success: true,
          message: 'Password changed successfully'
        });

      case 'enable-2fa':
        // Placeholder for 2FA implementation
        return NextResponse.json({
          success: false,
          message: 'Two-factor authentication is not yet implemented'
        }, { status: 501 });

      case 'disable-2fa':
        // Placeholder for 2FA implementation
        return NextResponse.json({
          success: false,
          message: 'Two-factor authentication is not yet implemented'
        }, { status: 501 });

      case 'clear-trusted-devices':
        if (!userDoc.security) userDoc.security = {};
        userDoc.security.trustedDevices = [];
        await userDoc.save();

        return NextResponse.json({
          success: true,
          message: 'Trusted devices cleared successfully'
        });

      case 'export-data':
        // Placeholder for data export
        return NextResponse.json({
          success: false,
          message: 'Data export feature is not yet implemented'
        }, { status: 501 });

      case 'delete-account':
        const { password, confirmation } = body;

        if (!password || confirmation !== 'DELETE') {
          return NextResponse.json(
            { success: false, message: 'Password and confirmation are required' },
            { status: 400 }
          );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, userDoc.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { success: false, message: 'Password is incorrect' },
            { status: 400 }
          );
        }

        // Mark account for deletion (soft delete)
        userDoc.isActive = false;
        userDoc.deletedAt = new Date();
        userDoc.email = `deleted_${Date.now()}_${userDoc.email}`;
        await userDoc.save();

        return NextResponse.json({
          success: true,
          message: 'Account scheduled for deletion'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Security action error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
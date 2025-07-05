import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';
import Notification from '@/models/Notification';

// GET /api/restaurant/settings - Get restaurant settings
export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all';
    
    // Find restaurant where current user is the owner
    const restaurant = await Restaurant.findOne({ owner: request.user.id });
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const userProfile = await User.findById(request.user.id).select('notificationPreferences');

    switch (section) {
      case 'general':
        return NextResponse.json({
          success: true,
          settings: {
            name: restaurant.name,
            description: restaurant.description,
            cuisine: restaurant.cuisine,
            phone: restaurant.contact?.phone || restaurant.phone,
            email: restaurant.contact?.email || restaurant.email,
            website: restaurant.contact?.website || restaurant.website,
            address: restaurant.address,
            isActive: restaurant.isActive,
            isVerified: restaurant.isVerified
          }
        });

      case 'operational':
        return NextResponse.json({
          success: true,
          settings: {
            openingHours: restaurant.openingHours,
            deliveryRadius: restaurant.deliveryRadius,
            minimumOrderAmount: restaurant.minimumOrderAmount,
            deliveryFee: restaurant.deliveryFee,
            estimatedDeliveryTime: restaurant.estimatedDeliveryTime,
            acceptingOrders: restaurant.acceptingOrders,
            features: restaurant.features
          }
        });

      case 'payment':
        return NextResponse.json({
          success: true,
          settings: {
            paymentMethods: restaurant.paymentMethods || {
              cash: true,
              card: false,
              digitalWallet: false,
              bankTransfer: false
            },
            taxRate: restaurant.taxRate || 0,
            serviceCharge: restaurant.serviceCharge || 0,
            bankDetails: restaurant.bankDetails || {}
          }
        });

      case 'notifications':
        return NextResponse.json({
          success: true,
          settings: {
            emailNotifications: restaurant.notificationSettings?.email || {
              newOrders: true,
              orderUpdates: true,
              reviews: true,
              promotions: false
            },
            smsNotifications: restaurant.notificationSettings?.sms || {
              newOrders: true,
              orderUpdates: false,
              reviews: false,
              promotions: false
            },
            pushNotifications: restaurant.notificationSettings?.push || {
              newOrders: true,
              orderUpdates: true,
              reviews: true,
              promotions: true
            },
            userPreferences: userProfile.notificationPreferences || {}
          }
        });

      case 'security':
        return NextResponse.json({
          success: true,
          settings: {
            twoFactorEnabled: restaurant.security?.twoFactorEnabled || false,
            loginAlerts: restaurant.security?.loginAlerts || true,
            sessionTimeout: restaurant.security?.sessionTimeout || 30,
            allowedIPs: restaurant.security?.allowedIPs || [],
            lastPasswordChange: restaurant.security?.lastPasswordChange,
            apiAccess: restaurant.security?.apiAccess || false
          }
        });

      case 'integrations':
        return NextResponse.json({
          success: true,
          settings: {
            posSystem: restaurant.integrations?.posSystem || null,
            deliveryPartners: restaurant.integrations?.deliveryPartners || [],
            paymentGateways: restaurant.integrations?.paymentGateways || [],
            socialMedia: restaurant.integrations?.socialMedia || {
              facebook: '',
              instagram: '',
              twitter: ''
            },
            analytics: restaurant.integrations?.analytics || {
              googleAnalytics: '',
              facebookPixel: ''
            }
          }
        });

      case 'all':
      default:
        return NextResponse.json({
          success: true,
          settings: {
            general: {
              name: restaurant.name,
              description: restaurant.description,
              cuisine: restaurant.cuisine,
              phone: restaurant.contact?.phone || restaurant.phone,
              email: restaurant.contact?.email || restaurant.email,
              website: restaurant.contact?.website || restaurant.website,
              address: restaurant.address,
              isActive: restaurant.isActive,
              isVerified: restaurant.isVerified
            },
            operational: {
              openingHours: restaurant.openingHours,
              deliveryRadius: restaurant.deliveryRadius,
              minimumOrderAmount: restaurant.minimumOrderAmount,
              deliveryFee: restaurant.deliveryFee,
              estimatedDeliveryTime: restaurant.estimatedDeliveryTime,
              acceptingOrders: restaurant.acceptingOrders,
              features: restaurant.features
            },
            payment: {
              paymentMethods: restaurant.paymentMethods,
              taxRate: restaurant.taxRate,
              serviceCharge: restaurant.serviceCharge,
              bankDetails: restaurant.bankDetails
            },
            notifications: {
              emailNotifications: restaurant.notificationSettings?.email,
              smsNotifications: restaurant.notificationSettings?.sms,
              pushNotifications: restaurant.notificationSettings?.push,
              userPreferences: userProfile.notificationPreferences
            },
            security: {
              twoFactorEnabled: restaurant.security?.twoFactorEnabled,
              loginAlerts: restaurant.security?.loginAlerts,
              sessionTimeout: restaurant.security?.sessionTimeout,
              allowedIPs: restaurant.security?.allowedIPs,
              lastPasswordChange: restaurant.security?.lastPasswordChange,
              apiAccess: restaurant.security?.apiAccess
            },
            integrations: {
              posSystem: restaurant.integrations?.posSystem,
              deliveryPartners: restaurant.integrations?.deliveryPartners,
              paymentGateways: restaurant.integrations?.paymentGateways,
              socialMedia: restaurant.integrations?.socialMedia,
              analytics: restaurant.integrations?.analytics
            }
          }
        });
    }
  } catch (error) {
    console.error('Restaurant settings GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurant/settings - Update restaurant settings
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { section, ...settingsData } = await request.json();
    
    if (!section) {
      return NextResponse.json(
        { success: false, message: 'Settings section is required' },
        { status: 400 }
      );
    }

    // Find restaurant where current user is the owner
    const restaurant = await Restaurant.findOne({ owner: request.user.id });
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    switch (section) {
      case 'general':
        const {
          name,
          description,
          cuisine,
          phone,
          email,
          website,
          address
        } = settingsData;

        if (name) restaurant.name = name;
        if (description) restaurant.description = description;
        if (cuisine) restaurant.cuisine = cuisine;
        
        if (phone || email || website) {
          if (!restaurant.contact) restaurant.contact = {};
          if (phone) restaurant.contact.phone = phone;
          if (email) restaurant.contact.email = email;
          if (website) restaurant.contact.website = website;
        }
        
        if (address) restaurant.address = address;

        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: 'General settings updated successfully'
        });

      case 'operational':
        const {
          openingHours,
          deliveryRadius,
          minimumOrderAmount,
          deliveryFee,
          estimatedDeliveryTime,
          acceptingOrders,
          features
        } = settingsData;

        if (openingHours) restaurant.openingHours = openingHours;
        if (deliveryRadius !== undefined) restaurant.deliveryRadius = deliveryRadius;
        if (minimumOrderAmount !== undefined) restaurant.minimumOrderAmount = minimumOrderAmount;
        if (deliveryFee !== undefined) restaurant.deliveryFee = deliveryFee;
        if (estimatedDeliveryTime !== undefined) restaurant.estimatedDeliveryTime = estimatedDeliveryTime;
        if (acceptingOrders !== undefined) restaurant.acceptingOrders = acceptingOrders;
        if (features) restaurant.features = features;

        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: 'Operational settings updated successfully'
        });

      case 'payment':
        const {
          paymentMethods,
          taxRate,
          serviceCharge,
          bankDetails
        } = settingsData;

        if (paymentMethods) restaurant.paymentMethods = paymentMethods;
        if (taxRate !== undefined) restaurant.taxRate = taxRate;
        if (serviceCharge !== undefined) restaurant.serviceCharge = serviceCharge;
        if (bankDetails) restaurant.bankDetails = bankDetails;

        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: 'Payment settings updated successfully'
        });

      case 'notifications':
        const {
          emailNotifications,
          smsNotifications,
          pushNotifications,
          userPreferences
        } = settingsData;

        if (!restaurant.notificationSettings) {
          restaurant.notificationSettings = {};
        }

        if (emailNotifications) restaurant.notificationSettings.email = emailNotifications;
        if (smsNotifications) restaurant.notificationSettings.sms = smsNotifications;
        if (pushNotifications) restaurant.notificationSettings.push = pushNotifications;

        await restaurant.save();

        // Update user preferences if provided
        if (userPreferences) {
          await User.findByIdAndUpdate(request.user.id, {
            notificationPreferences: userPreferences
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Notification settings updated successfully'
        });

      case 'security':
        const {
          twoFactorEnabled,
          loginAlerts,
          sessionTimeout,
          allowedIPs,
          apiAccess
        } = settingsData;

        if (!restaurant.security) {
          restaurant.security = {};
        }

        if (twoFactorEnabled !== undefined) restaurant.security.twoFactorEnabled = twoFactorEnabled;
        if (loginAlerts !== undefined) restaurant.security.loginAlerts = loginAlerts;
        if (sessionTimeout !== undefined) restaurant.security.sessionTimeout = sessionTimeout;
        if (allowedIPs) restaurant.security.allowedIPs = allowedIPs;
        if (apiAccess !== undefined) restaurant.security.apiAccess = apiAccess;

        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: 'Security settings updated successfully'
        });

      case 'integrations':
        const {
          posSystem,
          deliveryPartners,
          paymentGateways,
          socialMedia,
          analytics
        } = settingsData;

        if (!restaurant.integrations) {
          restaurant.integrations = {};
        }

        if (posSystem) restaurant.integrations.posSystem = posSystem;
        if (deliveryPartners) restaurant.integrations.deliveryPartners = deliveryPartners;
        if (paymentGateways) restaurant.integrations.paymentGateways = paymentGateways;
        if (socialMedia) restaurant.integrations.socialMedia = socialMedia;
        if (analytics) restaurant.integrations.analytics = analytics;

        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: 'Integration settings updated successfully'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid settings section' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant settings PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/restaurant/settings - Special settings operations
export async function POST(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { action, ...actionData } = await request.json();
    // Find restaurant where current user is the owner
    const restaurant = await Restaurant.findOne({ owner: request.user.id });
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'backup-settings':
        const backup = {
          timestamp: new Date(),
          settings: {
            general: {
              name: restaurant.name,
              description: restaurant.description,
              cuisine: restaurant.cuisine,
              contact: restaurant.contact,
              address: restaurant.address
            },
            operational: {
              openingHours: restaurant.openingHours,
              deliveryRadius: restaurant.deliveryRadius,
              minimumOrderAmount: restaurant.minimumOrderAmount,
              deliveryFee: restaurant.deliveryFee,
              estimatedDeliveryTime: restaurant.estimatedDeliveryTime,
              features: restaurant.features
            },
            payment: {
              paymentMethods: restaurant.paymentMethods,
              taxRate: restaurant.taxRate,
              serviceCharge: restaurant.serviceCharge
            },
            notifications: restaurant.notificationSettings,
            security: {
              twoFactorEnabled: restaurant.security?.twoFactorEnabled,
              loginAlerts: restaurant.security?.loginAlerts,
              sessionTimeout: restaurant.security?.sessionTimeout,
              apiAccess: restaurant.security?.apiAccess
            },
            integrations: restaurant.integrations
          }
        };

        return NextResponse.json({
          success: true,
          backup,
          message: 'Settings backup created successfully'
        });

      case 'restore-settings':
        const { backup: restoreData } = actionData;
        
        if (!restoreData || !restoreData.settings) {
          return NextResponse.json(
            { success: false, message: 'Valid backup data is required' },
            { status: 400 }
          );
        }

        const { settings } = restoreData;
        
        // Restore settings
        if (settings.general) {
          restaurant.name = settings.general.name || restaurant.name;
          restaurant.description = settings.general.description || restaurant.description;
          restaurant.cuisine = settings.general.cuisine || restaurant.cuisine;
          restaurant.contact = settings.general.contact || restaurant.contact;
          restaurant.address = settings.general.address || restaurant.address;
        }

        if (settings.operational) {
          restaurant.openingHours = settings.operational.openingHours || restaurant.openingHours;
          restaurant.deliveryRadius = settings.operational.deliveryRadius || restaurant.deliveryRadius;
          restaurant.minimumOrderAmount = settings.operational.minimumOrderAmount || restaurant.minimumOrderAmount;
          restaurant.deliveryFee = settings.operational.deliveryFee || restaurant.deliveryFee;
          restaurant.estimatedDeliveryTime = settings.operational.estimatedDeliveryTime || restaurant.estimatedDeliveryTime;
          restaurant.features = settings.operational.features || restaurant.features;
        }

        if (settings.payment) {
          restaurant.paymentMethods = settings.payment.paymentMethods || restaurant.paymentMethods;
          restaurant.taxRate = settings.payment.taxRate || restaurant.taxRate;
          restaurant.serviceCharge = settings.payment.serviceCharge || restaurant.serviceCharge;
        }

        if (settings.notifications) {
          restaurant.notificationSettings = settings.notifications;
        }

        if (settings.security) {
          if (!restaurant.security) restaurant.security = {};
          restaurant.security.twoFactorEnabled = settings.security.twoFactorEnabled;
          restaurant.security.loginAlerts = settings.security.loginAlerts;
          restaurant.security.sessionTimeout = settings.security.sessionTimeout;
          restaurant.security.apiAccess = settings.security.apiAccess;
        }

        if (settings.integrations) {
          restaurant.integrations = settings.integrations;
        }

        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: 'Settings restored successfully'
        });

      case 'reset-to-defaults':
        const { section } = actionData;
        
        if (!section) {
          return NextResponse.json(
            { success: false, message: 'Section is required for reset' },
            { status: 400 }
          );
        }

        switch (section) {
          case 'operational':
            restaurant.openingHours = {
              monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
              tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
              wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
              thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
              friday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
              saturday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
              sunday: { isOpen: true, openTime: '09:00', closeTime: '22:00' }
            };
            restaurant.deliveryRadius = 5;
            restaurant.minimumOrderAmount = 10;
            restaurant.deliveryFee = 2;
            restaurant.estimatedDeliveryTime = 30;
            restaurant.features = [];
            break;

          case 'payment':
            restaurant.paymentMethods = {
              cash: true,
              card: false,
              digitalWallet: false,
              bankTransfer: false
            };
            restaurant.taxRate = 0;
            restaurant.serviceCharge = 0;
            break;

          case 'notifications':
            restaurant.notificationSettings = {
              email: {
                newOrders: true,
                orderUpdates: true,
                reviews: true,
                promotions: false
              },
              sms: {
                newOrders: true,
                orderUpdates: false,
                reviews: false,
                promotions: false
              },
              push: {
                newOrders: true,
                orderUpdates: true,
                reviews: true,
                promotions: true
              }
            };
            break;

          case 'security':
            restaurant.security = {
              twoFactorEnabled: false,
              loginAlerts: true,
              sessionTimeout: 30,
              allowedIPs: [],
              apiAccess: false
            };
            break;

          case 'integrations':
            restaurant.integrations = {
              posSystem: null,
              deliveryPartners: [],
              paymentGateways: [],
              socialMedia: {
                facebook: '',
                instagram: '',
                twitter: ''
              },
              analytics: {
                googleAnalytics: '',
                facebookPixel: ''
              }
            };
            break;

          default:
            return NextResponse.json(
              { success: false, message: 'Invalid section for reset' },
              { status: 400 }
            );
        }

        await restaurant.save();

        return NextResponse.json({
          success: true,
          message: `${section} settings reset to defaults successfully`
        });

      case 'test-integration':
        const { integrationType, credentials } = actionData;
        
        if (!integrationType) {
          return NextResponse.json(
            { success: false, message: 'Integration type is required' },
            { status: 400 }
          );
        }

        // Mock integration testing
        const testResults = {
          integrationType,
          status: 'success',
          message: 'Integration test completed successfully',
          timestamp: new Date(),
          details: {
            connectionTime: Math.random() * 1000 + 500,
            apiVersion: '1.0',
            features: ['orders', 'payments', 'inventory']
          }
        };

        return NextResponse.json({
          success: true,
          testResults
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant settings POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
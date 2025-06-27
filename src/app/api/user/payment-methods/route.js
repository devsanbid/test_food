import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Helper function to mask card number
function maskCardNumber(cardNumber) {
  if (!cardNumber || cardNumber.length < 4) return '****';
  return '**** **** **** ' + cardNumber.slice(-4);
}

// Helper function to encrypt sensitive data
function encryptData(data) {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
}

// Helper function to decrypt sensitive data
function decryptData(encryptedData, iv) {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// GET - Retrieve user payment methods
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // card, wallet, bank
    const isDefault = searchParams.get('isDefault') === 'true';

    const userDoc = await User.findById(user.id).select('paymentMethods');
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    let paymentMethods = userDoc.paymentMethods || [];

    // Apply filters
    if (type) {
      paymentMethods = paymentMethods.filter(pm => pm.type === type);
    }

    if (isDefault) {
      paymentMethods = paymentMethods.filter(pm => pm.isDefault === true);
    }

    // Mask sensitive information for security
    const maskedPaymentMethods = paymentMethods.map(pm => {
      const masked = { ...pm.toObject() };
      
      if (pm.type === 'card' && pm.cardDetails) {
        masked.cardDetails = {
          ...pm.cardDetails,
          cardNumber: maskCardNumber(pm.cardDetails.cardNumber),
          cvv: undefined // Never return CVV
        };
      }
      
      if (pm.type === 'bank' && pm.bankDetails) {
        masked.bankDetails = {
          ...pm.bankDetails,
          accountNumber: pm.bankDetails.accountNumber ? 
            '**** **** ' + pm.bankDetails.accountNumber.slice(-4) : undefined
        };
      }
      
      return masked;
    });

    // Sort payment methods (default first, then by creation date)
    maskedPaymentMethods.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentMethods: maskedPaymentMethods,
        total: maskedPaymentMethods.length,
        defaultPaymentMethod: maskedPaymentMethods.find(pm => pm.isDefault) || null
      }
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add new payment method
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
    const { type, label, isDefault, cardDetails, walletDetails, bankDetails } = body;

    // Validation
    if (!type || !['card', 'wallet', 'bank', 'cash'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment method type' },
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

    // Initialize payment methods array if not exists
    if (!userDoc.paymentMethods) {
      userDoc.paymentMethods = [];
    }

    // Check payment method limit (max 5 payment methods)
    if (userDoc.paymentMethods.length >= 5) {
      return NextResponse.json(
        { success: false, message: 'Maximum 5 payment methods allowed' },
        { status: 400 }
      );
    }

    let newPaymentMethod = {
      _id: new mongoose.Types.ObjectId(),
      type,
      label: label || type.charAt(0).toUpperCase() + type.slice(1),
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate and process based on type
    switch (type) {
      case 'card':
        if (!cardDetails || !cardDetails.cardNumber || !cardDetails.expiryMonth || 
            !cardDetails.expiryYear || !cardDetails.holderName) {
          return NextResponse.json(
            { success: false, message: 'Card details are incomplete' },
            { status: 400 }
          );
        }

        // Basic card number validation (Luhn algorithm would be better)
        const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(cardNumber)) {
          return NextResponse.json(
            { success: false, message: 'Invalid card number' },
            { status: 400 }
          );
        }

        // Validate expiry
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        if (cardDetails.expiryYear < currentYear || 
            (cardDetails.expiryYear === currentYear && cardDetails.expiryMonth < currentMonth)) {
          return NextResponse.json(
            { success: false, message: 'Card has expired' },
            { status: 400 }
          );
        }

        // Determine card type
        let cardType = 'unknown';
        if (/^4/.test(cardNumber)) cardType = 'visa';
        else if (/^5[1-5]/.test(cardNumber)) cardType = 'mastercard';
        else if (/^3[47]/.test(cardNumber)) cardType = 'amex';
        else if (/^6/.test(cardNumber)) cardType = 'discover';

        newPaymentMethod.cardDetails = {
          cardNumber: cardNumber, // In production, this should be tokenized
          expiryMonth: cardDetails.expiryMonth,
          expiryYear: cardDetails.expiryYear,
          holderName: cardDetails.holderName,
          cardType,
          lastFourDigits: cardNumber.slice(-4)
        };
        break;

      case 'wallet':
        if (!walletDetails || !walletDetails.provider || !walletDetails.walletId) {
          return NextResponse.json(
            { success: false, message: 'Wallet details are incomplete' },
            { status: 400 }
          );
        }

        const validProviders = ['paypal', 'googlepay', 'applepay', 'phonepe', 'paytm', 'gpay'];
        if (!validProviders.includes(walletDetails.provider.toLowerCase())) {
          return NextResponse.json(
            { success: false, message: 'Invalid wallet provider' },
            { status: 400 }
          );
        }

        newPaymentMethod.walletDetails = {
          provider: walletDetails.provider.toLowerCase(),
          walletId: walletDetails.walletId,
          email: walletDetails.email || null,
          phone: walletDetails.phone || null
        };
        break;

      case 'bank':
        if (!bankDetails || !bankDetails.accountNumber || !bankDetails.routingNumber || 
            !bankDetails.accountHolderName) {
          return NextResponse.json(
            { success: false, message: 'Bank details are incomplete' },
            { status: 400 }
          );
        }

        newPaymentMethod.bankDetails = {
          accountNumber: bankDetails.accountNumber, // Should be encrypted in production
          routingNumber: bankDetails.routingNumber,
          accountHolderName: bankDetails.accountHolderName,
          bankName: bankDetails.bankName || '',
          accountType: bankDetails.accountType || 'checking',
          lastFourDigits: bankDetails.accountNumber.slice(-4)
        };
        break;

      case 'cash':
        // Cash doesn't need additional details
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Unsupported payment method type' },
          { status: 400 }
        );
    }

    // If this is set as default or is the first payment method, make it default
    if (isDefault || userDoc.paymentMethods.length === 0) {
      // Remove default from other payment methods
      userDoc.paymentMethods.forEach(pm => {
        pm.isDefault = false;
      });
      newPaymentMethod.isDefault = true;
    }

    userDoc.paymentMethods.push(newPaymentMethod);
    await userDoc.save();

    // Return masked version
    const maskedPaymentMethod = { ...newPaymentMethod };
    if (newPaymentMethod.cardDetails) {
      maskedPaymentMethod.cardDetails = {
        ...newPaymentMethod.cardDetails,
        cardNumber: maskCardNumber(newPaymentMethod.cardDetails.cardNumber)
      };
    }
    if (newPaymentMethod.bankDetails) {
      maskedPaymentMethod.bankDetails = {
        ...newPaymentMethod.bankDetails,
        accountNumber: '**** **** ' + newPaymentMethod.bankDetails.accountNumber.slice(-4)
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method added successfully',
      data: {
        paymentMethod: maskedPaymentMethod
      }
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update payment method or set default
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
    const { paymentMethodId, action, ...updateData } = body;

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, message: 'Payment method ID is required' },
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

    if (!userDoc.paymentMethods || userDoc.paymentMethods.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No payment methods found' },
        { status: 404 }
      );
    }

    const paymentMethodIndex = userDoc.paymentMethods.findIndex(
      pm => pm._id.toString() === paymentMethodId
    );

    if (paymentMethodIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Payment method not found' },
        { status: 404 }
      );
    }

    if (action === 'set-default') {
      // Remove default from all payment methods
      userDoc.paymentMethods.forEach(pm => {
        pm.isDefault = false;
      });
      
      // Set this payment method as default
      userDoc.paymentMethods[paymentMethodIndex].isDefault = true;
      userDoc.paymentMethods[paymentMethodIndex].updatedAt = new Date();
      
      await userDoc.save();
      
      return NextResponse.json({
        success: true,
        message: 'Default payment method updated successfully'
      });
    }

    // Update payment method fields
    const allowedFields = ['label', 'isDefault'];
    const updates = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    // If setting as default, remove default from other payment methods
    if (updates.isDefault) {
      userDoc.paymentMethods.forEach((pm, index) => {
        if (index !== paymentMethodIndex) {
          pm.isDefault = false;
        }
      });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      userDoc.paymentMethods[paymentMethodIndex][key] = updates[key];
    });
    
    userDoc.paymentMethods[paymentMethodIndex].updatedAt = new Date();
    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    console.error('Update payment method error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove payment method
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

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('paymentMethodId');

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, message: 'Payment method ID is required' },
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

    if (!userDoc.paymentMethods || userDoc.paymentMethods.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No payment methods found' },
        { status: 404 }
      );
    }

    const paymentMethodIndex = userDoc.paymentMethods.findIndex(
      pm => pm._id.toString() === paymentMethodId
    );

    if (paymentMethodIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Payment method not found' },
        { status: 404 }
      );
    }

    const paymentMethodToDelete = userDoc.paymentMethods[paymentMethodIndex];
    const wasDefault = paymentMethodToDelete.isDefault;

    // Remove the payment method
    userDoc.paymentMethods.splice(paymentMethodIndex, 1);

    // If deleted payment method was default and there are other methods, make the first one default
    if (wasDefault && userDoc.paymentMethods.length > 0) {
      userDoc.paymentMethods[0].isDefault = true;
      userDoc.paymentMethods[0].updatedAt = new Date();
    }

    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully',
      data: {
        deletedPaymentMethodId: paymentMethodId,
        newDefaultPaymentMethod: wasDefault && userDoc.paymentMethods.length > 0 ? 
          userDoc.paymentMethods[0] : null
      }
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
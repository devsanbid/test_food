import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import Cart from '@/models/Cart';
import Restaurant from '@/models/Restaurant';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Get user's cart
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

    const cart = await Cart.getOrCreateCart(user.id);
    
    // Populate restaurant details
    if (cart.restaurant) {
      await cart.populate('restaurant', 'name logo deliveryFee minimumOrder deliveryTime operatingHours');
    }

    // Validate cart items availability
    const validation = await cart.validateAvailability();
    
    return NextResponse.json({
      success: true,
      data: {
        cart,
        summary: cart.getSummary(),
        validation
      }
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
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
    const { 
      restaurantId, 
      menuItemId, 
      quantity = 1, 
      customizations = [], 
      specialInstructions = '' 
    } = body;

    // Validate required fields
    if (!restaurantId || !menuItemId) {
      return NextResponse.json(
        { success: false, message: 'Restaurant ID and menu item ID are required' },
        { status: 400 }
      );
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid restaurant or menu item ID' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { success: false, message: 'Quantity must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Get restaurant and menu item
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive || !restaurant.isVerified) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found or not available' },
        { status: 404 }
      );
    }

    const menuItem = restaurant.menu.id(menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      return NextResponse.json(
        { success: false, message: 'Menu item not found or not available' },
        { status: 404 }
      );
    }

    // Get or create cart
    const cart = await Cart.getOrCreateCart(user.id);

    // Prepare item data
    const itemData = {
      menuItem: menuItemId,
      restaurant: restaurantId,
      restaurantName: restaurant.name,
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      quantity,
      image: menuItem.image,
      category: menuItem.category,
      customizations,
      specialInstructions: specialInstructions.trim(),
      isAvailable: menuItem.isAvailable,
      preparationTime: menuItem.preparationTime
    };

    // Add item to cart
    await cart.addItem(itemData);

    // Update cart with restaurant details
    cart.deliveryFee = restaurant.deliveryFee;
    cart.minimumOrderAmount = restaurant.minimumOrder;
    cart.estimatedDeliveryTime = Math.max(
      restaurant.deliveryTime.min,
      cart.estimatedPrepTime + 20 // Add 20 minutes for delivery
    );
    
    await cart.save();

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cart,
        summary: cart.getSummary()
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    
    if (error.message.includes('different restaurants')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update cart item
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
    const { action, itemIndex, quantity, couponCode } = body;

    let cart = await Cart.findOne({ user: user.id, isActive: true });
    
    // For sync-cart action, create a new cart if none exists
    if (!cart && body.action === 'sync-cart') {
      cart = await Cart.getOrCreateCart(user.id);
    } else if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update-quantity':
        if (itemIndex === undefined || !quantity) {
          return NextResponse.json(
            { success: false, message: 'Item index and quantity are required' },
            { status: 400 }
          );
        }

        await cart.updateItemQuantity(itemIndex, quantity);
        
        return NextResponse.json({
          success: true,
          message: 'Item quantity updated successfully',
          data: {
            cart,
            summary: cart.getSummary()
          }
        });

      case 'remove-item':
        if (itemIndex === undefined) {
          return NextResponse.json(
            { success: false, message: 'Item index is required' },
            { status: 400 }
          );
        }

        await cart.removeItem(itemIndex);
        
        return NextResponse.json({
          success: true,
          message: 'Item removed from cart successfully',
          data: {
            cart,
            summary: cart.getSummary()
          }
        });

      case 'apply-coupon':
        if (!couponCode) {
          return NextResponse.json(
            { success: false, message: 'Coupon code is required' },
            { status: 400 }
          );
        }

        // TODO: Implement coupon validation logic
        // For now, we'll apply a dummy discount
        const discountAmount = cart.subtotal * 0.1; // 10% discount
        await cart.applyCoupon(couponCode, discountAmount);
        
        return NextResponse.json({
          success: true,
          message: 'Coupon applied successfully',
          data: {
            cart,
            summary: cart.getSummary()
          }
        });

      case 'remove-coupon':
        await cart.removeCoupon();
        
        return NextResponse.json({
          success: true,
          message: 'Coupon removed successfully',
          data: {
            cart,
            summary: cart.getSummary()
          }
        });

      case 'clear-cart':
        try {
          await cart.clearCart();
        } catch (clearError) {
          console.error('Error clearing cart:', clearError);
          return NextResponse.json(
            { success: false, message: 'Failed to clear cart' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Cart cleared successfully',
          data: {
            cart,
            summary: cart.getSummary()
          }
        });

      case 'sync-cart':
        const { items, discount: syncDiscount, couponCode: syncCouponCode } = body;
        if (!items || !Array.isArray(items)) {
          return NextResponse.json(
            { success: false, message: 'Items array is required for sync' },
            { status: 400 }
          );
        }

        try {
          await cart.clearCart();
        } catch (clearError) {
          console.error('Error clearing cart during sync:', clearError);
          return NextResponse.json(
            { success: false, message: 'Failed to clear cart for sync' },
            { status: 500 }
          );
        }

        if (items.length > 0) {
          const firstItem = items[0];
          const restaurantId = firstItem.restaurantId || firstItem.restaurant?._id || firstItem.restaurant;
          const restaurant = await Restaurant.findById(restaurantId);
          
          if (!restaurant || !restaurant.isActive || !restaurant.isVerified) {
            return NextResponse.json(
              { success: false, message: 'Restaurant is not available' },
              { status: 400 }
            );
          }

          cart.restaurant = restaurant._id;
          cart.restaurantName = restaurant.name;
          cart.deliveryFee = restaurant.deliveryFee || 2.50;
          cart.minimumOrderAmount = restaurant.minimumOrderAmount || 0;

          for (const item of items) {
            await cart.addItem({
              menuItem: item._id,
              restaurant: restaurant._id,
              name: item.name,
              description: item.description,
              price: item.price,
              quantity: item.quantity,
              image: item.imageUrl || item.image || item.img,
              category: item.category,
              customizations: item.customizations || [],
              specialInstructions: item.specialInstructions || '',
              isAvailable: true,
              preparationTime: item.preparationTime || 15
            });
          }
          
          // Apply discount and coupon if provided
          if (syncDiscount && syncDiscount > 0 && syncCouponCode) {
            await cart.applyCoupon(syncCouponCode, syncDiscount);
          }
        }

        await cart.save();
        
        return NextResponse.json({
          success: true,
          message: 'Cart synced successfully',
          data: {
            cart,
            summary: cart.getSummary()
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cart update error:', error);
    
    if (error.message.includes('Invalid item index') || 
        error.message.includes('Quantity must be') ||
        error.message.includes('Maximum')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Clear cart
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

    const cart = await Cart.findOne({ user: user.id, isActive: true });
    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      );
    }

    try {
      await cart.clearCart();
    } catch (clearError) {
      console.error('Error clearing cart in DELETE:', clearError);
      return NextResponse.json(
        { success: false, message: 'Failed to clear cart' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart,
        summary: cart.getSummary()
      }
    });
  } catch (error) {
    console.error('Cart clear error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import User from '@/models/User';
import SupportTicket from '@/models/SupportTicket';
import Order from '@/models/Order';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET - Retrieve user support tickets and help information
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
    const type = searchParams.get('type'); // tickets, faq, contact
    const status = searchParams.get('status'); // open, in-progress, resolved, closed
    const category = searchParams.get('category'); // order, payment, delivery, account, technical, other
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    if (type === 'faq') {
      // Return FAQ data
      const faqData = {
        categories: [
          {
            id: 'orders',
            name: 'Orders & Delivery',
            icon: 'shopping-bag',
            questions: [
              {
                id: 'track-order',
                question: 'How can I track my order?',
                answer: 'You can track your order in real-time by going to "My Orders" section and clicking on the specific order. You\'ll see live updates including preparation, pickup, and delivery status.'
              },
              {
                id: 'cancel-order',
                question: 'Can I cancel my order?',
                answer: 'Yes, you can cancel your order within 5 minutes of placing it if the restaurant hasn\'t started preparing it. Go to "My Orders" and click "Cancel Order".'
              },
              {
                id: 'delivery-time',
                question: 'How long does delivery take?',
                answer: 'Delivery time varies by restaurant and location, typically 20-45 minutes. You\'ll see estimated delivery time before placing your order.'
              },
              {
                id: 'minimum-order',
                question: 'Is there a minimum order value?',
                answer: 'Minimum order values vary by restaurant, typically ₹150-300. This information is displayed on each restaurant\'s page.'
              }
            ]
          },
          {
            id: 'payments',
            name: 'Payments & Refunds',
            icon: 'credit-card',
            questions: [
              {
                id: 'payment-methods',
                question: 'What payment methods do you accept?',
                answer: 'We accept credit/debit cards, digital wallets (PayPal, Google Pay, Apple Pay), net banking, UPI, and cash on delivery.'
              },
              {
                id: 'refund-policy',
                question: 'What is your refund policy?',
                answer: 'Refunds are processed within 5-7 business days for cancelled orders or in case of issues. The amount is credited back to your original payment method.'
              },
              {
                id: 'payment-failed',
                question: 'My payment failed but money was deducted',
                answer: 'If payment fails but money is deducted, it will be automatically refunded within 24-48 hours. If not, please contact our support team.'
              }
            ]
          },
          {
            id: 'account',
            name: 'Account & Profile',
            icon: 'user',
            questions: [
              {
                id: 'update-profile',
                question: 'How do I update my profile information?',
                answer: 'Go to "Profile" section in your account settings. You can update your name, email, phone number, and addresses.'
              },
              {
                id: 'change-password',
                question: 'How do I change my password?',
                answer: 'Go to "Settings" > "Security" and click "Change Password". You\'ll need to enter your current password and new password.'
              },
              {
                id: 'delete-account',
                question: 'How do I delete my account?',
                answer: 'You can delete your account from "Settings" > "Security" > "Delete Account". This action is permanent and cannot be undone.'
              }
            ]
          },
          {
            id: 'loyalty',
            name: 'Loyalty & Rewards',
            icon: 'gift',
            questions: [
              {
                id: 'earn-points',
                question: 'How do I earn loyalty points?',
                answer: 'You earn 1 point for every ₹1 spent on orders. Points are credited after successful delivery. Higher tier members earn bonus points.'
              },
              {
                id: 'redeem-points',
                question: 'How do I redeem my points?',
                answer: 'Go to "Loyalty" section to see available rewards. You can redeem points for discounts, free delivery, or special perks.'
              },
              {
                id: 'points-expiry',
                question: 'Do loyalty points expire?',
                answer: 'Yes, loyalty points expire after 1 year from the date they were earned. You\'ll receive reminders before expiry.'
              }
            ]
          }
        ]
      };

      return NextResponse.json({
        success: true,
        data: faqData
      });
    }

    if (type === 'contact') {
      // Return contact information
      const contactInfo = {
        phone: '+91-1800-123-4567',
        email: 'support@foodsewa.com',
        whatsapp: '+91-9876543210',
        hours: {
          weekdays: '9:00 AM - 11:00 PM',
          weekends: '10:00 AM - 10:00 PM'
        },
        socialMedia: {
          facebook: 'https://facebook.com/foodsewa',
          twitter: 'https://twitter.com/foodsewa',
          instagram: 'https://instagram.com/foodsewa'
        },
        address: {
          street: '123 Food Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        }
      };

      return NextResponse.json({
        success: true,
        data: contactInfo
      });
    }

    // Default: Return support tickets
    const skip = (page - 1) * limit;
    
    let ticketQuery = { userId: new mongoose.Types.ObjectId(user.id) };
    
    if (status) {
      ticketQuery.status = status;
    }
    
    if (category) {
      ticketQuery.category = category;
    }

    const tickets = await SupportTicket.find(ticketQuery)
      .populate('orderId', 'orderNumber total status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTickets = await SupportTicket.countDocuments(ticketQuery);

    // Get ticket statistics
    const ticketStats = await SupportTicket.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user.id) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };

    ticketStats.forEach(stat => {
      stats.total += stat.count;
      stats[stat._id.replace('-', '')] = stat.count;
    });

    // Get recent orders for quick issue reporting
    const recentOrders = await Order.find({ 
      userId: user.id,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .populate('restaurantId', 'name logo')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('orderNumber total status createdAt restaurantId');

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTickets / limit),
          totalTickets,
          hasMore: skip + limit < totalTickets
        },
        statistics: stats,
        recentOrders,
        quickActions: [
          {
            id: 'order-issue',
            title: 'Report Order Issue',
            description: 'Issues with your recent order',
            icon: 'alert-circle',
            category: 'order'
          },
          {
            id: 'payment-issue',
            title: 'Payment Problem',
            description: 'Payment or refund related issues',
            icon: 'credit-card',
            category: 'payment'
          },
          {
            id: 'delivery-issue',
            title: 'Delivery Issue',
            description: 'Late delivery or delivery problems',
            icon: 'truck',
            category: 'delivery'
          },
          {
            id: 'account-help',
            title: 'Account Help',
            description: 'Profile, settings, or login issues',
            icon: 'user',
            category: 'account'
          }
        ]
      }
    });
  } catch (error) {
    console.error('Get support info error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new support ticket
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
      category, 
      subject, 
      description, 
      priority, 
      orderId, 
      attachments,
      contactMethod 
    } = body;

    // Validation
    if (!category || !subject || !description) {
      return NextResponse.json(
        { success: false, message: 'Category, subject, and description are required' },
        { status: 400 }
      );
    }

    const validCategories = ['order', 'payment', 'delivery', 'account', 'technical', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category' },
        { status: 400 }
      );
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, message: 'Invalid priority' },
        { status: 400 }
      );
    }

    // Verify order if provided
    if (orderId) {
      const order = await Order.findOne({ _id: orderId, userId: user.id });
      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found or does not belong to you' },
          { status: 404 }
        );
      }
    }

    // Generate ticket number
    const ticketNumber = 'TKT' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();

    // Create support ticket
    const supportTicket = new SupportTicket({
      ticketNumber,
      userId: user.id,
      category,
      subject,
      description,
      priority: priority || 'medium',
      status: 'open',
      orderId: orderId || null,
      attachments: attachments || [],
      contactMethod: contactMethod || 'email',
      messages: [
        {
          sender: 'user',
          message: description,
          timestamp: new Date(),
          attachments: attachments || []
        }
      ],
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        platform: 'web'
      }
    });

    await supportTicket.save();

    // TODO: Send notification to support team
    // TODO: Send confirmation email to user

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticket: {
          _id: supportTicket._id,
          ticketNumber: supportTicket.ticketNumber,
          category: supportTicket.category,
          subject: supportTicket.subject,
          status: supportTicket.status,
          priority: supportTicket.priority,
          createdAt: supportTicket.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update support ticket or add message
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
    const { ticketId, action, message, attachments, rating, feedback } = body;

    if (!ticketId || !action) {
      return NextResponse.json(
        { success: false, message: 'Ticket ID and action are required' },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findOne({ 
      _id: ticketId, 
      userId: user.id 
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Support ticket not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'add-message':
        if (!message) {
          return NextResponse.json(
            { success: false, message: 'Message is required' },
            { status: 400 }
          );
        }

        // Add new message to ticket
        ticket.messages.push({
          sender: 'user',
          message,
          timestamp: new Date(),
          attachments: attachments || []
        });

        // Update ticket status if it was resolved/closed
        if (ticket.status === 'resolved' || ticket.status === 'closed') {
          ticket.status = 'open';
        }

        ticket.updatedAt = new Date();
        await ticket.save();

        return NextResponse.json({
          success: true,
          message: 'Message added successfully',
          data: {
            messageId: ticket.messages[ticket.messages.length - 1]._id
          }
        });

      case 'close-ticket':
        if (ticket.status === 'closed') {
          return NextResponse.json(
            { success: false, message: 'Ticket is already closed' },
            { status: 400 }
          );
        }

        ticket.status = 'closed';
        ticket.closedAt = new Date();
        ticket.updatedAt = new Date();
        
        if (rating) {
          ticket.rating = {
            score: rating,
            feedback: feedback || '',
            ratedAt: new Date()
          };
        }

        await ticket.save();

        return NextResponse.json({
          success: true,
          message: 'Ticket closed successfully'
        });

      case 'reopen-ticket':
        if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
          return NextResponse.json(
            { success: false, message: 'Only closed or resolved tickets can be reopened' },
            { status: 400 }
          );
        }

        ticket.status = 'open';
        ticket.reopenedAt = new Date();
        ticket.updatedAt = new Date();
        
        if (message) {
          ticket.messages.push({
            sender: 'user',
            message,
            timestamp: new Date(),
            attachments: attachments || []
          });
        }

        await ticket.save();

        return NextResponse.json({
          success: true,
          message: 'Ticket reopened successfully'
        });

      case 'rate-support':
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json(
            { success: false, message: 'Valid rating (1-5) is required' },
            { status: 400 }
          );
        }

        if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
          return NextResponse.json(
            { success: false, message: 'Can only rate resolved or closed tickets' },
            { status: 400 }
          );
        }

        ticket.rating = {
          score: rating,
          feedback: feedback || '',
          ratedAt: new Date()
        };
        
        ticket.updatedAt = new Date();
        await ticket.save();

        return NextResponse.json({
          success: true,
          message: 'Rating submitted successfully'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Update support ticket error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete support ticket (only if not processed)
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
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json(
        { success: false, message: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findOne({ 
      _id: ticketId, 
      userId: user.id 
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Support ticket not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of open tickets that haven't been responded to
    if (ticket.status !== 'open' || ticket.messages.length > 1) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete processed tickets' },
        { status: 400 }
      );
    }

    // Check if ticket was created within last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (ticket.createdAt < thirtyMinutesAgo) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete tickets older than 30 minutes' },
        { status: 400 }
      );
    }

    await SupportTicket.findByIdAndDelete(ticketId);

    return NextResponse.json({
      success: true,
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    console.error('Delete support ticket error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import Notification from '@/models/Notification';

// GET /api/admin/content - Get content management data
export async function GET(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const contentType = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    switch (action) {
      case 'list':
        // Mock content data - in a real application, you'd have a Content model
        const mockContent = [
          {
            _id: '1',
            type: 'banner',
            title: 'Welcome to FoodSewa',
            content: 'Discover amazing restaurants in your area',
            status: 'published',
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(Date.now() - 3600000),
            author: 'Admin',
            metadata: {
              imageUrl: '/images/banner1.jpg',
              link: '/restaurants',
              priority: 1
            }
          },
          {
            _id: '2',
            type: 'announcement',
            title: 'New Features Available',
            content: 'We have added new payment methods and delivery options',
            status: 'draft',
            createdAt: new Date(Date.now() - 172800000),
            updatedAt: new Date(Date.now() - 7200000),
            author: 'Admin',
            metadata: {
              priority: 2,
              targetAudience: 'all'
            }
          },
          {
            _id: '3',
            type: 'promotion',
            title: 'Summer Sale - 20% Off',
            content: 'Get 20% off on all orders above $25',
            status: 'published',
            createdAt: new Date(Date.now() - 259200000),
            updatedAt: new Date(Date.now() - 10800000),
            author: 'Admin',
            metadata: {
              imageUrl: '/images/promo1.jpg',
              validUntil: new Date(Date.now() + 604800000),
              discountPercent: 20,
              minimumOrder: 25
            }
          }
        ];

        let filteredContent = mockContent;
        
        if (contentType) {
          filteredContent = filteredContent.filter(item => item.type === contentType);
        }
        
        if (status) {
          filteredContent = filteredContent.filter(item => item.status === status);
        }

        const skip = (page - 1) * limit;
        const paginatedContent = filteredContent.slice(skip, skip + limit);

        return NextResponse.json({
          success: true,
          content: paginatedContent,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredContent.length / limit),
            totalItems: filteredContent.length,
            hasNext: page < Math.ceil(filteredContent.length / limit),
            hasPrev: page > 1
          },
          stats: {
            total: mockContent.length,
            published: mockContent.filter(item => item.status === 'published').length,
            draft: mockContent.filter(item => item.status === 'draft').length,
            archived: mockContent.filter(item => item.status === 'archived').length
          }
        });

      case 'details':
        const contentId = searchParams.get('contentId');
        if (!contentId) {
          return NextResponse.json(
            { success: false, message: 'Content ID is required' },
            { status: 400 }
          );
        }

        // Mock content details
        const contentDetails = {
          _id: contentId,
          type: 'banner',
          title: 'Welcome to FoodSewa',
          content: 'Discover amazing restaurants in your area',
          status: 'published',
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 3600000),
          author: 'Admin',
          metadata: {
            imageUrl: '/images/banner1.jpg',
            link: '/restaurants',
            priority: 1,
            tags: ['welcome', 'restaurants', 'discovery'],
            seo: {
              metaTitle: 'Welcome to FoodSewa - Best Food Delivery',
              metaDescription: 'Discover amazing restaurants and order delicious food',
              keywords: ['food', 'delivery', 'restaurants']
            }
          },
          analytics: {
            views: 15420,
            clicks: 892,
            conversions: 156
          }
        };

        return NextResponse.json({
          success: true,
          content: contentDetails
        });

      case 'templates':
        const templates = [
          {
            id: 'banner-template',
            name: 'Banner Template',
            type: 'banner',
            description: 'Standard banner for homepage',
            fields: [
              { name: 'title', type: 'text', required: true },
              { name: 'subtitle', type: 'text', required: false },
              { name: 'imageUrl', type: 'image', required: true },
              { name: 'link', type: 'url', required: false },
              { name: 'priority', type: 'number', required: true }
            ]
          },
          {
            id: 'announcement-template',
            name: 'Announcement Template',
            type: 'announcement',
            description: 'System-wide announcements',
            fields: [
              { name: 'title', type: 'text', required: true },
              { name: 'content', type: 'richtext', required: true },
              { name: 'priority', type: 'select', options: ['low', 'medium', 'high'], required: true },
              { name: 'targetAudience', type: 'select', options: ['all', 'customers', 'restaurants'], required: true }
            ]
          },
          {
            id: 'promotion-template',
            name: 'Promotion Template',
            type: 'promotion',
            description: 'Marketing promotions and offers',
            fields: [
              { name: 'title', type: 'text', required: true },
              { name: 'description', type: 'textarea', required: true },
              { name: 'imageUrl', type: 'image', required: true },
              { name: 'discountPercent', type: 'number', required: true },
              { name: 'minimumOrder', type: 'number', required: false },
              { name: 'validUntil', type: 'date', required: true }
            ]
          }
        ];

        return NextResponse.json({
          success: true,
          templates
        });

      case 'analytics':
        const analyticsData = {
          overview: {
            totalContent: 45,
            publishedContent: 32,
            draftContent: 8,
            archivedContent: 5,
            totalViews: 125430,
            totalClicks: 8920,
            averageEngagement: 7.1
          },
          byType: [
            { type: 'banner', count: 12, views: 45230, clicks: 3420 },
            { type: 'announcement', count: 18, views: 32100, clicks: 2150 },
            { type: 'promotion', count: 10, views: 28900, clicks: 2890 },
            { type: 'blog', count: 5, views: 19200, clicks: 460 }
          ],
          topPerforming: [
            {
              id: '1',
              title: 'Welcome to FoodSewa',
              type: 'banner',
              views: 15420,
              clicks: 892,
              engagement: 5.8
            },
            {
              id: '3',
              title: 'Summer Sale - 20% Off',
              type: 'promotion',
              views: 12350,
              clicks: 1234,
              engagement: 10.0
            }
          ],
          trends: {
            viewsOverTime: [
              { date: '2024-01-01', views: 1200 },
              { date: '2024-01-02', views: 1350 },
              { date: '2024-01-03', views: 1180 },
              { date: '2024-01-04', views: 1420 },
              { date: '2024-01-05', views: 1380 }
            ]
          }
        };

        return NextResponse.json({
          success: true,
          analytics: analyticsData
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin content GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/content - Create new content
export async function POST(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { action, ...contentData } = await request.json();

    switch (action) {
      case 'create':
        const {
          type,
          title,
          content,
          status = 'draft',
          metadata = {},
          publishAt,
          expiresAt
        } = contentData;

        if (!type || !title || !content) {
          return NextResponse.json(
            { success: false, message: 'Type, title, and content are required' },
            { status: 400 }
          );
        }

        const validTypes = ['banner', 'announcement', 'promotion', 'blog', 'faq'];
        if (!validTypes.includes(type)) {
          return NextResponse.json(
            { success: false, message: 'Invalid content type' },
            { status: 400 }
          );
        }

        // Mock content creation
        const newContent = {
          _id: `content_${Date.now()}`,
          type,
          title,
          content,
          status,
          metadata,
          publishAt: publishAt ? new Date(publishAt) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: request.user.id,
          analytics: {
            views: 0,
            clicks: 0,
            conversions: 0
          }
        };

        // If content is published and it's an announcement, notify users
        if (status === 'published' && type === 'announcement') {
          const targetAudience = metadata.targetAudience || 'all';
          let userFilter = { isActive: true };
          
          if (targetAudience === 'customers') {
            userFilter.role = 'user';
          } else if (targetAudience === 'restaurants') {
            userFilter.role = 'restaurant';
          }

          const users = await User.find(userFilter).select('_id');
          
          const notifications = users.map(user => ({
            user: user._id,
            type: 'content_announcement',
            title,
            message: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            priority: metadata.priority || 'normal',
            data: {
              contentId: newContent._id,
              contentType: type
            }
          }));

          await Notification.insertMany(notifications);
        }

        return NextResponse.json({
          success: true,
          message: 'Content created successfully',
          content: newContent
        });

      case 'duplicate':
        const { contentId } = contentData;
        
        if (!contentId) {
          return NextResponse.json(
            { success: false, message: 'Content ID is required' },
            { status: 400 }
          );
        }

        // Mock content duplication
        const duplicatedContent = {
          _id: `content_${Date.now()}`,
          type: 'banner',
          title: 'Copy of Welcome to FoodSewa',
          content: 'Discover amazing restaurants in your area',
          status: 'draft',
          metadata: {
            imageUrl: '/images/banner1.jpg',
            link: '/restaurants',
            priority: 1
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          author: request.user.id,
          originalContentId: contentId
        };

        return NextResponse.json({
          success: true,
          message: 'Content duplicated successfully',
          content: duplicatedContent
        });

      case 'bulk-import':
        const { contentItems } = contentData;
        
        if (!contentItems || !Array.isArray(contentItems)) {
          return NextResponse.json(
            { success: false, message: 'Content items array is required' },
            { status: 400 }
          );
        }

        const importResults = [];
        
        for (const item of contentItems) {
          try {
            if (!item.type || !item.title || !item.content) {
              importResults.push({
                title: item.title || 'Unknown',
                success: false,
                error: 'Missing required fields'
              });
              continue;
            }

            const importedContent = {
              _id: `content_${Date.now()}_${Math.random()}`,
              ...item,
              status: item.status || 'draft',
              createdAt: new Date(),
              updatedAt: new Date(),
              author: request.user.id
            };

            importResults.push({
              title: item.title,
              success: true,
              contentId: importedContent._id
            });
          } catch (error) {
            importResults.push({
              title: item.title || 'Unknown',
              success: false,
              error: error.message
            });
          }
        }

        const successCount = importResults.filter(r => r.success).length;
        
        return NextResponse.json({
          success: true,
          message: `Imported ${successCount} of ${contentItems.length} content items`,
          results: importResults
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin content POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/content - Update content
export async function PUT(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { contentId, action, ...updateData } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { success: false, message: 'Content ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update':
        const {
          title,
          content,
          metadata,
          publishAt,
          expiresAt
        } = updateData;

        // Mock content update
        const updatedContent = {
          _id: contentId,
          title: title || 'Updated Content Title',
          content: content || 'Updated content body',
          metadata: metadata || {},
          publishAt: publishAt ? new Date(publishAt) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          updatedAt: new Date(),
          updatedBy: request.user.id
        };

        return NextResponse.json({
          success: true,
          message: 'Content updated successfully',
          content: updatedContent
        });

      case 'publish':
        // Mock content publishing
        const publishedContent = {
          _id: contentId,
          status: 'published',
          publishedAt: new Date(),
          publishedBy: request.user.id,
          updatedAt: new Date()
        };

        return NextResponse.json({
          success: true,
          message: 'Content published successfully',
          content: publishedContent
        });

      case 'unpublish':
        // Mock content unpublishing
        const unpublishedContent = {
          _id: contentId,
          status: 'draft',
          unpublishedAt: new Date(),
          unpublishedBy: request.user.id,
          updatedAt: new Date()
        };

        return NextResponse.json({
          success: true,
          message: 'Content unpublished successfully',
          content: unpublishedContent
        });

      case 'archive':
        // Mock content archiving
        const archivedContent = {
          _id: contentId,
          status: 'archived',
          archivedAt: new Date(),
          archivedBy: request.user.id,
          updatedAt: new Date()
        };

        return NextResponse.json({
          success: true,
          message: 'Content archived successfully',
          content: archivedContent
        });

      case 'schedule':
        const { scheduledPublishAt } = updateData;
        
        if (!scheduledPublishAt) {
          return NextResponse.json(
            { success: false, message: 'Scheduled publish date is required' },
            { status: 400 }
          );
        }

        const scheduledDate = new Date(scheduledPublishAt);
        if (scheduledDate <= new Date()) {
          return NextResponse.json(
            { success: false, message: 'Scheduled date must be in the future' },
            { status: 400 }
          );
        }

        // Mock content scheduling
        const scheduledContent = {
          _id: contentId,
          status: 'scheduled',
          publishAt: scheduledDate,
          scheduledBy: request.user.id,
          updatedAt: new Date()
        };

        return NextResponse.json({
          success: true,
          message: 'Content scheduled successfully',
          content: scheduledContent
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin content PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content - Delete content
export async function DELETE(request) {
  try {
    await authenticate(request);
    await adminOnly(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const bulkDelete = searchParams.get('bulkDelete');
    const contentIds = searchParams.get('contentIds');

    if (contentId) {
      // Delete single content
      return NextResponse.json({
        success: true,
        message: 'Content deleted successfully'
      });
    }

    if (bulkDelete === 'true' && contentIds) {
      // Bulk delete
      const ids = contentIds.split(',');
      
      return NextResponse.json({
        success: true,
        message: `${ids.length} content items deleted successfully`
      });
    }

    return NextResponse.json(
      { success: false, message: 'Content ID is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin content DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
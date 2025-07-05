import { NextResponse } from 'next/server';
import { authenticate, adminOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';

// GET /api/admin/pages - Get page management data
export async function GET(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search');

    switch (action) {
      case 'list':
        // Mock pages data - in a real application, you'd have a Page model
        const mockPages = [
          {
            _id: '1',
            title: 'About Us',
            slug: 'about-us',
            content: 'Learn more about FoodSewa and our mission to connect you with the best restaurants.',
            status: 'published',
            type: 'static',
            template: 'default',
            seo: {
              metaTitle: 'About FoodSewa - Food Delivery Service',
              metaDescription: 'Learn about FoodSewa, the leading food delivery platform connecting customers with restaurants.',
              keywords: ['about', 'foodsewa', 'food delivery']
            },
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(Date.now() - 3600000),
            author: 'Admin',
            views: 1250
          },
          {
            _id: '2',
            title: 'Privacy Policy',
            slug: 'privacy-policy',
            content: 'Our privacy policy outlines how we collect, use, and protect your personal information.',
            status: 'published',
            type: 'legal',
            template: 'legal',
            seo: {
              metaTitle: 'Privacy Policy - FoodSewa',
              metaDescription: 'Read our privacy policy to understand how we handle your data.',
              keywords: ['privacy', 'policy', 'data protection']
            },
            createdAt: new Date(Date.now() - 172800000),
            updatedAt: new Date(Date.now() - 7200000),
            author: 'Admin',
            views: 890
          },
          {
            _id: '3',
            title: 'Terms of Service',
            slug: 'terms-of-service',
            content: 'Terms and conditions for using FoodSewa platform.',
            status: 'published',
            type: 'legal',
            template: 'legal',
            seo: {
              metaTitle: 'Terms of Service - FoodSewa',
              metaDescription: 'Read our terms of service for using FoodSewa platform.',
              keywords: ['terms', 'service', 'conditions']
            },
            createdAt: new Date(Date.now() - 259200000),
            updatedAt: new Date(Date.now() - 10800000),
            author: 'Admin',
            views: 650
          },
          {
            _id: '4',
            title: 'FAQ',
            slug: 'faq',
            content: 'Frequently asked questions about FoodSewa.',
            status: 'draft',
            type: 'support',
            template: 'faq',
            seo: {
              metaTitle: 'FAQ - FoodSewa',
              metaDescription: 'Find answers to frequently asked questions about FoodSewa.',
              keywords: ['faq', 'questions', 'help']
            },
            createdAt: new Date(Date.now() - 345600000),
            updatedAt: new Date(Date.now() - 14400000),
            author: 'Admin',
            views: 0
          },
          {
            _id: '5',
            title: 'Contact Us',
            slug: 'contact-us',
            content: 'Get in touch with our support team.',
            status: 'published',
            type: 'contact',
            template: 'contact',
            seo: {
              metaTitle: 'Contact Us - FoodSewa',
              metaDescription: 'Contact FoodSewa support team for help and inquiries.',
              keywords: ['contact', 'support', 'help']
            },
            createdAt: new Date(Date.now() - 432000000),
            updatedAt: new Date(Date.now() - 18000000),
            author: 'Admin',
            views: 2100
          }
        ];

        let filteredPages = mockPages;
        
        if (status) {
          filteredPages = filteredPages.filter(page => page.status === status);
        }
        
        if (search) {
          filteredPages = filteredPages.filter(page => 
            page.title.toLowerCase().includes(search.toLowerCase()) ||
            page.slug.toLowerCase().includes(search.toLowerCase())
          );
        }

        const skip = (page - 1) * limit;
        const paginatedPages = filteredPages.slice(skip, skip + limit);

        return NextResponse.json({
          success: true,
          pages: paginatedPages,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredPages.length / limit),
            totalItems: filteredPages.length,
            hasNext: page < Math.ceil(filteredPages.length / limit),
            hasPrev: page > 1
          },
          stats: {
            total: mockPages.length,
            published: mockPages.filter(page => page.status === 'published').length,
            draft: mockPages.filter(page => page.status === 'draft').length,
            archived: mockPages.filter(page => page.status === 'archived').length
          }
        });

      case 'details':
        const pageId = searchParams.get('pageId');
        if (!pageId) {
          return NextResponse.json(
            { success: false, message: 'Page ID is required' },
            { status: 400 }
          );
        }

        // Mock page details
        const pageDetails = {
          _id: pageId,
          title: 'About Us',
          slug: 'about-us',
          content: `<h1>About FoodSewa</h1>
          <p>Welcome to FoodSewa, your premier food delivery platform that connects food lovers with the best restaurants in their area.</p>
          <h2>Our Mission</h2>
          <p>To make delicious food accessible to everyone, anytime, anywhere.</p>
          <h2>Our Story</h2>
          <p>Founded in 2024, FoodSewa has grown to become the leading food delivery service...</p>`,
          status: 'published',
          type: 'static',
          template: 'default',
          seo: {
            metaTitle: 'About FoodSewa - Food Delivery Service',
            metaDescription: 'Learn about FoodSewa, the leading food delivery platform connecting customers with restaurants.',
            keywords: ['about', 'foodsewa', 'food delivery'],
            ogImage: '/images/about-og.jpg',
            canonicalUrl: 'https://foodsewa.com/about-us'
          },
          settings: {
            showInMenu: true,
            menuOrder: 1,
            allowComments: false,
            requireAuth: false,
            customCSS: '',
            customJS: ''
          },
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 3600000),
          author: 'Admin',
          lastEditedBy: 'Admin',
          views: 1250,
          analytics: {
            dailyViews: [
              { date: '2024-01-01', views: 45 },
              { date: '2024-01-02', views: 52 },
              { date: '2024-01-03', views: 38 },
              { date: '2024-01-04', views: 61 },
              { date: '2024-01-05', views: 49 }
            ],
            topReferrers: [
              { source: 'google.com', visits: 320 },
              { source: 'direct', visits: 280 },
              { source: 'facebook.com', visits: 150 }
            ]
          }
        };

        return NextResponse.json({
          success: true,
          page: pageDetails
        });

      case 'templates':
        const templates = [
          {
            id: 'default',
            name: 'Default Template',
            description: 'Standard page layout with header and footer',
            preview: '/images/templates/default.jpg',
            sections: ['header', 'content', 'footer'],
            customizable: true
          },
          {
            id: 'legal',
            name: 'Legal Template',
            description: 'Template for legal pages like privacy policy and terms',
            preview: '/images/templates/legal.jpg',
            sections: ['header', 'content', 'last-updated', 'footer'],
            customizable: false
          },
          {
            id: 'faq',
            name: 'FAQ Template',
            description: 'Template for frequently asked questions',
            preview: '/images/templates/faq.jpg',
            sections: ['header', 'search', 'categories', 'questions', 'footer'],
            customizable: true
          },
          {
            id: 'contact',
            name: 'Contact Template',
            description: 'Template for contact pages with forms',
            preview: '/images/templates/contact.jpg',
            sections: ['header', 'contact-form', 'map', 'info', 'footer'],
            customizable: true
          },
          {
            id: 'landing',
            name: 'Landing Page Template',
            description: 'Template for marketing landing pages',
            preview: '/images/templates/landing.jpg',
            sections: ['hero', 'features', 'testimonials', 'cta', 'footer'],
            customizable: true
          }
        ];

        return NextResponse.json({
          success: true,
          templates
        });

      case 'analytics':
        const analyticsData = {
          overview: {
            totalPages: 25,
            publishedPages: 20,
            draftPages: 3,
            archivedPages: 2,
            totalViews: 45230,
            uniqueVisitors: 12450,
            averageTimeOnPage: 125
          },
          topPages: [
            {
              id: '5',
              title: 'Contact Us',
              slug: 'contact-us',
              views: 2100,
              uniqueVisitors: 1850,
              bounceRate: 25.5
            },
            {
              id: '1',
              title: 'About Us',
              slug: 'about-us',
              views: 1250,
              uniqueVisitors: 1100,
              bounceRate: 35.2
            },
            {
              id: '2',
              title: 'Privacy Policy',
              slug: 'privacy-policy',
              views: 890,
              uniqueVisitors: 780,
              bounceRate: 45.8
            }
          ],
          trafficSources: [
            { source: 'Organic Search', percentage: 45.2, visitors: 5634 },
            { source: 'Direct', percentage: 32.1, visitors: 3996 },
            { source: 'Social Media', percentage: 15.7, visitors: 1955 },
            { source: 'Referral', percentage: 7.0, visitors: 871 }
          ],
          deviceBreakdown: [
            { device: 'Mobile', percentage: 65.3, visitors: 8128 },
            { device: 'Desktop', percentage: 28.7, visitors: 3571 },
            { device: 'Tablet', percentage: 6.0, visitors: 747 }
          ],
          viewsOverTime: [
            { date: '2024-01-01', views: 420 },
            { date: '2024-01-02', views: 485 },
            { date: '2024-01-03', views: 392 },
            { date: '2024-01-04', views: 567 },
            { date: '2024-01-05', views: 523 }
          ]
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
    console.error('Admin pages GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pages - Create new page
export async function POST(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { action, ...pageData } = await request.json();

    switch (action) {
      case 'create':
        const {
          title,
          slug,
          content,
          status = 'draft',
          type = 'static',
          template = 'default',
          seo = {},
          settings = {}
        } = pageData;

        if (!title || !slug || !content) {
          return NextResponse.json(
            { success: false, message: 'Title, slug, and content are required' },
            { status: 400 }
          );
        }

        // Validate slug format
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(slug)) {
          return NextResponse.json(
            { success: false, message: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
            { status: 400 }
          );
        }

        const validTypes = ['static', 'legal', 'support', 'contact', 'landing'];
        if (!validTypes.includes(type)) {
          return NextResponse.json(
            { success: false, message: 'Invalid page type' },
            { status: 400 }
          );
        }

        // Mock page creation
        const newPage = {
          _id: `page_${Date.now()}`,
          title,
          slug,
          content,
          status,
          type,
          template,
          seo: {
            metaTitle: seo.metaTitle || title,
            metaDescription: seo.metaDescription || '',
            keywords: seo.keywords || [],
            ogImage: seo.ogImage || '',
            canonicalUrl: seo.canonicalUrl || `https://foodsewa.com/${slug}`
          },
          settings: {
            showInMenu: settings.showInMenu || false,
            menuOrder: settings.menuOrder || 0,
            allowComments: settings.allowComments || false,
            requireAuth: settings.requireAuth || false,
            customCSS: settings.customCSS || '',
            customJS: settings.customJS || ''
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          author: request.user.id,
          views: 0
        };

        return NextResponse.json({
          success: true,
          message: 'Page created successfully',
          page: newPage
        });

      case 'duplicate':
        const { pageId } = pageData;
        
        if (!pageId) {
          return NextResponse.json(
            { success: false, message: 'Page ID is required' },
            { status: 400 }
          );
        }

        // Mock page duplication
        const duplicatedPage = {
          _id: `page_${Date.now()}`,
          title: 'Copy of About Us',
          slug: `copy-of-about-us-${Date.now()}`,
          content: 'Learn more about FoodSewa and our mission...',
          status: 'draft',
          type: 'static',
          template: 'default',
          seo: {
            metaTitle: 'Copy of About Us',
            metaDescription: '',
            keywords: [],
            ogImage: '',
            canonicalUrl: ''
          },
          settings: {
            showInMenu: false,
            menuOrder: 0,
            allowComments: false,
            requireAuth: false,
            customCSS: '',
            customJS: ''
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          author: request.user.id,
          originalPageId: pageId,
          views: 0
        };

        return NextResponse.json({
          success: true,
          message: 'Page duplicated successfully',
          page: duplicatedPage
        });

      case 'import':
        const { importData, importType } = pageData;
        
        if (!importData) {
          return NextResponse.json(
            { success: false, message: 'Import data is required' },
            { status: 400 }
          );
        }

        let importedPages = [];
        
        if (importType === 'json') {
          try {
            const pages = JSON.parse(importData);
            
            for (const pageData of pages) {
              if (!pageData.title || !pageData.slug || !pageData.content) {
                continue;
              }
              
              const importedPage = {
                _id: `page_${Date.now()}_${Math.random()}`,
                ...pageData,
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date(),
                author: request.user.id,
                views: 0
              };
              
              importedPages.push(importedPage);
            }
          } catch (error) {
            return NextResponse.json(
              { success: false, message: 'Invalid JSON format' },
              { status: 400 }
            );
          }
        }

        return NextResponse.json({
          success: true,
          message: `Imported ${importedPages.length} pages successfully`,
          pages: importedPages
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin pages POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/pages - Update page
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { pageId, action, ...updateData } = await request.json();

    if (!pageId) {
      return NextResponse.json(
        { success: false, message: 'Page ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update':
        const {
          title,
          slug,
          content,
          seo,
          settings
        } = updateData;

        // Validate slug if provided
        if (slug) {
          const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
          if (!slugRegex.test(slug)) {
            return NextResponse.json(
              { success: false, message: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
              { status: 400 }
            );
          }
        }

        // Mock page update
        const updatedPage = {
          _id: pageId,
          title: title || 'Updated Page Title',
          slug: slug || 'updated-page-slug',
          content: content || 'Updated page content',
          seo: seo || {},
          settings: settings || {},
          updatedAt: new Date(),
          lastEditedBy: request.user.id
        };

        return NextResponse.json({
          success: true,
          message: 'Page updated successfully',
          page: updatedPage
        });

      case 'publish':
        // Mock page publishing
        const publishedPage = {
          _id: pageId,
          status: 'published',
          publishedAt: new Date(),
          publishedBy: request.user.id,
          updatedAt: new Date()
        };

        return NextResponse.json({
          success: true,
          message: 'Page published successfully',
          page: publishedPage
        });

      case 'unpublish':
        // Mock page unpublishing
        const unpublishedPage = {
          _id: pageId,
          status: 'draft',
          unpublishedAt: new Date(),
          unpublishedBy: request.user.id,
          updatedAt: new Date()
        };

        return NextResponse.json({
          success: true,
          message: 'Page unpublished successfully',
          page: unpublishedPage
        });

      case 'archive':
        // Mock page archiving
        const archivedPage = {
          _id: pageId,
          status: 'archived',
          archivedAt: new Date(),
          archivedBy: request.user.id,
          updatedAt: new Date()
        };

        return NextResponse.json({
          success: true,
          message: 'Page archived successfully',
          page: archivedPage
        });

      case 'change-template':
        const { template } = updateData;
        
        if (!template) {
          return NextResponse.json(
            { success: false, message: 'Template is required' },
            { status: 400 }
          );
        }

        const validTemplates = ['default', 'legal', 'faq', 'contact', 'landing'];
        if (!validTemplates.includes(template)) {
          return NextResponse.json(
            { success: false, message: 'Invalid template' },
            { status: 400 }
          );
        }

        // Mock template change
        const templateChangedPage = {
          _id: pageId,
          template,
          updatedAt: new Date(),
          lastEditedBy: request.user.id
        };

        return NextResponse.json({
          success: true,
          message: 'Page template changed successfully',
          page: templateChangedPage
        });

      case 'update-seo':
        const { seoData } = updateData;
        
        if (!seoData) {
          return NextResponse.json(
            { success: false, message: 'SEO data is required' },
            { status: 400 }
          );
        }

        // Mock SEO update
        const seoUpdatedPage = {
          _id: pageId,
          seo: seoData,
          updatedAt: new Date(),
          lastEditedBy: request.user.id
        };

        return NextResponse.json({
          success: true,
          message: 'Page SEO updated successfully',
          page: seoUpdatedPage
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin pages PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/pages - Delete page
export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    adminOnly(user);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const bulkDelete = searchParams.get('bulkDelete');
    const pageIds = searchParams.get('pageIds');

    if (pageId) {
      // Delete single page
      return NextResponse.json({
        success: true,
        message: 'Page deleted successfully'
      });
    }

    if (bulkDelete === 'true' && pageIds) {
      // Bulk delete
      const ids = pageIds.split(',');
      
      return NextResponse.json({
        success: true,
        message: `${ids.length} pages deleted successfully`
      });
    }

    return NextResponse.json(
      { success: false, message: 'Page ID is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin pages DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
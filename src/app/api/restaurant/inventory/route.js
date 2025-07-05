import { NextResponse } from 'next/server';
import { authenticate, restaurantOnly } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import MenuItem from '@/models/MenuItem';
import Notification from '@/models/Notification';

// GET /api/restaurant/inventory - Get inventory management data
export async function GET(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');
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
        const filter = { restaurant: restaurantId };
        
        if (category) {
          filter.category = category;
        }
        
        if (lowStock === 'true') {
          filter.$expr = {
            $lte: ['$inventory.currentStock', '$inventory.lowStockThreshold']
          };
        }

        const skip = (page - 1) * limit;
        const [items, totalItems, categories] = await Promise.all([
          MenuItem.find(filter)
            .select('name category price isAvailable inventory createdAt updatedAt')
            .skip(skip)
            .limit(limit)
            .sort({ updatedAt: -1 }),
          MenuItem.countDocuments(filter),
          MenuItem.distinct('category', { restaurant: restaurantId })
        ]);

        // Calculate inventory statistics
        const inventoryStats = await MenuItem.aggregate([
          { $match: { restaurant: restaurantId } },
          {
            $group: {
              _id: null,
              totalItems: { $sum: 1 },
              availableItems: {
                $sum: { $cond: ['$isAvailable', 1, 0] }
              },
              lowStockItems: {
                $sum: {
                  $cond: [
                    { $lte: ['$inventory.currentStock', '$inventory.lowStockThreshold'] },
                    1,
                    0
                  ]
                }
              },
              outOfStockItems: {
                $sum: {
                  $cond: [
                    { $eq: ['$inventory.currentStock', 0] },
                    1,
                    0
                  ]
                }
              },
              totalValue: {
                $sum: {
                  $multiply: ['$inventory.currentStock', '$inventory.costPerUnit']
                }
              }
            }
          }
        ]);

        return NextResponse.json({
          success: true,
          items,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
            hasNext: page < Math.ceil(totalItems / limit),
            hasPrev: page > 1
          },
          categories,
          stats: inventoryStats[0] || {
            totalItems: 0,
            availableItems: 0,
            lowStockItems: 0,
            outOfStockItems: 0,
            totalValue: 0
          }
        });

      case 'alerts':
        const alerts = await MenuItem.find({
          restaurant: restaurantId,
          $or: [
            { $expr: { $lte: ['$inventory.currentStock', '$inventory.lowStockThreshold'] } },
            { 'inventory.expiryDate': { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
          ]
        })
          .select('name category inventory')
          .sort({ 'inventory.currentStock': 1 });

        const alertSummary = {
          lowStock: alerts.filter(item => 
            item.inventory.currentStock <= item.inventory.lowStockThreshold
          ).length,
          expiringSoon: alerts.filter(item => 
            item.inventory.expiryDate && 
            item.inventory.expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          ).length
        };

        return NextResponse.json({
          success: true,
          alerts,
          summary: alertSummary
        });

      case 'history':
        const itemId = searchParams.get('itemId');
        if (!itemId) {
          return NextResponse.json(
            { success: false, message: 'Item ID is required for history' },
            { status: 400 }
          );
        }

        const item = await MenuItem.findOne({
          _id: itemId,
          restaurant: restaurantId
        }).select('name inventory.stockHistory');

        if (!item) {
          return NextResponse.json(
            { success: false, message: 'Item not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          item: {
            name: item.name,
            stockHistory: item.inventory.stockHistory || []
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant inventory GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurant/inventory - Update inventory
export async function PUT(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { itemId, action, ...updateData } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'Item ID is required' },
        { status: 400 }
      );
    }

    const restaurantId = request.user.restaurantId;
    const item = await MenuItem.findOne({
      _id: itemId,
      restaurant: restaurantId
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update-stock':
        const { quantity, type, reason, costPerUnit } = updateData;
        
        if (!quantity || !type || !['add', 'remove', 'set'].includes(type)) {
          return NextResponse.json(
            { success: false, message: 'Valid quantity and type (add/remove/set) are required' },
            { status: 400 }
          );
        }

        const previousStock = item.inventory.currentStock || 0;
        let newStock;
        
        switch (type) {
          case 'add':
            newStock = previousStock + quantity;
            break;
          case 'remove':
            newStock = Math.max(0, previousStock - quantity);
            break;
          case 'set':
            newStock = quantity;
            break;
        }

        // Update stock
        item.inventory.currentStock = newStock;
        if (costPerUnit) {
          item.inventory.costPerUnit = costPerUnit;
        }
        item.inventory.lastUpdated = new Date();

        // Add to stock history
        if (!item.inventory.stockHistory) {
          item.inventory.stockHistory = [];
        }
        
        item.inventory.stockHistory.push({
          date: new Date(),
          type,
          quantity,
          previousStock,
          newStock,
          reason: reason || `Stock ${type}`,
          updatedBy: request.user.id
        });

        // Check if item should be marked as unavailable
        if (newStock === 0) {
          item.isAvailable = false;
        } else if (newStock > 0 && !item.isAvailable) {
          item.isAvailable = true;
        }

        await item.save();

        // Check for low stock alert
        if (newStock <= item.inventory.lowStockThreshold && newStock > 0) {
          await Notification.create({
            user: request.user.id,
            type: 'low_stock_alert',
            title: 'Low Stock Alert',
            message: `${item.name} is running low on stock (${newStock} remaining)`,
            data: { itemId: item._id, itemName: item.name, currentStock: newStock }
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Stock updated successfully',
          item: {
            _id: item._id,
            name: item.name,
            inventory: item.inventory,
            isAvailable: item.isAvailable
          }
        });

      case 'set-threshold':
        const { lowStockThreshold, reorderPoint } = updateData;
        
        if (lowStockThreshold < 0) {
          return NextResponse.json(
            { success: false, message: 'Low stock threshold must be non-negative' },
            { status: 400 }
          );
        }

        item.inventory.lowStockThreshold = lowStockThreshold;
        if (reorderPoint !== undefined) {
          item.inventory.reorderPoint = reorderPoint;
        }
        item.inventory.lastUpdated = new Date();

        await item.save();

        return NextResponse.json({
          success: true,
          message: 'Thresholds updated successfully',
          item: {
            _id: item._id,
            name: item.name,
            inventory: item.inventory
          }
        });

      case 'set-expiry':
        const { expiryDate } = updateData;
        
        if (!expiryDate) {
          return NextResponse.json(
            { success: false, message: 'Expiry date is required' },
            { status: 400 }
          );
        }

        const expiry = new Date(expiryDate);
        if (expiry <= new Date()) {
          return NextResponse.json(
            { success: false, message: 'Expiry date must be in the future' },
            { status: 400 }
          );
        }

        item.inventory.expiryDate = expiry;
        item.inventory.lastUpdated = new Date();

        await item.save();

        return NextResponse.json({
          success: true,
          message: 'Expiry date updated successfully',
          item: {
            _id: item._id,
            name: item.name,
            inventory: item.inventory
          }
        });

      case 'update-cost':
        const { newCostPerUnit } = updateData;
        
        if (!newCostPerUnit || newCostPerUnit < 0) {
          return NextResponse.json(
            { success: false, message: 'Valid cost per unit is required' },
            { status: 400 }
          );
        }

        item.inventory.costPerUnit = newCostPerUnit;
        item.inventory.lastUpdated = new Date();

        await item.save();

        return NextResponse.json({
          success: true,
          message: 'Cost updated successfully',
          item: {
            _id: item._id,
            name: item.name,
            inventory: item.inventory
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant inventory PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/restaurant/inventory - Bulk operations and reports
export async function POST(request) {
  try {
    const user = await authenticate(request);
    restaurantOnly(user);
    await connectDB();
    
    request.user = user;

    const { action, ...actionData } = await request.json();
    const restaurantId = request.user.restaurantId;

    switch (action) {
      case 'bulk-update':
        const { items } = actionData;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Items array is required' },
            { status: 400 }
          );
        }

        const results = [];
        for (const itemUpdate of items) {
          try {
            const { itemId, quantity, type = 'set', reason } = itemUpdate;
            
            const item = await MenuItem.findOne({
              _id: itemId,
              restaurant: restaurantId
            });

            if (!item) {
              results.push({ itemId, success: false, error: 'Item not found' });
              continue;
            }

            const previousStock = item.inventory.currentStock || 0;
            let newStock;
            
            switch (type) {
              case 'add':
                newStock = previousStock + quantity;
                break;
              case 'remove':
                newStock = Math.max(0, previousStock - quantity);
                break;
              case 'set':
                newStock = quantity;
                break;
              default:
                results.push({ itemId, success: false, error: 'Invalid type' });
                continue;
            }

            item.inventory.currentStock = newStock;
            item.inventory.lastUpdated = new Date();
            
            if (!item.inventory.stockHistory) {
              item.inventory.stockHistory = [];
            }
            
            item.inventory.stockHistory.push({
              date: new Date(),
              type,
              quantity,
              previousStock,
              newStock,
              reason: reason || `Bulk ${type}`,
              updatedBy: request.user.id
            });

            if (newStock === 0) {
              item.isAvailable = false;
            } else if (newStock > 0 && !item.isAvailable) {
              item.isAvailable = true;
            }

            await item.save();
            results.push({ itemId, success: true, newStock });
          } catch (error) {
            results.push({ itemId: itemUpdate.itemId, success: false, error: error.message });
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Bulk update completed',
          results
        });

      case 'generate-report':
        const { reportType, startDate, endDate } = actionData;
        
        if (!reportType || !['stock-movement', 'low-stock', 'expiry'].includes(reportType)) {
          return NextResponse.json(
            { success: false, message: 'Valid report type is required' },
            { status: 400 }
          );
        }

        let reportData;
        
        switch (reportType) {
          case 'stock-movement':
            const dateFilter = {};
            if (startDate && endDate) {
              dateFilter['inventory.stockHistory.date'] = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              };
            }

            reportData = await MenuItem.aggregate([
              { $match: { restaurant: restaurantId, ...dateFilter } },
              { $unwind: '$inventory.stockHistory' },
              {
                $match: startDate && endDate ? {
                  'inventory.stockHistory.date': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                  }
                } : {}
              },
              {
                $group: {
                  _id: '$_id',
                  name: { $first: '$name' },
                  category: { $first: '$category' },
                  movements: { $push: '$inventory.stockHistory' },
                  totalAdded: {
                    $sum: {
                      $cond: [
                        { $eq: ['$inventory.stockHistory.type', 'add'] },
                        '$inventory.stockHistory.quantity',
                        0
                      ]
                    }
                  },
                  totalRemoved: {
                    $sum: {
                      $cond: [
                        { $eq: ['$inventory.stockHistory.type', 'remove'] },
                        '$inventory.stockHistory.quantity',
                        0
                      ]
                    }
                  }
                }
              },
              { $sort: { name: 1 } }
            ]);
            break;

          case 'low-stock':
            reportData = await MenuItem.find({
              restaurant: restaurantId,
              $expr: {
                $lte: ['$inventory.currentStock', '$inventory.lowStockThreshold']
              }
            })
              .select('name category inventory.currentStock inventory.lowStockThreshold')
              .sort({ 'inventory.currentStock': 1 });
            break;

          case 'expiry':
            const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            reportData = await MenuItem.find({
              restaurant: restaurantId,
              'inventory.expiryDate': {
                $exists: true,
                $lte: thirtyDaysFromNow
              }
            })
              .select('name category inventory.expiryDate inventory.currentStock')
              .sort({ 'inventory.expiryDate': 1 });
            break;
        }

        return NextResponse.json({
          success: true,
          report: {
            type: reportType,
            generatedAt: new Date(),
            data: reportData
          }
        });

      case 'auto-reorder':
        const itemsToReorder = await MenuItem.find({
          restaurant: restaurantId,
          $expr: {
            $lte: ['$inventory.currentStock', '$inventory.reorderPoint']
          },
          'inventory.reorderPoint': { $exists: true, $gt: 0 }
        }).select('name inventory');

        const reorderList = itemsToReorder.map(item => ({
          itemId: item._id,
          itemName: item.name,
          currentStock: item.inventory.currentStock,
          reorderPoint: item.inventory.reorderPoint,
          suggestedQuantity: (item.inventory.reorderPoint * 2) - item.inventory.currentStock
        }));

        return NextResponse.json({
          success: true,
          reorderList,
          message: `Found ${reorderList.length} items that need reordering`
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Restaurant inventory POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
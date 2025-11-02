const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');
const User = require('../models/User');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin', 'staff'));

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Products stats
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ active: true });
    const featuredProducts = await Product.countDocuments({ featured: true });

    // Inquiries stats
    const totalInquiries = await Inquiry.countDocuments();
    const newInquiries = await Inquiry.countDocuments({ status: 'new' });
    const inProgressInquiries = await Inquiry.countDocuments({ status: 'in-progress' });

    // Orders stats
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Revenue (last 30 days)
    const revenueLast30Days = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    // Recent activities
    const recentInquiries = await Inquiry.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email subject status createdAt');

    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(5)
      .select('orderNumber customer.name customer.email status total createdAt');

    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          featured: featuredProducts
        },
        inquiries: {
          total: totalInquiries,
          new: newInquiries,
          inProgress: inProgressInquiries
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          revenueLast30Days: revenueLast30Days[0]?.total || 0
        },
        recentInquiries,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/database/stats
// @desc    Get actual database statistics and size
// @access  Private/Admin
router.get('/database/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    // Get collection counts
    const totalInquiries = await Inquiry.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Get actual sizes for each collection (with error handling)
    let inquiryStats = { size: 0, storageSize: 0 };
    let orderStats = { size: 0, storageSize: 0 };
    let productStats = { size: 0, storageSize: 0 };
    let userStats = { size: 0, storageSize: 0 };
    
    try {
      inquiryStats = await db.collection('inquiries').stats({ scale: 1 });
    } catch (e) {
      // Collection might not exist or stats unavailable
      console.log('Could not get inquiries stats:', e.message);
    }
    
    try {
      orderStats = await db.collection('orders').stats({ scale: 1 });
    } catch (e) {
      console.log('Could not get orders stats:', e.message);
    }
    
    try {
      productStats = await db.collection('products').stats({ scale: 1 });
    } catch (e) {
      console.log('Could not get products stats:', e.message);
    }
    
    try {
      userStats = await db.collection('users').stats({ scale: 1 });
    } catch (e) {
      console.log('Could not get users stats:', e.message);
    }
    
    // Calculate sizes in MB
    // MongoDB Atlas shows "Data Size" which is storageSize (includes data + indexes + overhead)
    const dbSizeMB = (stats.dataSize || 0) / (1024 * 1024);
    const storageSizeMB = (stats.storageSize || 0) / (1024 * 1024); // This is what Atlas shows
    const indexSizeMB = (stats.indexSize || 0) / (1024 * 1024);
    
    // Use storageSize as total (matches MongoDB Atlas dashboard)
    // This is the actual size shown in MongoDB Atlas
    const totalSizeMB = storageSizeMB;
    
    // Use storageSize (actual disk usage) instead of size (uncompressed)
    const inquirySizeMB = ((inquiryStats.storageSize || inquiryStats.size || 0) / (1024 * 1024));
    const orderSizeMB = ((orderStats.storageSize || orderStats.size || 0) / (1024 * 1024));
    const productSizeMB = ((productStats.storageSize || productStats.size || 0) / (1024 * 1024));
    const userSizeMB = ((userStats.storageSize || userStats.size || 0) / (1024 * 1024));
    
    res.json({
      success: true,
      data: {
        database: {
          dataSizeMB: parseFloat(dbSizeMB.toFixed(2)),
          storageSizeMB: parseFloat(storageSizeMB.toFixed(2)), // This matches Atlas
          totalSizeMB: parseFloat(totalSizeMB.toFixed(2)), // Use storageSize (matches Atlas)
          indexesSizeMB: parseFloat(indexSizeMB.toFixed(2)),
          collections: stats.collections || 0,
          objects: stats.objects || 0
        },
        collections: {
          inquiries: {
            count: totalInquiries,
            sizeMB: parseFloat(inquirySizeMB.toFixed(2))
          },
          orders: {
            count: totalOrders,
            sizeMB: parseFloat(orderSizeMB.toFixed(2))
          },
          products: {
            count: totalProducts,
            sizeMB: parseFloat(productSizeMB.toFixed(2))
          },
          users: {
            count: totalUsers,
            sizeMB: parseFloat(userSizeMB.toFixed(2))
          }
        },
        totalRecords: totalInquiries + totalOrders + totalProducts + totalUsers,
        limitMB: 512,
        usagePercent: parseFloat(((totalSizeMB / 512) * 100).toFixed(1))
      }
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching database statistics',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/clear-all-data
// @desc    Clear all data from database (dangerous operation)
// @access  Private/Admin Only
router.delete('/clear-all-data', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get counts and stats before deletion
    const beforeInquiries = await Inquiry.countDocuments();
    const beforeOrders = await Order.countDocuments();
    const beforeProducts = await Product.countDocuments();
    
    // Get database stats before
    const statsBefore = await db.stats();
    const storageSizeBeforeMB = (statsBefore.storageSize || 0) / (1024 * 1024);
    
    // Delete all inquiries
    let inquiriesDeleted = 0;
    try {
      const deleteResult = await Inquiry.deleteMany({});
      inquiriesDeleted = deleteResult.deletedCount || 0;
      // Drop all indexes to free space immediately
      try {
        await db.collection('inquiries').dropIndexes();
      } catch (e) {
        // Indexes might not exist
      }
    } catch (error) {
      console.error('Error deleting inquiries:', error);
    }
    
    // Delete all orders
    let ordersDeleted = 0;
    try {
      const deleteResult = await Order.deleteMany({});
      ordersDeleted = deleteResult.deletedCount || 0;
      // Drop all indexes to free space immediately
      try {
        await db.collection('orders').dropIndexes();
      } catch (e) {
        // Indexes might not exist
      }
    } catch (error) {
      console.error('Error deleting orders:', error);
    }
    
    // Delete all products (but keep admin users)
    let productsDeleted = 0;
    try {
      const deleteResult = await Product.deleteMany({});
      productsDeleted = deleteResult.deletedCount || 0;
      // Drop all indexes to free space immediately
      try {
        await db.collection('products').dropIndexes();
      } catch (e) {
        // Indexes might not exist
      }
    } catch (error) {
      console.error('Error deleting products:', error);
    }
    
    // Wait for MongoDB to process deletions and update stats
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get fresh database stats after deletion
    const statsAfter = await db.stats();
    const storageSizeAfterMB = (statsAfter.storageSize || 0) / (1024 * 1024);
    const dataSizeAfterMB = (statsAfter.dataSize || 0) / (1024 * 1024);
    
    // Verify counts are actually zero
    const afterInquiries = await Inquiry.countDocuments();
    const afterOrders = await Order.countDocuments();
    const afterProducts = await Product.countDocuments();
    
    console.log('Clear All Data Results:', {
      before: { 
        inquiries: beforeInquiries, 
        orders: beforeOrders, 
        products: beforeProducts,
        storageMB: storageSizeBeforeMB.toFixed(2)
      },
      deleted: { 
        inquiries: inquiriesDeleted, 
        orders: ordersDeleted, 
        products: productsDeleted 
      },
      after: { 
        inquiries: afterInquiries, 
        orders: afterOrders, 
        products: afterProducts,
        storageMB: storageSizeAfterMB.toFixed(2)
      },
      freedMB: (storageSizeBeforeMB - storageSizeAfterMB).toFixed(2)
    });

    res.json({
      success: true,
      message: 'All data cleared successfully',
      data: {
        before: {
          inquiries: beforeInquiries,
          orders: beforeOrders,
          products: beforeProducts,
          storageSizeMB: parseFloat(storageSizeBeforeMB.toFixed(2))
        },
        deleted: {
          inquiries: inquiriesDeleted,
          orders: ordersDeleted,
          products: productsDeleted
        },
        verified: {
          inquiriesRemaining: afterInquiries,
          ordersRemaining: afterOrders,
          productsRemaining: afterProducts
        },
        after: {
          storageSizeMB: parseFloat(storageSizeAfterMB.toFixed(2)),
          dataSizeMB: parseFloat(dataSizeAfterMB.toFixed(2)),
          freedMB: parseFloat((storageSizeBeforeMB - storageSizeAfterMB).toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing database',
      error: error.message
    });
  }
});

module.exports = router;


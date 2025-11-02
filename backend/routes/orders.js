const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/orders
// @desc    Create new order
// @access  Public (can be protected later)
router.post(
  '/',
  [
    body('customer.name').notEmpty().withMessage('Customer name is required'),
    body('customer.email').isEmail().withMessage('Valid email is required'),
    body('customer.phone').notEmpty().withMessage('Phone is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Calculate totals
      let subtotal = 0;
      const items = [];

      for (const item of req.body.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product ${item.product} not found`
          });
        }

        const itemPrice = item.price || product.price || 0;
        const itemTotal = itemPrice * item.quantity;

        items.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: itemPrice,
          total: itemTotal
        });

        subtotal += itemTotal;
      }

      const tax = req.body.tax || 0;
      const shipping = req.body.shipping || 0;
      const total = subtotal + tax + shipping;

      // Create order
      const order = await Order.create({
        customer: req.body.customer,
        items,
        subtotal,
        tax,
        shipping,
        total,
        currency: req.body.currency || 'KES',
        paymentMethod: req.body.paymentMethod,
        notes: req.body.notes
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating order',
        error: error.message
      });
    }
  }
);

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('items.product', 'name image');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private/Admin
router.get('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get order statistics
// @access  Private/Admin
router.get('/stats/summary', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const pending = await Order.countDocuments({ status: 'pending' });
    const confirmed = await Order.countDocuments({ status: 'confirmed' });
    const processing = await Order.countDocuments({ status: 'processing' });
    const shipped = await Order.countDocuments({ status: 'shipped' });
    const delivered = await Order.countDocuments({ status: 'delivered' });

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const last30Days = await Order.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        processing,
        shipped,
        delivered,
        totalRevenue: totalRevenue[0]?.total || 0,
        last30Days
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;


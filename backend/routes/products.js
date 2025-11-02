const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');

// @route   GET /api/products
// @desc    Get all products (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      subcategory,
      featured,
      active,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (featured !== undefined) query.featured = featured === 'true';
    if (active !== undefined) {
      query.active = active === 'true';
    } else {
      query.active = true; // Default to active products only
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// @route   GET /api/products/slug/:slug
// @desc    Get product by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, active: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private/Admin
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn([
      'ppe-safety-gear',
      'medical-equipment',
      'sterilization-waste',
      'sanitary-solutions',
      'spill-management',
      'public-health-sanitation'
    ]).withMessage('Invalid category'),
    body('image').notEmpty().withMessage('Product image is required')
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

      const product = await Product.create(req.body);

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }
  }
);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// @route   GET /api/products/categories/list
// @desc    Get all categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

module.exports = router;


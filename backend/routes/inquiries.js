const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/inquiries
// @desc    Create new inquiry
// @access  Public
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return res.status(400).json({
          success: false,
          message: errorMessages,
          errors: errors.array()
        });
      }

      // Get IP and user agent
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      // Filter out empty strings for optional enum fields
      const inquiryData = { ...req.body };
      
      // Remove empty strings for optional enum fields - set to undefined instead
      if (inquiryData.productCategory === '' || !inquiryData.productCategory) {
        delete inquiryData.productCategory;
      }
      if (inquiryData.urgency === '' || !inquiryData.urgency) {
        delete inquiryData.urgency;
      }
      if (inquiryData.quantity === '') {
        inquiryData.quantity = undefined;
      }

      const inquiry = await Inquiry.create({
        ...inquiryData,
        ipAddress,
        userAgent
      });

      // Send confirmation email to customer
      try {
        await sendEmail({
          email: inquiry.email,
          ...emailTemplates.inquiryConfirmation(inquiry.name)
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      // Send notification email to admin
      try {
        await sendEmail({
          email: process.env.EMAIL_USER,
          ...emailTemplates.newInquiry(inquiry)
        });
      } catch (emailError) {
        console.error('Error sending admin notification:', emailError);
      }

      res.status(201).json({
        success: true,
        message: 'Inquiry submitted successfully',
        data: inquiry
      });
    } catch (error) {
      console.error('Error creating inquiry:', error);
      console.error('Error stack:', error.stack);
      
      // Provide more detailed error messages
      let errorMessage = 'Error submitting inquiry';
      if (error.name === 'ValidationError') {
        errorMessage = 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/inquiries
// @desc    Get all inquiries (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      status,
      subject,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (subject) query.subject = subject;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const inquiries = await Inquiry.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('assignedTo', 'name email');

    const total = await Inquiry.countDocuments(query);

    res.json({
      success: true,
      count: inquiries.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: inquiries
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiries',
      error: error.message
    });
  }
});

// @route   GET /api/inquiries/:id
// @desc    Get single inquiry
// @access  Private/Admin
router.get('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('assignedTo', 'name email');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiry',
      error: error.message
    });
  }
});

// @route   PUT /api/inquiries/:id
// @desc    Update inquiry (status, response, etc.)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        respondedAt: req.body.status === 'responded' ? new Date() : undefined
      },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inquiry',
      error: error.message
    });
  }
});

// @route   DELETE /api/inquiries/:id
// @desc    Delete inquiry
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      message: 'Inquiry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting inquiry',
      error: error.message
    });
  }
});

// @route   GET /api/inquiries/stats/summary
// @desc    Get inquiry statistics
// @access  Private/Admin
router.get('/stats/summary', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const total = await Inquiry.countDocuments();
    const newInquiries = await Inquiry.countDocuments({ status: 'new' });
    const inProgress = await Inquiry.countDocuments({ status: 'in-progress' });
    const responded = await Inquiry.countDocuments({ status: 'responded' });
    const closed = await Inquiry.countDocuments({ status: 'closed' });

    const last30Days = await Inquiry.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        total,
        new: newInquiries,
        inProgress,
        responded,
        closed,
        last30Days
      }
    });
  } catch (error) {
    console.error('Error fetching inquiry stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;


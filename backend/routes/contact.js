const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { body, validationResult } = require('express-validator');

// @route   POST /api/contact
// @desc    Send contact form message
// @access  Public
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').notEmpty().withMessage('Message is required')
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

      // Create inquiry from contact form
      const inquiry = await Inquiry.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || '',
        company: req.body.company || '',
        subject: req.body.subject || 'general',
        message: req.body.message,
        productCategory: req.body.productCategory || '',
        quantity: req.body.quantity || '',
        urgency: req.body.urgency || 'standard',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });

      // Send confirmation email to customer
      try {
        await sendEmail({
          email: inquiry.email,
          ...emailTemplates.inquiryConfirmation(inquiry.name)
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
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
        message: 'Message sent successfully. We will get back to you soon!',
        data: {
          id: inquiry._id,
          status: inquiry.status
        }
      });
    } catch (error) {
      console.error('Error sending contact message:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending message. Please try again.',
        error: error.message
      });
    }
  }
);

module.exports = router;


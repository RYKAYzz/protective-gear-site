const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: [
      'quote-request',
      'product-inquiry',
      'technical-support',
      'installation-service',
      'maintenance-service',
      'partnership',
      'general'
    ]
  },
  productCategory: {
    type: String,
    enum: [
      'ppe-safety-gear',
      'medical-equipment',
      'sterilization-waste',
      'sanitary-solutions',
      'spill-management',
      'public-health-sanitation'
    ],
    default: undefined
  },
  quantity: String,
  urgency: {
    type: String,
    enum: ['immediate', 'urgent', 'standard', 'flexible'],
    default: undefined
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'responded', 'closed'],
    default: 'new'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  response: {
    type: String
  },
  respondedAt: {
    type: Date
  },
  source: {
    type: String,
    default: 'website'
  },
  ipAddress: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ email: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);


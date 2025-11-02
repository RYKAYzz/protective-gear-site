const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service configuration error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

const sendEmail = async (options) => {
  // Don't fail if email credentials are not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured. Skipping email send.');
    return { messageId: 'skipped-no-credentials' };
  }

  try {
    const message = {
      from: `"ARK Hygiene Solutions" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(message);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending error:', error.message || error);
    // Don't throw - just log the error
    // This way inquiries can still be saved even if email fails
    return { error: error.message || 'Email send failed' };
  }
};

// Email templates
const emailTemplates = {
  inquiryConfirmation: (name) => ({
    subject: 'Thank you for contacting ARK Hygiene Solutions',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a90e2;">Thank you for contacting us!</h2>
        <p>Dear ${name},</p>
        <p>We have received your inquiry and will get back to you within 24 hours.</p>
        <p>Our team is reviewing your request and will contact you soon.</p>
        <p>Best regards,<br>ARK Hygiene Solutions Team</p>
      </div>
    `,
    text: `Thank you for contacting ARK Hygiene Solutions. We have received your inquiry and will get back to you within 24 hours.`
  }),
  
  newInquiry: (inquiry) => ({
    subject: `New Inquiry: ${inquiry.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a90e2;">New Inquiry Received</h2>
        <p><strong>Name:</strong> ${inquiry.name}</p>
        <p><strong>Email:</strong> ${inquiry.email}</p>
        <p><strong>Phone:</strong> ${inquiry.phone || 'Not provided'}</p>
        <p><strong>Company:</strong> ${inquiry.company || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${inquiry.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${inquiry.message}</p>
      </div>
    `,
    text: `New inquiry from ${inquiry.name} (${inquiry.email}): ${inquiry.message}`
  })
};

module.exports = { sendEmail, emailTemplates };


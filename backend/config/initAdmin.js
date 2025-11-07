const User = require('../models/User');

module.exports = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (!adminExists) {
      // Require environment variables for security
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
        console.error('⚠️  Please add them to your .env file');
        return;
      }

      // Create admin user
      const admin = await User.create({
        name: 'Admin User',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      });
      
      console.log('✅ Admin user created successfully');
      console.log(`📧 Email: ${admin.email}`);
      console.log('🔑 Password: [HIDDEN FOR SECURITY]');
      console.log('⚠️  Please change the default password after first login!');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
  }
};


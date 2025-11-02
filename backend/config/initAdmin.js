const User = require('../models/User');

module.exports = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (!adminExists) {
      // Create admin user
      const admin = await User.create({
        name: 'Admin User',
        email: process.env.ADMIN_EMAIL || 'admin@arkhygiene.com',
        password: process.env.ADMIN_PASSWORD || 'admin123456',
        role: 'admin'
      });
      
      console.log('✅ Admin user created successfully');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'admin123456'}`);
      console.log('⚠️  Please change the default password after first login!');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
  }
};


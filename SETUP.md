# ARK Hygiene Website - Setup Guide

This guide will help you set up both the frontend and backend for the ARK Hygiene Solutions website.

## 📋 Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download here](https://www.mongodb.com/try/download/community)
  - Or use MongoDB Atlas (cloud) - [Sign up here](https://www.mongodb.com/cloud/atlas)

## 🚀 Quick Start

### 1. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
# Copy from example (create manually if needed)
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ark-hygiene
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@arkhygiene.com
ADMIN_PASSWORD=change-this-password
```

4. Start MongoDB (if running locally):
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud) and update MONGODB_URI
```

5. Start the backend server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend API will be available at `http://localhost:5000/api`

### 2. Frontend Setup

1. Update API configuration in `js/api.js`:
```javascript
// Update this line to match your backend URL
const API_BASE_URL = 'http://localhost:5000/api';
```

2. Open the website:
   - Simply open `index.html` in your browser, or
   - Use a local server (recommended):
   ```bash
   # Using Python
   python -m http.server 3000
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 3000
   ```

3. Access the website at `http://localhost:3000`

## 📧 Email Configuration

### Using Gmail

1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an "App Password":
   - Go to: https://myaccount.google.com/apppasswords
   - Create a new app password for "Mail"
   - Use this password in `EMAIL_PASS` in your `.env` file

### Using Other Email Services

Update these in your `.env`:
- **Outlook**: `EMAIL_HOST=smtp.office365.com`, `EMAIL_PORT=587`
- **SendGrid**: Use SMTP settings from SendGrid dashboard
- **AWS SES**: Use SES SMTP credentials

## 🔐 Admin Access

On first run, the backend creates an admin user:
- **Email**: From `ADMIN_EMAIL` in `.env` (default: `admin@arkhygiene.com`)
- **Password**: From `ADMIN_PASSWORD` in `.env` (default: `change-this-password`)

**⚠️ Important: Change the default password after first login!**

## 🗄️ Database Setup

### Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/ark-hygiene`

### MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ark-hygiene
   ```

## 📱 Testing the API

### Using Browser

1. Open `http://localhost:5000/api/health`
2. Should see: `{"status":"ok","message":"ARK Hygiene API is running"}`

### Using cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Get products
curl http://localhost:5000/api/products

# Create inquiry
curl -X POST http://localhost:5000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","subject":"general","message":"Test inquiry"}'
```

### Using Postman

1. Import the API endpoints
2. Test each endpoint
3. Use authentication token for protected routes

## 🐛 Troubleshooting

### Backend won't start

- Check if MongoDB is running
- Verify `.env` file exists and has correct values
- Check if port 5000 is available
- Check console for error messages

### Can't connect to database

- Verify MongoDB connection string in `.env`
- Check if MongoDB service is running (local)
- Verify network/firewall settings (cloud)
- Check MongoDB Atlas IP whitelist (cloud)

### Email not sending

- Verify email credentials in `.env`
- Check if app password is correct (Gmail)
- Verify SMTP settings
- Check console for email errors

### Frontend can't connect to API

- Verify `API_BASE_URL` in `js/api.js`
- Check if backend is running
- Check browser console for CORS errors
- Verify `FRONTEND_URL` in backend `.env`

## 📚 Next Steps

1. **Create Admin Dashboard** - Access admin features
2. **Add Products** - Populate product catalog
3. **Configure Email** - Set up email notifications
4. **Customize** - Update branding, colors, content
5. **Deploy** - Deploy to production server

## 🔗 Useful Links

- [Node.js Documentation](https://nodejs.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)

## 💡 Tips

- Always use environment variables for sensitive data
- Keep `.env` file out of version control
- Use strong JWT secrets in production
- Regularly backup your database
- Monitor server logs for errors
- Use HTTPS in production

## 🆘 Support

If you encounter any issues:
1. Check the console/terminal for error messages
2. Review the documentation
3. Check the GitHub issues (if applicable)
4. Contact the development team

---

**Happy coding! 🚀**


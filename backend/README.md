# ARK Hygiene Backend API

Backend API server for ARK Hygiene Solutions website.

## Features

- **RESTful API** for products, inquiries, orders, and admin management
- **MongoDB Database** for data storage
- **JWT Authentication** for admin access
- **Email Service** integration for notifications
- **Admin Dashboard** with statistics
- **Product Management** system
- **Order Tracking** system
- **Inquiry Management** system

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - MongoDB connection string
   - JWT secret
   - Email service credentials
   - Admin credentials

4. Start the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## Environment Variables

See `.env.example` for all required environment variables.

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/inquiries` - Create new inquiry
- `POST /api/contact` - Send contact message
- `POST /api/orders` - Create new order
- `POST /api/auth/login` - Login user

### Protected Endpoints (Admin/Staff)

- `GET /api/inquiries` - Get all inquiries
- `PUT /api/inquiries/:id` - Update inquiry
- `GET /api/orders` - Get all orders
- `PUT /api/orders/:id` - Update order
- `GET /api/admin/dashboard` - Get dashboard stats

### Admin Only

- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/auth/register` - Register new user
- `DELETE /api/inquiries/:id` - Delete inquiry

## Database Models

- **Product** - Product catalog
- **Inquiry** - Customer inquiries
- **Order** - Customer orders
- **User** - Admin/staff users

## Default Admin Credentials

On first run, the system creates an admin user:
- Email: From `ADMIN_EMAIL` in `.env`
- Password: From `ADMIN_PASSWORD` in `.env`

**⚠️ Important: Change the default password after first login!**

## API Documentation

### Products

```javascript
// Get all products
GET /api/products?category=ppe-safety-gear&page=1&limit=20

// Get single product
GET /api/products/:id

// Create product (Admin)
POST /api/products
{
  "name": "Product Name",
  "description": "Product description",
  "category": "ppe-safety-gear",
  "image": "path/to/image.jpg",
  "price": 1000
}
```

### Inquiries

```javascript
// Create inquiry
POST /api/inquiries
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "subject": "quote-request",
  "message": "I need a quote for..."
}

// Get all inquiries (Admin)
GET /api/inquiries?status=new&page=1
```

### Authentication

```javascript
// Login
POST /api/auth/login
{
  "email": "admin@arkhygiene.com",
  "password": "password"
}

// Get current user
GET /api/auth/me
Headers: { "Authorization": "Bearer <token>" }
```

## Testing

```bash
npm test
```

## Security Features

- Helmet.js for security headers
- CORS protection
- Rate limiting
- Password hashing with bcrypt
- JWT token authentication
- Input validation

## Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update MongoDB connection string
3. Configure email service
4. Set strong JWT_SECRET
5. Deploy to your hosting platform (Heroku, DigitalOcean, AWS, etc.)

## Support

For issues or questions, contact the development team.


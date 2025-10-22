# Food CMS Backend API

Backend API for Food CMS built with Express.js, TypeScript, SQL Server, and Better Auth.

## 🚀 Features

- **Authentication & Authorization**: Better Auth with JWT tokens stored in httpOnly cookies
- **Google OAuth**: Sign in with Google support
- **Database**: SQL Server with connection pooling
- **Security**: Helmet, CORS, Rate Limiting, Input Validation
- **Logging**: Winston logger with file rotation
- **OTP**: Twilio integration for phone verification
- **Google Maps**: Geocoding and delivery zone management
- **File Upload**: Multer with Sharp for image processing

## 📋 Prerequisites

- Node.js >= 18.x
- SQL Server 2019 or later
- npm or pnpm

## 🛠️ Installation

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration:

   - SQL Server credentials
   - Better Auth secrets
   - Twilio credentials (for OTP)
   - Google Maps API key

4. Run database migrations (create tables):

```bash
# Run the SQL scripts in database/ folder
```

## 🏃 Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, auth, etc.)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware (auth, validation, etc.)
│   ├── models/          # Database models/types
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── validators/      # Request validation schemas
│   └── index.ts         # Application entry point
├── scripts/
│   └── migrate-data.ts  # Data migration from Supabase
├── database/
│   ├── schema.sql       # Database schema
│   ├── stored-procedures.sql
│   └── seed.sql         # Initial data
├── logs/                # Application logs
├── uploads/             # Uploaded files
└── package.json
```

## 🔒 Security Features

- ✅ HTTPS enforced in production
- ✅ Secure httpOnly cookies
- ✅ JWT token authentication
- ✅ Rate limiting (5 req/15min for auth, 100 req/15min for API)
- ✅ Account lockout after 5 failed attempts
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Input validation with Zod
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Security headers with Helmet
- ✅ Request logging
- ✅ Error handling (no sensitive data exposure)

## 🔑 Environment Variables

See `.env.example` for all required environment variables.

## 📝 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `POST /api/auth/google` - Sign in with Google (requires idToken)
- `POST /api/auth/signout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Products

- `GET /api/products` - Get all products (with pagination)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders

- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/cancel` - Cancel order

### Categories, Branches, Addresses, etc.

See full API documentation in `/docs`

## 🧪 Testing

```bash
npm test
```

## 📦 Data Migration

To migrate data from Supabase to SQL Server:

```bash
npm run migrate
```

## 🚢 Deployment

1. Build the application:

```bash
npm run build
```

2. Set environment variables for production

3. Start the server:

```bash
npm start
```

## 📄 License

ISC

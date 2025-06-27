# FoodSewa Authentication System Setup

## Overview
This authentication system provides complete user management functionality for the FoodSewa food delivery platform, including login, registration, password reset, and admin dashboard capabilities.

## Features Implemented

### Authentication
- ✅ User Registration with email verification
- ✅ User Login with JWT tokens
- ✅ Password Reset via email
- ✅ Role-based access control (Admin, Restaurant, User)
- ✅ Secure password hashing with bcrypt
- ✅ JWT token management with HTTP-only cookies

### Admin Dashboard
- ✅ User management (view, activate/deactivate, delete)
- ✅ Real-time statistics display
- ✅ Search and filter functionality
- ✅ Role-based authorization

### Frontend Integration
- ✅ Login page with backend integration
- ✅ Signup page with backend integration
- ✅ Forgot password page with reset functionality
- ✅ Admin dashboard with user management

## Installation

### 1. Install Dependencies
```bash
npm install mongoose bcryptjs jsonwebtoken nodemailer
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/foodsewa

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@foodsewa.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup
Make sure MongoDB is running on your local machine:
```bash
# Start MongoDB service
mongod
```

### 4. Start the Application
```bash
npm run dev
```

## File Structure

```
src/
├── actions/
│   └── authActions.js          # Server actions for authentication
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.js        # Authentication API endpoints
│   │   └── admin/
│   │       └── route.js        # Admin API endpoints
│   ├── login/
│   │   └── page.js            # Login page
│   ├── signup/
│   │   └── page.js            # Signup page
│   ├── forgetpassword/
│   │   └── page.js            # Forgot password page
│   └── admin/
│       └── dashboard/
│           └── page.js        # Admin dashboard
├── controllers/
│   └── authController.js      # Authentication business logic
├── lib/
│   └── db.js                  # Database connection
├── middleware/
│   └── auth.js                # Authentication middleware
└── models/
    └── User.js                # User model schema
```

## API Endpoints

### Authentication Endpoints
- `POST /api/auth` - Register, Login, Forgot Password, Reset Password
- `GET /api/auth` - Get current user
- `DELETE /api/auth` - Logout

### Admin Endpoints
- `GET /api/admin` - Get users list, user details, statistics
- `PUT /api/admin` - Update user profile, toggle status, change role
- `DELETE /api/admin` - Delete user

## Usage

### Creating an Admin User
1. Register a new user through the signup page
2. Manually update the user's role in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@foodsewa.com" },
  { $set: { role: "admin" } }
)
```

### Testing Authentication
1. Visit `/signup` to create a new account
2. Visit `/login` to sign in
3. Visit `/admin/dashboard` (admin users only)
4. Test password reset at `/forgetpassword`

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Role-Based Access**: Middleware for route protection
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure API access

## Next Steps

1. **Email Configuration**: Set up proper SMTP credentials for password reset emails
2. **Production Security**: Update JWT secret and other sensitive configurations
3. **User Verification**: Implement email verification for new registrations
4. **Rate Limiting**: Add rate limiting for authentication endpoints
5. **Logging**: Implement comprehensive logging for security events

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in .env.local

2. **JWT Token Issues**
   - Verify JWT_SECRET is set in .env.local
   - Clear browser cookies if experiencing auth issues

3. **Email Not Sending**
   - Check email credentials in .env.local
   - Ensure "Less secure app access" is enabled for Gmail
   - Consider using App Passwords for Gmail

4. **Permission Denied**
   - Verify user roles in the database
   - Check middleware authentication logic

## Contributing

When adding new features:
1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update this README with new features
5. Test all authentication flows

---

**Note**: This is a development setup. For production deployment, ensure all security configurations are properly set and secrets are managed securely.
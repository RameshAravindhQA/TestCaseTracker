
# TestCaseTracker - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites Check
```bash
node --version  # Should be 18+
npm --version   # Should be 8+
```

### 2. Database Setup (Replit)
1. Go to Database tab → Create PostgreSQL database
2. Copy the DATABASE_URL provided

### 3. Environment Setup
Create `.env` file:
```env
DATABASE_URL=your-postgresql-connection-string
NODE_ENV=development
JWT_SECRET=your-secret-key
PORT=5000
```

### 4. Installation & Run
```bash
cd "TestCaseTracker/TestCaseTracker (1)"
npm install
npm run db:migrate
npm run dev
```

### 5. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Database Studio: `npm run db:studio`

### 6. Default Login
Create your admin account through the registration page or use the seeded data if available.

## 🔧 Essential Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm start           # Start production

# Database
npm run db:migrate   # Apply database migrations
npm run db:studio    # Open database management

# Testing
npm run test         # Run tests
npm run test:coverage # Test with coverage
```

## 📁 Key Directories

- `client/src/pages/` - Application pages
- `client/src/components/` - UI components
- `server/` - Backend API
- `shared/` - Shared types and schemas
- `uploads/` - File storage

## 🎯 Core Features

1. **Test Case Management** - Create, edit, organize test cases
2. **Bug Tracking** - Report and track bugs with attachments
3. **Project Management** - Organize work by projects and modules  
4. **Document Management** - Upload and organize documents
5. **Reporting** - Generate comprehensive reports
6. **Traceability Matrix** - Requirements traceability
7. **User Management** - Role-based access control

## 🔗 Useful Links

- [Complete Setup Guide](./SETUP_GUIDE.md)
- [Database Setup](./DATABASE_SETUP.md)
- [Dependencies List](./DEPENDENCIES.md)

## ❓ Need Help?

Check the [Troubleshooting section](./SETUP_GUIDE.md#troubleshooting) in the complete setup guide.

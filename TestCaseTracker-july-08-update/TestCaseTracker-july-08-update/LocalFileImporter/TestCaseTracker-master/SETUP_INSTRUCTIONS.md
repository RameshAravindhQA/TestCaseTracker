# Test Case Management Application - Setup Instructions

## Quick Start Guide

Your Test Case Management application is ready to run! Follow these steps to get it working on your Windows system with PostgreSQL database integration.

### Prerequisites Installation

1. **Install Node.js**
   - Download from: https://nodejs.org/
   - Choose the LTS version (recommended)
   - Install with default settings

2. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/windows/
   - Remember the password you set for the postgres user
   - Default port: 5432

### Database Setup

1. **Open PostgreSQL Command Line (SQL Shell)**
   - Search "SQL Shell (psql)" in Windows Start menu
   - Press Enter for defaults, enter your postgres password

2. **Create Database and User**
   ```sql
   CREATE DATABASE testcase_tracker;
   CREATE USER testcase_user WITH PASSWORD 'your_password_here';
   GRANT ALL PRIVILEGES ON DATABASE testcase_tracker TO testcase_user;
   \q
   ```

### Application Setup

1. **Install Dependencies**
   ```cmd
   cd TestCaseTracker-master
   npm install
   npm install socket.io @types/socket.io ws @types/ws
   ```

2. **Create Environment Configuration**
   Create a `.env` file in the project root:
   ```env
   DATABASE_URL=postgresql://testcase_user:your_password_here@localhost:5432/testcase_tracker
   NODE_ENV=development
   ```

3. **Fix Missing Dependencies**
   If you encounter module errors, install additional dependencies:
   ```cmd
   npm install bcrypt express-session passport passport-local
   npm install @types/bcrypt @types/express-session @types/passport @types/passport-local
   ```

### Starting the Application

1. **Method 1: Direct Start**
   ```cmd
   npm run dev
   ```

2. **Method 2: Simple Start (if npm run dev fails)**
   ```cmd
   npx tsx server/index.ts
   ```

3. **Method 3: Manual Start**
   ```cmd
   node start-app.js
   ```

### Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5008
- The application will automatically create database tables on first run

### Default Login Credentials

Use these to access the application initially:
- Email: admin@testcase.com
- Password: admin123

### Features Available

✅ **User Management** - Register, login, manage user accounts
✅ **Project Management** - Create and organize testing projects  
✅ **Test Case Management** - Create, edit, and track test cases
✅ **Bug Tracking** - Report and manage software bugs
✅ **Dashboard** - View metrics and project overview
✅ **File Uploads** - Attach documents and images
✅ **PostgreSQL Storage** - All data persists permanently

### Troubleshooting

**Port Already in Use**
```cmd
# Kill any running Node processes
taskkill /f /im node.exe
```

**Database Connection Issues**
- Verify PostgreSQL service is running
- Check Windows Services for "postgresql" service
- Ensure firewall allows port 5432

**Missing Modules**
```cmd
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Compilation Errors**
- The application can run with tsx even if TypeScript has compilation warnings
- Focus on getting the server running first, then address any specific errors

### Production Deployment

For production use:
1. Set `NODE_ENV=production` in your environment
2. Use a production PostgreSQL database
3. Configure proper SSL certificates
4. Set up proper backup procedures

Your Test Case Management application is now ready with full PostgreSQL database integration for persistent data storage!
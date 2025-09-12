
# TestCaseTracker - Complete Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Database Setup](#database-setup)
4. [Dependencies Installation](#dependencies-installation)
5. [Environment Configuration](#environment-configuration)
6. [Backend Setup](#backend-setup)
7. [Frontend Setup](#frontend-setup)
8. [Running the Application](#running-the-application)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the TestCaseTracker application, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL 13+** database
- **npm** or **yarn** package manager
- **Git** for version control

## Project Structure

```
TestCaseTracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
├── server/                 # Express backend
│   ├── api/                # API route handlers
│   ├── __tests__/          # Server tests
│   ├── db-storage.ts       # Database operations
│   ├── db.ts               # Database connection
│   ├── routes.ts           # Route definitions
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
├── uploads/                # File upload directory
└── static/                 # Static files
```

## Database Setup

### 1. PostgreSQL Installation

**For Replit (Recommended):**
1. Open the Database tab in Replit sidebar
2. Click "Create Database" → Select "PostgreSQL"
3. Note the connection details provided

**For Local Development:**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)

### 2. Database Creation

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE testcasetracker;

# Create user
CREATE USER testuser WITH ENCRYPTED PASSWORD 'testpassword';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE testcasetracker TO testuser;
GRANT ALL ON SCHEMA public TO testuser;

# Exit
\q
```

### 3. Database Schema Migration

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# View database (optional)
npm run db:studio
```

## Dependencies Installation

### Complete Installation Script

Run this single command to install all dependencies:

```bash
cd "TestCaseTracker/TestCaseTracker (1)"
npm install
```

### Manual Installation (if needed)

**Core Backend Dependencies:**
```bash
# Framework & Server
npm install express cors helmet morgan
npm install @types/express @types/cors @types/helmet @types/morgan --save-dev

# Database
npm install postgres drizzle-orm drizzle-kit
npm install @types/pg --save-dev

# Authentication & Security
npm install jsonwebtoken bcryptjs express-session
npm install @types/jsonwebtoken @types/bcryptjs @types/express-session --save-dev

# File Upload
npm install multer sharp
npm install @types/multer --save-dev

# Utilities
npm install dotenv uuid date-fns
npm install @types/uuid --save-dev
```

**Core Frontend Dependencies:**
```bash
# React Framework
npm install react react-dom react-router-dom
npm install @types/react @types/react-dom --save-dev

# Build Tools
npm install vite @vitejs/plugin-react
npm install typescript --save-dev

# UI Components (Radix UI)
npm install @radix-ui/react-alert-dialog @radix-ui/react-avatar
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label @radix-ui/react-select
npm install @radix-ui/react-tabs @radix-ui/react-toast
npm install @radix-ui/react-tooltip @radix-ui/react-slot

# Styling
npm install tailwindcss postcss autoprefixer
npm install clsx tailwind-merge lucide-react

# State Management
npm install @tanstack/react-query

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Charts & Visualization
npm install recharts

# Additional Features
npm install react-dnd react-dnd-html5-backend
npm install date-fns react-day-picker
npm install papaparse jspdf jspdf-autotable
npm install reactflow
```

**Development Dependencies:**
```bash
npm install --save-dev tsx nodemon concurrently
npm install --save-dev @types/node @types/papaparse @types/react-dnd
npm install --save-dev vitest @vitest/coverage-v8
```

## Environment Configuration

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://testuser:testpassword@localhost:5432/testcasetracker
DB_HOST=localhost
DB_PORT=5432
DB_NAME=testcasetracker
DB_USER=testuser
DB_PASSWORD=testpassword
DB_SSL=false

# Application Configuration
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
CLIENT_ROOT=./client

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

# Session Configuration
SESSION_SECRET=your-session-secret-change-this-in-production
SESSION_MAX_AGE=86400000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**For Production (Replit):**
```env
DATABASE_URL=your-replit-postgresql-connection-string
DB_SSL=true
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-repl-name.your-username.repl.co
```

## Backend Setup

### 1. Database Connection

The backend uses Drizzle ORM with PostgreSQL. Connection configuration is in `server/db.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || 
  "postgresql://testuser:testpassword@localhost:5432/testcasetracker";

const client = postgres(connectionString, {
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);
```

### 2. Server Configuration

The main server file is `server/index.ts` which:
- Sets up Express server
- Configures middleware (CORS, helmet, etc.)
- Sets up routes
- Serves static files
- Handles file uploads

### 3. API Routes

The application includes the following API endpoints:

- **Authentication:** `/api/auth/*`
- **Projects:** `/api/projects/*`
- **Modules:** `/api/modules/*`
- **Test Cases:** `/api/test-cases/*`
- **Bugs:** `/api/bugs/*`
- **Documents:** `/api/documents/*`
- **Reports:** `/api/reports/*`
- **Users:** `/api/users/*`
- **Timesheets:** `/api/timesheets/*`

## Frontend Setup

### 1. React Configuration

The frontend is built with:
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Radix UI** for components
- **React Query** for data fetching
- **React Router** for navigation

### 2. Key Components

- **Authentication:** Login, register, password reset
- **Dashboard:** Overview with charts and statistics
- **Test Management:** Test cases, modules, projects
- **Bug Tracking:** Bug reports and management
- **Document Management:** File upload and organization
- **Reports:** Consolidated reporting system
- **Traceability Matrix:** Requirements traceability

### 3. State Management

Uses React Query for:
- Server state management
- Caching
- Background updates
- Optimistic updates

## Running the Application

### Development Mode

```bash
# Navigate to project directory
cd "TestCaseTracker/TestCaseTracker (1)"

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

This will:
1. Start the Express server on port 5000
2. Start the Vite dev server
3. Open the application in your browser

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:generate # Generate migration files
npm run db:migrate  # Apply migrations
npm run db:studio   # Open database studio

# Testing
npm run test        # Run tests
npm run test:run    # Run tests once
npm run test:coverage # Run tests with coverage

# Type Checking
npm run check       # TypeScript type checking
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest server/__tests__/db-storage.test.ts
```

### Test Structure

Tests are located in:
- `server/__tests__/` - Backend tests
- `client/src/__tests__/` - Frontend tests

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   
   # Verify connection string in .env
   # Check firewall settings
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   
   # Kill the process
   kill -9 <PID>
   ```

3. **Module Not Found Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **TypeScript Errors**
   ```bash
   # Check TypeScript configuration
   npm run check
   
   # Restart TypeScript server in IDE
   ```

5. **File Upload Issues**
   ```bash
   # Check upload directory exists
   mkdir -p uploads/documents uploads/bug-attachments uploads/profile-pictures
   
   # Check file permissions
   chmod 755 uploads/
   ```

### Environment-Specific Issues

**Replit:**
- Ensure DATABASE_URL is set correctly
- Check that ports are properly configured
- Verify SSL settings for database connection

**Local Development:**
- Ensure PostgreSQL service is running
- Check firewall settings
- Verify node version compatibility

### Performance Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_test_cases_project_id ON test_cases(project_id);
   CREATE INDEX idx_bugs_project_id ON bugs(project_id);
   CREATE INDEX idx_documents_folder_id ON documents(folder_id);
   ```

2. **Frontend Optimization**
   - Use React.memo for expensive components
   - Implement virtualization for large lists
   - Use React Query's caching effectively

3. **Backend Optimization**
   - Use connection pooling
   - Implement proper error handling
   - Use appropriate HTTP status codes

## Additional Features

### 1. File Upload Configuration

Supported file types:
- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX
- Spreadsheets: CSV, XLS, XLSX

### 2. Security Features

- JWT authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- File upload validation

### 3. Export/Import Features

- CSV export for test cases and bugs
- PDF report generation
- Excel export for data analysis

## Support

For issues and questions:
1. Check this documentation
2. Review error logs in browser console
3. Check server logs
4. Verify database connectivity
5. Ensure all dependencies are installed

## Version Information

- **Node.js:** 18+
- **React:** 18.3.1
- **TypeScript:** 5.6.3
- **PostgreSQL:** 13+
- **Vite:** 5.4.14

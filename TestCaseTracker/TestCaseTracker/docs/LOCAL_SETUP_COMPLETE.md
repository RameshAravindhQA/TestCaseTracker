
# TestCaseTracker - Complete Local Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Project Installation](#project-installation)
4. [Environment Configuration](#environment-configuration)
5. [Upload Directories](#upload-directories)
6. [Running the Application](#running-the-application)
7. [Feature Configuration](#feature-configuration)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **PostgreSQL 13+** - Download from [postgresql.org](https://www.postgresql.org/download/)
- **Git** - For version control
- **Code Editor** - VS Code recommended

### Verify Installation
```bash
node --version
npm --version
psql --version
```

## Database Setup

### 1. Install PostgreSQL

**Windows:**
1. Download PostgreSQL installer
2. Run installer with default settings
3. Remember the password you set for 'postgres' user

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Or on Windows
psql -U postgres
```

In PostgreSQL shell:
```sql
-- Create database
CREATE DATABASE testcasetracker;

-- Create user
CREATE USER testuser WITH ENCRYPTED PASSWORD 'testpassword';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE testcasetracker TO testuser;
GRANT ALL ON SCHEMA public TO testuser;

-- Exit
\q
```

### 3. Test Database Connection
```bash
psql -h localhost -U testuser -d testcasetracker -c "SELECT version();"
```

## Project Installation

### 1. Clone/Download Project
```bash
# If using Git
git clone <repository-url>
cd TestCaseTracker/TestCaseTracker

# Or download and extract ZIP file
```

### 2. Install Dependencies
```bash
# Navigate to project directory
cd TestCaseTracker/TestCaseTracker

# Install all dependencies
npm install
```

### 3. Verify Installation
```bash
# Check if node_modules was created
ls node_modules

# Verify key packages
npm list express react postgres drizzle-orm
```

## Environment Configuration

### 1. Create Environment File
Create `.env` file in project root:

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
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
PORT=5000
CLIENT_ROOT=./client

# Security
SESSION_SECRET=your-session-secret-change-this-in-production-67890
SESSION_MAX_AGE=86400000

# Email Configuration (Gmail)
EMAIL_PASSWORD=your-gmail-app-password-here

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Server Configuration
BASE_URL=http://localhost:5000
```

### 2. Gmail App Password Setup
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification (enable if not already)
3. Security → 2-Step Verification → App passwords
4. Generate app password for "Mail"
5. Copy 16-character password to EMAIL_PASSWORD in .env

## Upload Directories

### 1. Create Required Directories
```bash
# Create all upload directories
mkdir -p uploads/bug-attachment
mkdir -p uploads/documents
mkdir -p uploads/profile-pictures
mkdir -p uploads/temp
mkdir -p uploads/notebooks
mkdir -p uploads/employee-documents
mkdir -p uploads/messenger-attachments
mkdir -p uploads/project-exports
mkdir -p uploads/test-data
mkdir -p uploads/automation-scripts
mkdir -p uploads/brd-documents

# Set permissions (Linux/Mac)
chmod 755 uploads/
chmod 755 uploads/*
```

### 2. Directory Structure
```
uploads/
├── bug-attachment/       # Bug report attachments
├── documents/           # General document storage
├── profile-pictures/    # User profile images
├── temp/               # Temporary file processing
├── notebooks/          # Notebook attachments
├── employee-documents/ # Employee-related documents
├── messenger-attachments/ # Chat attachments
├── project-exports/    # Exported project files
├── test-data/         # Test data files
├── automation-scripts/ # Automation scripts
└── brd-documents/     # Business Requirement Documents
```

## Running the Application

### 1. Database Migration
```bash
# Generate migration files (if schema changes)
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Verify database tables created
psql -h localhost -U testuser -d testcasetracker -c "\dt"
```

### 2. Start Development Server
```bash
# Start the application
npm run dev
```

This will:
- Start Express server on http://localhost:5000
- Start Vite dev server on http://localhost:5173
- Open application in browser automatically

### 3. Verify Application
1. **Backend API**: Visit http://localhost:5000/api/health
2. **Frontend**: Visit http://localhost:5173
3. **Login**: Create admin account or use demo credentials

### 4. Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Feature Configuration

### 1. Initial Admin Account
Create admin account on first run or use database:

```sql
-- Connect to database
psql -h localhost -U testuser -d testcasetracker

-- Create admin user
INSERT INTO users (email, first_name, last_name, password, role, status) 
VALUES ('admin@yourcompany.com', 'Admin', 'User', '$2a$10$hashed_password', 'Admin', 'Active');
```

### 2. Module-Specific Configuration

**Notebooks**: 
- Upload directory: `uploads/notebooks/`
- Supported formats: PDF, DOC, DOCX, TXT, MD

**Employee Management**:
- Upload directory: `uploads/employee-documents/`
- CSV import supported for bulk employee data

**Messenger**:
- Upload directory: `uploads/messenger-attachments/`
- Supports images, documents, audio files

**GitHub Integration**:
1. Create GitHub OAuth App
2. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env
3. Configure in application settings

### 3. AI Generator Setup
1. Get API key from OpenAI or Google Gemini
2. Add to application settings via UI
3. Configure in Settings → AI API Configuration

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:generate # Generate migration files
npm run db:migrate  # Apply migrations
npm run db:studio   # Open database studio (if available)

# Testing
npm run test        # Run tests
npm run test:coverage # Run with coverage

# Utilities
npm run check       # TypeScript type checking
npm run lint        # Code linting
```

## Troubleshooting

### Database Issues

**Connection Failed**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U testuser -d testcasetracker

# Check .env DATABASE_URL format
```

**Permission Denied**:
```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Grant all permissions
GRANT ALL ON DATABASE testcasetracker TO testuser;
GRANT ALL ON SCHEMA public TO testuser;
GRANT ALL ON ALL TABLES IN SCHEMA public TO testuser;
```

### Port Issues

**Port 5000 in use**:
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3000
```

### File Upload Issues

**Permission Denied**:
```bash
# Set correct permissions
sudo chown -R $USER:$USER uploads/
chmod -R 755 uploads/
```

**Upload Directory Missing**:
```bash
# Recreate directories
mkdir -p uploads/{bug-attachment,documents,profile-pictures,temp,notebooks,employee-documents,messenger-attachments,project-exports,test-data,automation-scripts,brd-documents}
```

### Email Issues

**Gmail Authentication Failed**:
1. Verify 2FA is enabled
2. Use App Password, not regular password
3. Check EMAIL_PASSWORD in .env
4. Test with Gmail SMTP directly

### Module-Specific Issues

**Import Features Not Working**:
1. Check upload directories exist
2. Verify file permissions
3. Check supported file formats
4. Review server logs for errors

### Performance Issues

**Slow Loading**:
1. Check database connection pool settings
2. Verify adequate system resources
3. Monitor database query performance
4. Check network connectivity

### Development Issues

**Hot Reload Not Working**:
```bash
# Clear cache and restart
rm -rf node_modules/.cache
npm run dev
```

**TypeScript Errors**:
```bash
# Check TypeScript configuration
npm run check

# Clear TypeScript cache
rm -rf node_modules/.cache
```

## Security Considerations

1. **Change default passwords** in production
2. **Use strong JWT secrets** (32+ characters)
3. **Enable HTTPS** in production
4. **Regular security updates** for dependencies
5. **Backup database** regularly
6. **Monitor application logs** for security issues

## Support

For issues not covered in this guide:
1. Check server logs: `tail -f server.log`
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test database connectivity separately
5. Check file permissions on upload directories

## Production Deployment

For production deployment on Replit:
1. Use Replit's PostgreSQL database
2. Configure secrets in Replit Secrets panel
3. Use HTTPS URLs for OAuth callbacks
4. Set NODE_ENV=production
5. Use deployment-specific configuration

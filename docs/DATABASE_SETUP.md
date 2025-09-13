
# PostgreSQL Database Setup Guide

## Prerequisites

- PostgreSQL 13+ installed
- Node.js 18+ 
- npm or yarn package manager

## Local Development Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database and User

```bash
# Access PostgreSQL as postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE testcasetracker;

# Create user with password
CREATE USER testuser WITH ENCRYPTED PASSWORD 'testpassword';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE testcasetracker TO testuser;

# Exit PostgreSQL
\q
```

### 3. Environment Variables

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
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
```

### 4. Database Migration

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed database (if needed)
npm run db:seed
```

## Production Setup

### 1. Replit PostgreSQL Setup

In your Replit project:

1. Go to the "Database" tab in the sidebar
2. Click "Create Database" and select "PostgreSQL"
3. Note the connection details provided
4. Update your environment variables with the provided credentials

### 2. Environment Variables for Production

```env
DATABASE_URL=postgresql://username:password@host:port/database
DB_SSL=true
NODE_ENV=production
```

## Database Schema

The application uses the following main tables:

- `users` - User authentication and profiles
- `projects` - Project management
- `modules` - Project modules/components
- `test_cases` - Test case management
- `bugs` - Bug tracking
- `documents` - Document management
- `document_folders` - Document organization
- `timesheets` - Time tracking

## Connection Pool Configuration

```typescript
const client = postgres(connectionString, {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "testcasetracker",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20,                    // Maximum connections
  idle_timeout: 20,           // Idle timeout in seconds
  connect_timeout: 10,        // Connection timeout in seconds
});
```

## Backup and Restore

### Backup
```bash
pg_dump -h localhost -U testuser -d testcasetracker > backup.sql
```

### Restore
```bash
psql -h localhost -U testuser -d testcasetracker < backup.sql
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Check if PostgreSQL service is running
2. **Authentication failed**: Verify username/password in .env
3. **Database does not exist**: Create the database manually
4. **SSL errors**: Set DB_SSL=false for local development

### Checking Connection

```bash
# Test database connection
psql -h localhost -U testuser -d testcasetracker -c "SELECT version();"
```

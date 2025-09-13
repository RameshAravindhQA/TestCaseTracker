
# PostgreSQL Database Migration Guide

This guide will help you migrate from in-memory storage to PostgreSQL database connectivity in Replit.

## Step 1: Create PostgreSQL Database in Replit

1. Open a new tab in Replit and type "Database"
2. In the "Database" panel, click "create a database"
3. Your database connection information will be available in the env section

## Step 2: Install Required Dependencies

The project already includes the necessary dependencies:
- `drizzle-orm` - ORM for database operations
- `drizzle-kit` - Database migration tool
- `pg` - PostgreSQL client
- `@types/pg` - TypeScript types

## Step 3: Environment Configuration

Replit automatically sets up these environment variables when you create a database:
- `DATABASE_URL` - Complete connection string
- `PGHOST` - Database host
- `PGPORT` - Database port
- `PGDATABASE` - Database name
- `PGUSER` - Database user
- `PGPASSWORD` - Database password

## Step 4: Update Database Connection

The application is already configured to check for `DATABASE_URL`. When present, it uses PostgreSQL; otherwise, it falls back to in-memory storage.

Current configuration in `server/db.ts`:
```typescript
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log("⚠️  DATABASE_URL not found, using in-memory storage");
} else {
  console.log("🔄 Connecting to PostgreSQL database...");
  // PostgreSQL connection code
}
```

## Step 5: Database Schema Migration

Run the database migration to create all required tables:

```bash
cd TestCaseTracker/TestCaseTracker
npx drizzle-kit push:pg
```

## Step 6: Switch Storage Implementation

Update the storage service to use database storage:

In `server/index.ts`, change:
```typescript
// From:
import { storage } from "./storage"; // In-memory storage

// To:
import { storage } from "./db-storage"; // Database storage
```

## Step 7: Verify Database Connection

The application will automatically test the database connection on startup. Look for these messages:

✅ Success messages:
- "✅ Database connection established with PostgreSQL driver"
- "✅ Database connection test successful"

❌ Error messages:
- "❌ Database connection failed"
- "❌ Database connection test failed"

## Step 8: Data Migration (Optional)

If you have existing data in memory storage that you want to preserve:

1. Export your current data using the export features
2. Import the data through the UI after switching to PostgreSQL

## Step 9: Connection Pooling (Recommended)

For better performance, the application uses connection pooling:

```typescript
pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});
```

## Troubleshooting

### Connection Issues
- Verify `DATABASE_URL` is properly set in environment
- Check if the database is running (Neon databases sleep after 5 minutes of inactivity)
- Ensure SSL configuration matches your database requirements

### Migration Issues
- Run `npx drizzle-kit generate:pg` to generate migrations
- Run `npx drizzle-kit push:pg` to apply schema changes

### Performance Issues
- Connection pooling is enabled by default
- Use the connection pooler URL (replace `.us-east-2` with `-pooler.us-east-2`)
- Monitor query performance in the database logs

## Database Schema Overview

The application creates these main tables:
- `users` - User accounts and authentication
- `projects` - Project management
- `modules` - Project modules
- `test_cases` - Test case management
- `bugs` - Bug tracking
- `documents` - Document storage
- `activities` - Activity logging
- `notifications` - User notifications
- `chat_messages` - Messaging system
- `flow_diagrams` - Flow diagram storage

## Backup and Recovery

Replit PostgreSQL databases include:
- Automatic daily backups
- Point-in-time recovery
- Export capabilities through the database panel

## Monitoring

Monitor your database through:
- Replit Database panel
- Application logs
- Query performance metrics
- Connection pool status

## Security Considerations

- All connections use SSL in production
- Connection strings are automatically secured
- User data is encrypted at rest
- Regular security updates are applied automatically

## Support

If you encounter issues:
1. Check the application logs for specific error messages
2. Verify environment variables are properly set
3. Test the database connection manually
4. Consult Replit's PostgreSQL documentation

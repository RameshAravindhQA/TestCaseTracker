# TestCaseTracker - Organized Folder Structure

## Current Structure Analysis

The project currently has redundant nested folders. Here's the proposed clean organization:

## Recommended Structure

```
TestCaseTracker/
├── README.md                    # Main project documentation
├── package.json                 # Project dependencies
├── package-lock.json            # Dependency lock file
├── replit.toml                  # Replit configuration
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite bundler configuration
├── postcss.config.js            # PostCSS configuration
├── components.json              # shadcn/ui components config
├── drizzle.config.ts            # Database configuration
├── 
├── docs/                        # Documentation files
│   ├── DATABASE_SETUP.md        # Database setup guide
│   ├── DEPENDENCIES.md          # Dependencies documentation
│   ├── QUICK_START.md           # Quick start guide
│   ├── SETUP_GUIDE.md           # Detailed setup guide
│   └── workflow_instructions.md # Workflow documentation
│
├── client/                      # Frontend React application
│   ├── index.html               # Main HTML file
│   ├── public/                  # Static assets
│   └── src/                     # React source code
│       ├── components/          # React components
│       ├── pages/               # Application pages
│       ├── hooks/               # Custom hooks
│       ├── lib/                 # Utilities and helpers
│       ├── types/               # TypeScript type definitions
│       └── __tests__/           # Frontend tests
│
├── server/                      # Backend Node.js application
│   ├── index.ts                 # Main server entry point
│   ├── routes.ts                # API routes
│   ├── storage.ts               # Storage abstraction
│   ├── db-storage.ts            # Database storage implementation
│   ├── auth-middleware.ts       # Authentication middleware
│   ├── websocket-setup.ts       # WebSocket configuration
│   ├── chat-service.ts          # Chat service implementation
│   ├── email-service.ts         # Email service
│   ├── automation-service.ts    # Automation service
│   ├── matrix-fix.ts            # Matrix operations
│   ├── logger.ts                # Logging utility
│   ├── oauth-service.ts         # OAuth service
│   ├── openai-service.ts        # OpenAI integration
│   └── vite.ts                  # Vite integration
│
├── shared/                      # Shared code between client and server
│   ├── schema.ts                # Database schema (Drizzle)
│   ├── functional-flow-types.ts # Flow diagram types
│   └── github-types.ts          # GitHub integration types
│
├── db/                          # Database related files
│   └── index.ts                 # Database connection
│
├── uploads/                     # File uploads directory
│   ├── profile-pictures/        # User profile pictures
│   ├── documents/               # Document uploads
│   └── bug-attachments/         # Bug report attachments
│
├── assets/                      # Project assets
│   ├── images/                  # Image files
│   └── icons/                   # Icon files
│
├── scripts/                     # Build and deployment scripts
│   ├── dev.js                   # Development server script
│   ├── start-server.js          # Production server script
│   └── build.sh                 # Build script
│
└── config/                      # Configuration files
    ├── env/                     # Environment configurations
    └── deployment/              # Deployment configurations
```

## Files to Clean Up

### Duplicate Files to Remove:
- TestCaseTracker/TestCaseTracker/ (nested duplicate)
- Duplicate package.json files
- Duplicate documentation files
- Redundant configuration files

### Files to Consolidate:
- Move all documentation to docs/
- Move all scripts to scripts/
- Move configuration files to config/
- Consolidate assets to assets/

## Action Plan

1. **Create clean directory structure**
2. **Move files to appropriate locations**
3. **Remove duplicate files**
4. **Update configuration paths**
5. **Update documentation references**
6. **Test the reorganized structure**
# TestCaseTracker - Test Case Management System

## Overview

TestCaseTracker is a comprehensive test case management system built with modern web technologies. It provides a complete solution for managing test cases, bugs, projects, team collaboration, and traceability matrices with real-time communication features.

## Project Structure

```
organized_testcase_tracker/
├── README.md                    # This file
├── package.json                 # Project dependencies
├── package-lock.json            # Dependency lock file
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
│
├── server/                      # Backend Node.js application
│   ├── index.ts                 # Main server entry point
│   ├── routes.ts                # API routes
│   ├── storage.ts               # Storage abstraction
│   └── ...                      # Other server files
│
├── shared/                      # Shared code between client and server
│   ├── schema.ts                # Database schema (Drizzle)
│   └── ...                      # Other shared files
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
│   ├── attached_assets/         # Attached assets
│   ├── static/                  # Static files
│   └── templates/               # Template files
│
├── scripts/                     # Build and deployment scripts
│   ├── start.sh                 # Start script
│   ├── restart_server.sh        # Restart script
│   └── ...                      # Other scripts
│
└── config/                      # Configuration files
    ├── components.json          # shadcn/ui components config
    ├── drizzle.config.ts        # Database configuration
    ├── postcss.config.js        # PostCSS configuration
    ├── tailwind.config.ts       # Tailwind CSS configuration
    ├── tsconfig.json            # TypeScript configuration
    ├── vite.config.ts           # Vite bundler configuration
    └── vitest.config.ts         # Vitest test configuration
```

## Getting Started

1. Navigate to the project directory
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser to access the application

## Features

- Test case management with CRUD operations
- Bug tracking and reporting
- Project management with team collaboration
- Real-time chat and notifications
- Traceability matrix with custom markers
- Functional Flow Designer
- Document management system
- Time tracking and reporting
- Role-based access control
- GitHub integration for issue tracking

## Architecture

- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js with TypeScript, WebSocket support
- **Database**: PostgreSQL with Drizzle ORM (with in-memory fallback)
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **State Management**: TanStack Query for server state
- **Real-time**: WebSocket for chat and live collaboration
# TestCaseTracker - Replit.md

## Overview

TestCaseTracker is a comprehensive test case management system built with TypeScript, React, and Express. It provides a complete solution for managing test cases, bugs, projects, and team collaboration in software testing environments. The application uses an in-memory storage system (with optional PostgreSQL support) and includes features like real-time chat, document management, traceability matrices, and reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Architecture
- **Frontend**: React 18+ with TypeScript using Vite as the build tool
- **Backend**: Express.js with TypeScript in ES modules
- **Database**: In-memory storage with optional PostgreSQL support via Drizzle ORM
- **Real-time Communication**: WebSocket integration for chat functionality
- **UI Framework**: Tailwind CSS with Radix UI components (shadcn/ui)
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

### Key Components

#### Frontend Architecture
- **Component Structure**: Modular React components with TypeScript
- **Styling**: Tailwind CSS with custom design system variables
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion for smooth UI interactions

#### Backend Architecture
- **API Design**: RESTful API with Express.js
- **Authentication**: JWT-based authentication with role-based access control
- **File Handling**: Multer for file uploads with Sharp for image processing
- **Email Service**: Nodemailer integration for notifications
- **WebSocket**: Real-time chat and collaboration features

#### Storage Layer
- **Primary Storage**: In-memory storage system for development
- **Database Integration**: Optional PostgreSQL with Drizzle ORM
- **Schema**: Comprehensive schema supporting projects, test cases, bugs, users, and more
- **Migration System**: Drizzle Kit for database migrations

## Data Flow

### User Authentication Flow
1. User registers/logs in through React frontend
2. Backend validates credentials and issues JWT token
3. Token stored in client and sent with subsequent requests
4. Role-based access control enforced on API endpoints

### Test Case Management Flow
1. Users create projects and add team members
2. Modules are created within projects for organization
3. Test cases are created with auto-generated IDs (TC-001, TC-002, etc.)
4. Bug reports can be linked to test cases
5. Real-time updates through WebSocket connections

### Real-time Communication
1. WebSocket connection established on user login
2. Chat messages broadcast to project participants
3. Typing indicators and presence management
4. File sharing and mentions support

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: UI component primitives
- **drizzle-orm**: Database ORM (optional)
- **express**: Web framework
- **ws**: WebSocket implementation
- **jsonwebtoken**: JWT authentication
- **bcrypt**: Password hashing
- **multer**: File upload handling
- **nodemailer**: Email service
- **recharts**: Data visualization
- **framer-motion**: Animations

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type system
- **tailwindcss**: CSS framework
- **vitest**: Testing framework
- **tsx**: TypeScript execution

## Deployment Strategy

### Development Setup
1. Clone repository and install dependencies with `npm install`
2. Set up environment variables (DATABASE_URL optional)
3. Run database migrations if using PostgreSQL: `npm run db:migrate`
4. Start development server: `npm run dev`
5. Application serves on port 5000 with frontend on port 5173

### Production Deployment
1. Build application: `npm run build`
2. Start production server: `npm start`
3. Configure environment variables for production
4. Set up PostgreSQL database if not using in-memory storage

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (optional)
- **JWT_SECRET**: Secret key for JWT tokens
- **EMAIL_PASSWORD**: App password for email service
- **NODE_ENV**: Environment mode (development/production)

### Key Features
- **Project Management**: Create and manage testing projects
- **Test Case Management**: Comprehensive test case creation and tracking
- **Bug Tracking**: Bug reporting with severity levels and status tracking
- **User Management**: Role-based access control (Admin, Manager, Developer, Tester)
- **Real-time Chat**: Project-based chat with file sharing
- **Document Management**: File upload and organization system
- **Reporting**: Consolidated reports and analytics
- **Traceability Matrix**: Requirements to test case traceability
- **Kanban Board**: Visual project management
- **Time Tracking**: Time sheet management for team members

The application is designed to be scalable and maintainable, with clear separation of concerns and comprehensive error handling throughout the system.

## Recent Changes (Latest Session)
- **Fixed messenger import error** - Resolved named vs default export mismatch preventing component loading
- **Enhanced WebSocket connections** - Added robust reconnection with exponential backoff, heartbeat system, and offline fallback for reliable real-time messaging
- **Added Global GitHub Issue Reporter** - Created floating bug icon with screenshot capture, screen recording, comprehensive bug templates, and dual system/GitHub integration
- **Fixed Replit run configuration** - Created proper workflow setup with clean startup script to prevent duplicate processes
- **Server Configuration** - Application running on port 5000 with WebSocket support on /ws path, clean startup without duplicate output
- **Date**: July 9, 2025
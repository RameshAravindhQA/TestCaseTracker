# TestCaseTracker - Replit Project Guide

## Overview

TestCaseTracker is a comprehensive test case management system built with React (frontend) and Express.js (backend). It provides a complete platform for managing test cases, bugs, projects, and team collaboration in software testing environments. The application features modern UI components, real-time communication, and robust project management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite with custom configuration for Replit compatibility
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling and animations

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: Dual-mode storage - PostgreSQL with Drizzle ORM (preferred) or in-memory storage (fallback)
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Real-time Communication**: Socket.io for chat functionality and live updates
- **File Management**: Multer for file uploads with image processing via Sharp
- **API Design**: RESTful endpoints with comprehensive error handling

## Key Components

### Database Layer
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Fallback Storage**: In-memory storage system for development when database is unavailable
- **Schema Management**: Comprehensive schema covering users, projects, test cases, bugs, documents, and traceability
- **Migration System**: Drizzle Kit for database schema versioning and migrations

### Authentication & Authorization
- **Authentication Method**: JWT tokens with secure cookie-based sessions
- **Role-based Access Control**: Four-tier system (Admin, Manager, Developer, Tester)
- **Session Management**: Express sessions with configurable expiration
- **Password Security**: bcrypt hashing with salt rounds for secure password storage

### Core Features
- **Project Management**: Multi-project support with member management and role assignments
- **Test Case Management**: Complete test case lifecycle from creation to execution
- **Bug Tracking**: Comprehensive bug reporting with severity levels and assignment workflows
- **Document Management**: File upload, organization, and collaborative document editing
- **Real-time Chat**: Project-based messaging with file sharing and user mentions
- **Traceability Matrix**: Requirements-to-test case mapping for compliance tracking
- **Reporting System**: Consolidated reports with data visualization and export capabilities

## Data Flow

### Client-Server Communication
1. **Frontend Requests**: React components use TanStack Query for API calls
2. **Authentication Layer**: JWT middleware validates requests before reaching endpoints
3. **Route Processing**: Express routes handle business logic and data validation
4. **Storage Layer**: Drizzle ORM or in-memory storage handles data persistence
5. **Response Handling**: Standardized JSON responses with error handling

### Real-time Updates
1. **WebSocket Connection**: Socket.io establishes persistent connections for real-time features
2. **Event Broadcasting**: Server broadcasts updates to relevant clients
3. **State Synchronization**: Frontend automatically updates UI based on real-time events

## External Dependencies

### Core Technologies
- **Node.js 18+**: Runtime environment
- **PostgreSQL 13+**: Primary database (optional in Replit environment)
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Build tool with HMR for development

### Major Libraries
- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI, Tailwind CSS, Lucide React icons
- **Backend Stack**: Express.js, Socket.io, Drizzle ORM
- **Authentication**: JWT, bcrypt
- **File Processing**: Multer, Sharp
- **Development Tools**: tsx, Vitest, ESLint

### Replit-Specific
- **@replit/vite-plugin-cartographer**: Development tooling for Replit environment
- **@replit/vite-plugin-runtime-error-modal**: Enhanced error reporting in development

## Deployment Strategy

### Development Mode
1. **Automatic Fallback**: Application detects database availability and falls back to in-memory storage
2. **Hot Module Replacement**: Vite provides instant updates during development
3. **Error Handling**: Comprehensive error boundaries and logging for debugging

### Production Considerations
1. **Database Setup**: PostgreSQL configuration via DATABASE_URL environment variable
2. **Environment Variables**: Secure configuration for JWT secrets, email credentials, and database connections
3. **Build Process**: TypeScript compilation and Vite bundling for optimized production builds
4. **Asset Management**: Static file serving with proper caching headers

### Replit-Specific Setup
1. **Port Configuration**: Default port 5000 with automatic Replit preview detection
2. **File Structure**: Optimized directory structure for Replit's build system
3. **Dependency Management**: Lockfile optimization for faster Replit deployments

## Changelog

```
Changelog:
- July 08, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
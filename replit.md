# TestCaseTracker - Test Case Management System

## Overview

TestCaseTracker is a comprehensive test case management system designed for software development teams. It combines project management, test case creation, bug tracking, and team collaboration features into a unified platform. The application provides a complete solution for managing the entire software testing lifecycle from requirements to test execution and reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript for type safety and modern development
- **Build Tool**: Vite with custom configuration optimized for Replit deployment
- **Styling**: Tailwind CSS framework with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling and animations

### Backend Architecture
- **Framework**: Express.js with TypeScript for robust API development
- **Database**: Dual-mode storage system - PostgreSQL with Drizzle ORM (preferred) or in-memory storage (fallback)
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
- **Test Sheets**: Spreadsheet-like interface for test data management
- **Kanban Board**: Visual project management with drag-and-drop functionality
- **Functional Flow Diagrams**: Visual representation of system flows and processes

## Data Flow

### Client-Server Communication
1. **Authentication Flow**: User login → JWT token generation → Session establishment
2. **API Requests**: Client makes REST API calls → Server processes → Database operations → Response
3. **Real-time Updates**: WebSocket connections for instant chat and notifications
4. **File Uploads**: Multer middleware processes files → Sharp for image processing → File storage

### Database Operations
1. **Primary Mode**: Application uses PostgreSQL with Drizzle ORM for production
2. **Fallback Mode**: In-memory storage for development when database is unavailable
3. **Data Persistence**: All entities (users, projects, test cases, bugs) are stored with full CRUD operations
4. **Relationships**: Foreign key relationships maintained between entities

## External Dependencies

### Production Dependencies
- **Database**: PostgreSQL with Drizzle ORM and Neon Database serverless driver
- **Authentication**: JWT for tokens, bcrypt for password hashing
- **UI Framework**: React with Radix UI components and Tailwind CSS
- **Real-time**: Socket.io for WebSocket connections
- **File Processing**: Multer for uploads, Sharp for image processing
- **Email**: Nodemailer for notification emails
- **Validation**: Zod for schema validation

### Development Dependencies
- **Build Tools**: Vite for frontend bundling, esbuild for server bundling
- **Testing**: Vitest for unit and integration testing
- **Type Checking**: TypeScript for static type analysis
- **Code Quality**: ESLint and Prettier for code formatting

## Deployment Strategy

### Replit Deployment
- **Environment**: Optimized for Replit with custom Vite configuration
- **Port Configuration**: Uses environment PORT or defaults to 5000
- **Static Files**: Serves built frontend from dist directory
- **Database**: Supports both PostgreSQL (production) and in-memory (development)

### Build Process
1. **Frontend**: Vite builds React application to client/dist
2. **Backend**: esbuild compiles TypeScript server to dist/server
3. **Database**: Drizzle Kit handles schema migrations
4. **Assets**: Static files served from public directories

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default 5000)
- `EMAIL_PASSWORD`: SMTP password for email service

### Error Handling
- **Graceful Degradation**: Falls back to in-memory storage if database unavailable
- **Comprehensive Logging**: Structured logging throughout the application
- **Error Boundaries**: React error boundaries for frontend error handling
- **API Error Responses**: Consistent error response format across all endpoints
# TestCaseTracker - Replit Project Guide

## Overview

TestCaseTracker is a comprehensive test case management system built with React (frontend) and Express.js (backend). It provides a complete platform for managing test cases, bugs, projects, and team collaboration with real-time features. The application is designed to be a full-featured QA management tool suitable for software development teams.

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
1. React frontend makes API calls to Express backend
2. Backend validates requests and manages authentication
3. Data persistence through Drizzle ORM or in-memory storage
4. Real-time updates via Socket.io WebSocket connections
5. File uploads handled through Multer middleware
6. Response data formatted and sent back to client

### Database Operations
- All CRUD operations abstracted through storage interface
- Automatic ID generation for entities (test cases, bugs, modules)
- Transactional support for complex operations
- Data validation at both client and server levels

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon DB
- **drizzle-orm**: Type-safe database operations
- **bcrypt**: Password hashing and authentication security
- **socket.io**: Real-time WebSocket communication
- **archiver**: File compression and export functionality

### UI Dependencies
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Server state management and caching
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library for UI components

### Development Dependencies
- **tsx**: TypeScript execution for development
- **vitest**: Testing framework with built-in TypeScript support
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Development Environment
- Hot module replacement through Vite
- TypeScript compilation via tsx
- In-memory storage fallback for quick development
- Socket.io development server integration

### Production Deployment
- Static file serving for built React application
- Express server handles API routes and WebSocket connections
- PostgreSQL database for persistent data storage
- Environment-based configuration management

### Replit Configuration
- Custom Vite configuration for Replit environment
- WebSocket port separation to avoid conflicts
- Static asset serving from dist directory
- Development and production build processes

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- ✓ Successfully organized project into single clean folder structure
- ✓ Fixed critical syntax errors in storage.ts and routes.ts files
- ✓ Installed all missing dependencies (cors, socket.io, ws, bcrypt, etc.)
- ✓ Resolved websocket import issues for real-time chat functionality
- ✓ Application now running successfully on port 5000
- ✓ Database integrated with in-memory fallback storage
- ✓ File upload directories properly configured
- ✓ Admin user account created for initial access

## Changelog

- July 08, 2025: Initial setup and successful application deployment
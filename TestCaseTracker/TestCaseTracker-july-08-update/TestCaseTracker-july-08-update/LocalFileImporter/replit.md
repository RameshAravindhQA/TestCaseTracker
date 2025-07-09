# TestCaseTracker - Replit Project Guide

## Overview

TestCaseTracker is a comprehensive test case management system built with React (frontend) and Express.js (backend). It provides a complete platform for managing test cases, bugs, projects, and team collaboration with features like real-time chat, document management, and traceability matrices.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite with custom configuration
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight routing
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (fallback to in-memory storage)
- **Authentication**: JWT-based with bcrypt for password hashing
- **Real-time**: Socket.io for chat and notifications
- **File Upload**: Multer for handling file uploads
- **API**: RESTful endpoints with comprehensive CRUD operations

## Key Components

### Database Layer
- **Primary**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Fallback**: In-memory storage for development/testing when database is unavailable
- **Schema**: Comprehensive schema covering users, projects, test cases, bugs, documents, and more
- **Migrations**: Drizzle Kit for database schema management

### Authentication & Authorization
- **JWT Authentication**: Token-based authentication with refresh tokens
- **Role-based Access Control**: Admin, Manager, Developer, Tester roles
- **Session Management**: Express sessions with secure cookie handling
- **Password Security**: bcrypt hashing with salt rounds

### Core Features
- **Project Management**: Create, manage, and track multiple projects
- **Test Case Management**: Comprehensive test case creation, execution, and tracking
- **Bug Tracking**: Bug reporting, assignment, and resolution tracking
- **Document Management**: File upload, organization, and sharing
- **Real-time Chat**: Project-based chat with file sharing and mentions
- **Traceability Matrix**: Requirements-to-test case mapping
- **Reporting**: Consolidated reports and analytics

## Data Flow

### Client-Server Communication
1. **API Requests**: Frontend uses TanStack Query for server state management
2. **Real-time Updates**: Socket.io for instant notifications and chat
3. **File Uploads**: Multipart form data handling for document uploads
4. **Error Handling**: Comprehensive error boundaries and toast notifications

### Database Operations
1. **Connection Management**: PostgreSQL connection pooling
2. **Query Optimization**: Efficient queries with proper indexing
3. **Transaction Management**: ACID compliance for critical operations
4. **Backup Strategy**: Regular automated backups (production)

## External Dependencies

### Core Backend Dependencies
- **express**: Web framework
- **drizzle-orm**: Type-safe database operations
- **@neondatabase/serverless**: PostgreSQL driver
- **jsonwebtoken**: JWT authentication
- **bcrypt**: Password hashing
- **socket.io**: Real-time communication
- **multer**: File upload handling
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware

### Core Frontend Dependencies
- **react**: UI library
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing
- **lucide-react**: Icon library
- **recharts**: Data visualization

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot reload
- **Database**: PostgreSQL (local) or in-memory fallback
- **Environment Variables**: `.env` file for configuration
- **Testing**: Vitest for unit and integration tests

### Production Deployment
- **Build Process**: Vite build for optimized production bundle
- **Database**: PostgreSQL with connection pooling
- **Static Assets**: Served via Express static middleware
- **Process Management**: PM2 or similar for production process management
- **SSL/TLS**: HTTPS termination at load balancer or reverse proxy

### Replit Specific
- **Database**: Replit PostgreSQL addon
- **Environment**: Configured for Replit's hosting environment
- **Ports**: Configured for Replit's port forwarding
- **Secrets**: Use Replit's secrets management for sensitive data

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 07, 2025. Initial setup
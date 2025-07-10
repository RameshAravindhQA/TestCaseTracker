# TestCaseTracker - Replit Configuration

## Overview

TestCaseTracker is a comprehensive test case management system built with modern web technologies. It provides a complete solution for managing test cases, bugs, projects, team collaboration, and traceability matrices. The application features a React-based frontend with a Node.js/Express backend, supporting both in-memory storage and PostgreSQL database persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Architecture
- **Frontend**: React 18+ with TypeScript, built using Vite
- **Backend**: Express.js with TypeScript running in ES modules mode
- **Database**: Dual storage system - in-memory for development, PostgreSQL with Drizzle ORM for production
- **Real-time Features**: WebSocket integration for chat and live collaboration
- **UI Framework**: Tailwind CSS with shadcn/ui components (Radix UI primitives)
- **State Management**: TanStack Query for server state, React Context for auth
- **Routing**: Wouter for lightweight client-side routing

### Key Components

#### Frontend Architecture
- **Component Structure**: Modular React components with TypeScript interfaces
- **Form Management**: React Hook Form with Zod validation schemas
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Charts and Visualization**: Recharts for analytics and reporting
- **File Handling**: Support for CSV import/export, image uploads, and document management

#### Backend Architecture
- **API Design**: RESTful endpoints with comprehensive CRUD operations
- **Authentication**: JWT-based with role-based access control (Admin, Manager, Developer, Tester)
- **File Storage**: Multer for uploads with Sharp for image processing
- **Real-time Communication**: WebSocket server for chat and notifications
- **Email Service**: Nodemailer integration for user notifications

#### Storage Layer
- **Primary Storage**: In-memory storage system for development and testing
- **Database Integration**: PostgreSQL with Drizzle ORM for production
- **Migration System**: Drizzle Kit for schema migrations and database management
- **Data Persistence**: Automatic fallback to in-memory when database unavailable

## Data Flow

### Authentication Flow
1. User registers/logs in through React frontend
2. Backend validates credentials and issues JWT token
3. Token stored in client and included in API requests
4. Role-based permissions enforced on protected routes

### Test Case Management Flow
1. Users create projects and modules through the UI
2. Test cases are created with auto-generated IDs (TC-001, TC-002, etc.)
3. Test execution results are tracked with status updates
4. Traceability matrix links requirements to test cases

### Bug Tracking Flow
1. Bugs are reported with auto-generated IDs (BUG-001, BUG-002, etc.)
2. Bug status lifecycle: Open → In Progress → Resolved → Closed
3. Attachments and comments supported for each bug
4. Integration with GitHub for issue creation

### Real-time Collaboration
1. WebSocket connections established on user authentication
2. Chat messages broadcast to project participants
3. Live updates for test case execution and bug status changes
4. Typing indicators and online user presence

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React 18, React Router (Wouter), React Hook Form
- **UI Libraries**: Radix UI primitives, Tailwind CSS, Lucide React icons
- **Backend Framework**: Express.js, CORS, Helmet for security
- **Database**: PostgreSQL, Drizzle ORM, Neon serverless adapter
- **Authentication**: JWT, bcrypt for password hashing
- **File Processing**: Multer, Sharp for image optimization
- **Real-time**: WebSocket (ws package)
- **Email**: Nodemailer for notifications
- **Testing**: Vitest for unit tests, Supertest for API testing

### Development Tools
- **Build System**: Vite with TypeScript
- **Code Quality**: ESLint, Prettier (implied)
- **Database Tools**: Drizzle Kit for migrations and studio
- **Process Management**: tsx for TypeScript execution

## Deployment Strategy

### Development Environment
- **Server Command**: `npm run dev` starts Express server with tsx
- **Frontend Build**: Vite dev server with HMR on port 24678
- **Database**: Optional PostgreSQL connection, falls back to in-memory
- **File Storage**: Local uploads directory with automatic creation

### Production Considerations
- **Build Process**: `npm run build` creates optimized frontend bundle
- **Database**: PostgreSQL required for production persistence
- **Environment Variables**: DATABASE_URL, JWT_SECRET, EMAIL_PASSWORD
- **Static Files**: Express serves built frontend from dist directory
- **WebSocket**: Configured to avoid conflicts with Vite HMR

### Replit-Specific Setup
- **Port Configuration**: Server runs on port 5000 by default
- **Database**: Can use Replit's PostgreSQL service
- **File System**: Uploads stored in project directory
- **Environment**: Configured for Replit's development environment

### Key Features Supported
1. **Project Management**: Multi-project support with team collaboration
2. **Test Case Management**: Complete CRUD with execution tracking
3. **Bug Tracking**: Full lifecycle management with GitHub integration
4. **Document Management**: File uploads and organization
5. **Reporting**: Analytics dashboard with charts and metrics
6. **Traceability Matrix**: Requirements to test case mapping
7. **Real-time Chat**: Project-based messaging system
8. **Time Tracking**: Timesheet management for team productivity
9. **Kanban Board**: Agile project management interface
10. **Export/Import**: CSV support for data migration

The application is designed to be scalable and maintainable, with clear separation of concerns between frontend and backend, comprehensive error handling, and robust data persistence options.